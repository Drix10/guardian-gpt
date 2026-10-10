import OpenAI from "openai";

export const client = new OpenAI();

const DECISIONS_MODEL = "gpt-6-luna";

// Ask bounded questions with the Decisions API. Falls back to Structured Outputs
// on Luna if the endpoint is unavailable or refuses, so the demo never dead-ends.
export async function decide(input, questions) {
  const started = Date.now();
  try {
    const res = await client.decisions.create({ model: DECISIONS_MODEL, input, questions });
    const refused = res.answers?.some((a) => a.type === "refusal");
    if (!refused) {
      return { answers: byName(res.answers), source: "decisions", ms: Date.now() - started };
    }
  } catch (err) {
    console.warn("[decide] Decisions API failed, using fallback:", err.status ?? err.message);
  }
  const answers = await fallback(input, questions);
  return { answers, source: "fallback", ms: Date.now() - started };
}

function byName(answers) {
  return Object.fromEntries(answers.map((a) => [a.name, a]));
}

async function fallback(input, questions) {
  const properties = {};
  for (const q of questions) {
    if (q.type === "predicate") properties[q.name] = { type: "number", description: `Probability 0-1: ${q.instructions}` };
    if (q.type === "choice") properties[q.name] = { type: "string", enum: q.choices.map((c) => c.value), description: q.instructions };
    if (q.type === "score") properties[q.name] = { type: "integer", minimum: 0, maximum: q.levels.length - 1, description: `${q.instructions} Levels: ${q.levels.map((l, i) => `${i}=${l.label}`).join(", ")}` };
  }
  const res = await client.responses.create({
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
  });
  const raw = JSON.parse(res.output_text);
  const out = {};
  for (const q of questions) {
    const v = raw[q.name];
    if (q.type === "predicate") out[q.name] = { type: "predicate", name: q.name, probability: v };
    if (q.type === "choice") out[q.name] = { type: "choice", name: q.name, choice: v, confidence: null, probabilities: [{ value: v, probability: 1 }] };
    if (q.type === "score") out[q.name] = { type: "score", name: q.name, score: v, confidence: null, probabilities: [] };
  }
  return out;
}
