import OpenAI from "openai";

// Created on first use, so the server still boots (and explains itself) without OPENAI_API_KEY.
let _client;
export function getClient() {
  _client ??= new OpenAI({ timeout: 15_000, maxRetries: 0 });
  return _client;
}

const DECISIONS_MODEL = "gpt-6-luna";
const isProb = (n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1;

// Ask bounded questions with the Decisions API. If it is unavailable, refuses, or returns an
// incomplete answer set, fall back to Structured Outputs on Luna; if that fails too, return a
// cautious "needs a second look" answer. Guardian never fails open, and never dead-ends.
export async function decide(input, questions, { deadline = Date.now() + 20_000 } = {}) {
  const started = Date.now();
  try {
    const res = await getClient().decisions.create({ model: DECISIONS_MODEL, input, questions }, { timeout: 8_000 });
    const answers = complete(res.answers, questions);
    if (answers) return { answers, source: "decisions", ms: Date.now() - started };
    console.warn("[decide] incomplete or refused answer set, using fallback");
  } catch (err) {
    console.warn("[decide] Decisions API failed, using fallback:", err.status ?? err.message);
  }
  const remaining = deadline - Date.now();
  if (remaining > 1_500) {
    try {
      return { answers: await fallback(input, questions, Math.min(remaining, 10_000)), source: "fallback", ms: Date.now() - started };
    } catch (err) {
      console.warn("[decide] fallback failed:", err.status ?? err.message);
    }
  }
  return { answers: cautious(questions), source: "unavailable", ms: Date.now() - started };
}

// Accept the Decisions API result only if every question came back with a usable value.
export function complete(raw, questions) {
  if (!Array.isArray(raw) || raw.some((a) => a?.type === "refusal")) return null;
  const byName = Object.fromEntries(raw.filter((a) => typeof a?.name === "string").map((a) => [a.name, a]));
  for (const q of questions) {
    const a = byName[q.name];
    if (!a) return null;
    if (q.type === "predicate" && !isProb(a.probability)) return null;
    if (q.type === "choice" && !q.choices.some((c) => c.value === a.choice)) return null;
    if (q.type === "score" && !(Number.isFinite(a.score) && a.score >= 0 && a.score <= q.levels.length - 1)) return null;
  }
  return byName;
}

export async function fallback(input, questions, timeout = 10_000) {
  const properties = {};
  for (const q of questions) {
    if (q.type === "predicate") properties[q.name] = { type: "number", minimum: 0, maximum: 1, description: `Probability 0-1: ${q.instructions}` };
    if (q.type === "choice") properties[q.name] = { type: "string", enum: q.choices.map((c) => c.value), description: q.instructions };
    if (q.type === "score") properties[q.name] = { type: "integer", minimum: 0, maximum: q.levels.length - 1, description: `${q.instructions} Levels: ${q.levels.map((l, i) => `${i}=${l.label}`).join(", ")}` };
  }
  const res = await getClient().responses.create({
    model: DECISIONS_MODEL,
    input,
    text: {
      format: {
        type: "json_schema",
        name: "decisions",
        strict: true,
        schema: { type: "object", properties, required: Object.keys(properties), additionalProperties: false },
      },
    },
  }, { timeout });
  if (res.status && res.status !== "completed") throw new Error(`fallback ${res.status}`);
  const raw = JSON.parse(res.output_text); // throws on a refusal → caller uses the cautious answer
  // Normalise to the Decisions API's answer shapes so callers never see the difference.
  const out = {};
  for (const q of questions) {
    const v = raw[q.name];
    if (q.type === "predicate") out[q.name] = { type: "predicate", name: q.name, probability: Math.min(1, Math.max(0, Number(v) || 0)) };
    if (q.type === "choice") {
      const choice = q.choices.some((c) => c.value === v) ? v : unclear(q);
      out[q.name] = { type: "choice", name: q.name, choice, confidence: null, probabilities: [{ value: choice, probability: 1 }] };
    }
    if (q.type === "score") {
      const score = Math.min(q.levels.length - 1, Math.max(0, Math.round(Number(v) || 0)));
      out[q.name] = { type: "score", name: q.name, score, confidence: null, probabilities: [] };
    }
  }
  return out;
}

const unclear = (q) => (q.choices.some((c) => c.value === "unclear_pattern") ? "unclear_pattern" : q.choices[0].value);

// When no model could answer: don't wave the payment through; ask for a second look.
export function cautious(questions) {
  const out = {};
  for (const q of questions) {
    if (q.type === "predicate") out[q.name] = { type: "predicate", name: q.name, probability: q.name === "is_scam" ? 0.5 : 0 };
    if (q.type === "choice") out[q.name] = { type: "choice", name: q.name, choice: unclear(q), confidence: null, probabilities: [] };
    if (q.type === "score") out[q.name] = { type: "score", name: q.name, score: 1, confidence: null, probabilities: [] };
  }
  return out;
}
