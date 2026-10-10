// Real Decisions API checks. Costs a few cents. Run with: npm run test:live
import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";

const LIVE = process.env.LIVE === "1";
const { assess } = await import("../src/guardian.js");

test("live: a live call with nothing typed is held", { skip: !LIVE }, async () => {
  const r = await assess({
    payment: { amount: 450000, payeeName: "RBI Verification Cell", payeeId: "rbi.verify2291@okaxis", firstTime: true },
    situation: { onCall: true, callType: "whatsapp_video", callerInContacts: false, callMinutes: 38, usualMaxAmount: 15000, payeeAccountAgeDays: 3, payeeReports: 7 },
  });
  assert.equal(r.verdict, "hold");
  assert.ok(r.probability >= 0.8);
  assert.ok(r.explanation && r.explanation.length > 20);
  assert.equal(r.source, "decisions");
});

test("live: a normal payment to a known contact is allowed, with no explanation call", { skip: !LIVE }, async () => {
  const r = await assess({
    payment: { amount: 4500, payeeName: "Ravi Kumar", payeeId: "ravi.kumar@oksbi", firstTime: false, note: "BESCOM bill money for Ravi (my son)" },
    context: "OTHER PARTY: Amma, can you send me ₹4,500 for the BESCOM bill like every month?\nPAYER: Ok kanna, sending to your usual UPI.",
    situation: { onCall: false, usualMaxAmount: 8000, payeeInContacts: true, payeeAccountAgeDays: 2100, payeeReports: 0 },
  });
  assert.equal(r.verdict, "allow");
  assert.equal(r.explanation, null);
});

test("live: Hindi explanation is in Devanagari", { skip: !LIVE }, async () => {
  const r = await assess({
    language: "hi",
    payment: { amount: 450000, payeeName: "RBI Verification Cell", payeeId: "rbi.verify2291@okaxis", firstTime: true },
    context: "OTHER PARTY: I am Inspector Sharma, CBI. You are under digital arrest. Do not tell your son. Pay to RBI verification account.",
  });
  assert.equal(r.verdict, "hold");
  assert.match(r.explanation, /[ऀ-ॿ]/);
});
