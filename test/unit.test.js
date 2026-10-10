import { test } from "node:test";
import assert from "node:assert/strict";

process.env.OPENAI_API_KEY ||= "test-key";
const { describeSituation, buildInput, QUESTIONS, SCAM_TYPES } = await import("../src/guardian.js");
const store = await import("../src/store.js");
const { checkSchema, decisionSchema } = await import("../src/validate.js");
const { createLimiter } = await import("../src/limits.js");

const LIVE_CALL = { onCall: true, callType: "whatsapp_video", callerInContacts: false, callMinutes: 38, usualMaxAmount: 15000, payeeAccountAgeDays: 3, payeeReports: 7 };
const pay = (over = {}) => ({ amount: 450000, payeeName: "RBI Verification Cell", payeeId: "rbi.verify2291@okaxis", firstTime: true, ...over });

test("describeSituation writes the live-call signals in plain words", () => {
  const lines = describeSituation(LIVE_CALL, pay());
  assert.match(lines[0], /WhatsApp video call RIGHT NOW with an unknown number .* 38 minutes/);
  assert.ok(lines.some((l) => l.includes("30x")));
  assert.ok(lines.some((l) => l.includes("3 days old")));
  assert.ok(lines.some((l) => l.includes("7 scam reports")));
});

test("describeSituation handles empty, partial and normal situations", () => {
  assert.deepEqual(describeSituation(null, pay()), []);
  assert.deepEqual(describeSituation(undefined, pay()), []);
  assert.deepEqual(describeSituation({ onCall: false }, pay()), ["The payer is not on any call."]);
  const normal = describeSituation({ usualMaxAmount: 8000, payeeReports: 0 }, pay({ amount: 4500 }));
  assert.ok(normal[0].includes("within the payer's normal range"));
  assert.ok(normal[1].includes("no scam reports"));
  // No amount → no ratio sentence (and no NaN)
  assert.ok(!describeSituation({ usualMaxAmount: 8000 }, {}).join(" ").includes("NaN"));
});

test("buildInput with nothing typed says so and includes the signals", () => {
  const text = buildInput({ payment: pay(), situation: LIVE_CALL })[0].content[0].text;
  assert.ok(text.includes("₹4,50,000"));
  assert.ok(text.includes("PHONE & PAYMENT SIGNALS"));
  assert.ok(text.includes("the payer did not type or upload anything"));
  assert.ok(!text.includes("undefined") && !text.includes("NaN"));
});

test("buildInput caps context and images", () => {
  const input = buildInput({ payment: pay(), context: "x".repeat(50000), images: Array(9).fill("data:image/png;base64,AAAA") });
  const parts = input[0].content;
  assert.equal(parts.filter((p) => p.type === "input_image").length, 4);
  assert.ok(parts[0].text.length < 21000);
});

test("question set is well-formed for the Decisions API", () => {
  const names = QUESTIONS.map((q) => q.name);
  assert.equal(new Set(names).size, names.length);
  assert.ok(SCAM_TYPES.some((t) => t.value === "unclear_pattern"));
  assert.equal(SCAM_TYPES.at(-1).value, "legitimate");
});

test("store: only waiting payments can be decided; no approve after block", () => {
  store.clear();
  const held = store.record({ verdict: "hold", probability: 1, payment: pay() });
  assert.equal(held.status, "awaiting_family");
  assert.equal(store.resolve(held.id, "block").error, null);
  assert.equal(store.get(held.id).status, "blocked");
  const again = store.resolve(held.id, "approve");
  assert.equal(again.error, "not_waiting");
  assert.equal(store.get(held.id).status, "blocked");
  assert.equal(store.resolve("nope", "block").error, "not_found");
  const allowed = store.record({ verdict: "allow", probability: 0.05, payment: pay() });
  assert.equal(store.resolve(allowed.id, "approve").error, "not_waiting");
  assert.equal(store.resolve(store.record({ verdict: "hold", payment: pay() }).id, "maybe").error, "bad_decision");
});

test("store: bounded size never evicts a payment still waiting for family", () => {
  store.clear();
  const waiting = store.record({ verdict: "hold", payment: pay() });
  for (let i = 0; i < store.MAX_PAYMENTS + 50; i++) store.record({ verdict: "allow", payment: pay({ amount: 1 }) });
  assert.ok(store.list().length <= store.MAX_PAYMENTS);
  assert.ok(store.get(waiting.id), "held payment must survive eviction");
  store.clear();
  assert.equal(store.list().length, 0);
});

test("store: listeners are cleaned up (no leak warnings with many tabs)", () => {
  assert.ok(store.events.getMaxListeners() >= 100);
});

test("validation rejects bad payments and accepts good ones", () => {
  assert.equal(checkSchema.safeParse({ payment: pay(), situation: LIVE_CALL }).success, true);
  for (const bad of [
    {}, { payment: pay({ amount: 0 }) }, { payment: pay({ amount: -5 }) }, { payment: pay({ amount: "450000" }) },
    { payment: pay(), images: ["http://example.com/x.png"] }, { payment: pay(), images: Array(5).fill("data:image/png;base64,AA") },
    { payment: pay(), language: "fr" }, { payment: pay(), situation: { callMinutes: -1 } }, { payment: pay(), situation: { hacker: true } },
    { payment: { ...pay(), extra: 1 } },
  ]) assert.equal(checkSchema.safeParse(bad).success, false, JSON.stringify(bad).slice(0, 80));
  assert.equal(decisionSchema.safeParse({ decision: "approve" }).success, true);
  assert.equal(decisionSchema.safeParse({ decision: "yes" }).success, false);
});

test("rate limiter allows a burst then refuses, and recovers", () => {
  const allow = createLimiter({ max: 3, windowMs: 1000 });
  assert.deepEqual([allow(0), allow(1), allow(2), allow(3)], [true, true, true, false]);
  assert.equal(allow(1500), true);
});

const { verdictFor, THRESHOLDS } = await import("../src/guardian.js");
const { complete, cautious } = await import("../src/decide.js");
const { checkLimiter } = await import("../src/limits.js");

test("verdictFor: one rule for everything, and it fails toward a pause", () => {
  assert.deepEqual(verdictFor(0.95, 0), { verdict: "hold", reason: "probability" });
  assert.deepEqual(verdictFor(0.6, 2.7), { verdict: "hold", reason: "risk" });
  assert.equal(verdictFor(0.6, 2.2).verdict, "warn");
  assert.equal(verdictFor(0.6, 2, "fallback").verdict, "hold", "fallback risk is whole levels: 'high' holds");
  assert.equal(verdictFor(0.05, 0.4).verdict, "allow");
  assert.equal(verdictFor(undefined, undefined).verdict, "warn", "missing answers never mean allow");
  assert.equal(verdictFor(NaN, NaN).verdict, "warn");
  assert.equal(THRESHOLDS.hold, 0.8);
});

test("complete(): only a full, in-range answer set from the Decisions API is accepted", () => {
  const ok = QUESTIONS.map((q) => q.type === "predicate" ? { type: q.type, name: q.name, probability: 0.9 }
    : q.type === "choice" ? { type: q.type, name: q.name, choice: "digital_arrest" } : { type: q.type, name: q.name, score: 2.9 });
  assert.ok(complete(ok, QUESTIONS));
  assert.equal(complete(ok.slice(1), QUESTIONS), null, "missing question");
  assert.equal(complete([...ok, { type: "refusal" }], QUESTIONS), null, "refusal");
  assert.equal(complete(ok.map((a) => (a.name === "is_scam" ? { ...a, probability: 85 } : a)), QUESTIONS), null, "out of range");
  assert.equal(complete(ok.map((a) => (a.name === "scam_type" ? { ...a, choice: "made_up" } : a)), QUESTIONS), null, "unknown choice");
  assert.equal(complete(undefined, QUESTIONS), null);
});

test("cautious(): when no model answers, the payment gets a second look, not a pass", () => {
  const a = cautious(QUESTIONS);
  assert.equal(verdictFor(a.is_scam.probability, a.risk.score, "unavailable").verdict, "warn");
  assert.equal(a.scam_type.choice, "unclear_pattern");
});

test("describeSituation never invents an unknown caller, and words 1x-2x amounts honestly", () => {
  const unknown = describeSituation({ onCall: true }, pay())[0];
  assert.match(unknown, /contact status not known/);
  assert.doesNotMatch(unknown, /NOT in their contacts/);
  assert.match(describeSituation({ onCall: true, callerInContacts: true }, pay())[0], /saved in their contacts/);
  assert.match(describeSituation({ usualMaxAmount: 10000 }, pay({ amount: 15000 }))[0], /somewhat larger.*1\.5x/);
});

test("rate limits: public traffic can't use up the local demo's budget", () => {
  let remoteRefused = false;
  for (let i = 0; i < 40; i++) if (!checkLimiter("remote")) remoteRefused = true;
  assert.ok(remoteRefused, "remote bucket should run out");
  assert.equal(checkLimiter("local"), true, "local still works");
});

test("validation only accepts image formats the Decisions API takes", () => {
  assert.equal(checkSchema.safeParse({ payment: pay(), images: ["data:image/jpeg;base64,AA"] }).success, true);
  assert.equal(checkSchema.safeParse({ payment: pay(), images: ["data:image/webp;base64,AA"] }).success, true);
  assert.equal(checkSchema.safeParse({ payment: pay(), images: ["data:image/svg+xml;base64,AA"] }).success, false);
});
