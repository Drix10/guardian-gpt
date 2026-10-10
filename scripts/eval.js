import "dotenv/config";
import fs from "node:fs";
import { decide } from "../src/decide.js";
import { QUESTIONS, THRESHOLDS, buildInput, verdictFor } from "../src/guardian.js";

const cases = fs.readFileSync("data/eval.jsonl", "utf8").trim().split("\n").map((l) => JSON.parse(l));

async function run(c) {
  const { answers, ms, source } = await decide(buildInput({ payment: c.payment, context: c.context, situation: c.situation ?? null }), QUESTIONS);
  const p = answers.is_scam?.probability;
  const { verdict } = verdictFor(p, answers.risk?.score, source); // the exact rule the product uses
  return { id: c.id, label: c.label, scam_type: c.scam_type, probability: Number.isFinite(p) ? p : 0.5, verdict, scam_type_pred: answers.scam_type?.choice ?? "unclear_pattern", ms, source, typed: Boolean(c.context) };
}

const rows = [];
for (let i = 0; i < cases.length; i += 8) rows.push(...(await Promise.all(cases.slice(i, i + 8).map(run))));

const scams = rows.filter((r) => r.label === "scam");
const legits = rows.filter((r) => r.label === "legit");
const at = (th) => {
  const flagged = (r) => (th === THRESHOLDS.hold ? r.verdict === "hold" : r.verdict !== "allow");
  const tp = scams.filter(flagged).length;
  const fp = legits.filter(flagged).length;
  return { threshold: th, recall: tp / scams.length, falsePositiveRate: fp / legits.length, precision: tp / Math.max(1, tp + fp), accuracy: (tp + legits.length - fp) / rows.length };
};
const lat = rows.map((r) => r.ms).sort((a, b) => a - b);
const bins = [0, 0.2, 0.4, 0.6, 0.8, 1.01].slice(0, -1).map((lo, i, arr) => {
  const hi = i === arr.length - 1 ? 1.01 : arr[i + 1];
  const inBin = rows.filter((r) => r.probability >= lo && r.probability < hi);
  return { bin: `${lo.toFixed(1)}–${Math.min(hi, 1).toFixed(1)}`, n: inBin.length, actualScamRate: inBin.length ? inBin.filter((r) => r.label === "scam").length / inBin.length : null };
});
const report = {
  n: rows.length,
  hold: at(THRESHOLDS.hold),
  warn: at(THRESHOLDS.warn),
  // The pattern is only knowable when there is a conversation; signal-only cases are scored on held vs. not.
  scamTypeAccuracy: scams.filter((r) => r.typed && r.scam_type_pred === r.scam_type).length / scams.filter((r) => r.typed).length,
  untyped: { scams: scams.filter((r) => !r.typed).length, held: scams.filter((r) => !r.typed && r.verdict === "hold").length, legit: legits.filter((r) => !r.typed).length, wronglyHeld: legits.filter((r) => !r.typed && r.verdict === "hold").length },
  latencyMs: { median: lat[Math.floor(lat.length / 2)], p95: lat[Math.floor(lat.length * 0.95)] },
  costPerCheckUsd: null,
  reliability: bins,
  rows,
  generatedAt: new Date().toISOString(),
};
fs.writeFileSync("web/eval.json", JSON.stringify(report, null, 2));

console.table(rows.map(({ id, label, probability, verdict, scam_type_pred, ms }) => ({ id, label, p: probability, verdict, type: scam_type_pred, ms })));
console.log("HOLD threshold:", report.hold);
console.log("WARN threshold:", report.warn);
console.log("Scam-type accuracy (typed cases):", report.scamTypeAccuracy, "Latency:", report.latencyMs, "No-typing cases:", report.untyped);
console.table(bins);
