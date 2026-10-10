import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";

export const events = new EventEmitter();
// Every open dashboard / pay tab holds an SSE listener; don't warn at 10.
events.setMaxListeners(200);

// Bounded in-memory store: keeps the newest payments, never evicts one still waiting for the family.
export const MAX_PAYMENTS = 500;
export const MAX_WAITING = 200; // even held payments expire past this many (oldest first)
const payments = new Map();

export function record(assessment, view = "main") {
  const item = {
    ...assessment,
    view,
    id: randomUUID().slice(0, 8),
    createdAt: new Date().toISOString(),
    status: assessment.verdict === "hold" ? "awaiting_family" : assessment.verdict === "warn" ? "warned" : "allowed",
  };
  payments.set(item.id, item);
  evict();
  events.emit("update", item);
  return item;
}

function evict() {
  if (payments.size > MAX_PAYMENTS) {
    for (const [id, p] of payments) {
      if (payments.size <= MAX_PAYMENTS) break;
      if (p.status !== "awaiting_family") payments.delete(id);
    }
  }
  const waiting = [...payments.values()].filter((p) => p.status === "awaiting_family");
  for (const p of waiting.slice(0, Math.max(0, waiting.length - MAX_WAITING))) {
    p.status = "expired";
    payments.delete(p.id);
    events.emit("update", p);
  }
}

export function list(view) {
  const all = [...payments.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || 0);
  return view ? all.filter((p) => (p.view ?? "main") === view) : all;
}

export function get(id) {
  return payments.get(id);
}

// Only a payment that is still waiting can be decided: no approving after a block, or vice versa.
export function resolve(id, decision, by = "family") {
  const item = payments.get(id);
  if (!item) return { item: null, error: "not_found" };
  if (item.status !== "awaiting_family") return { item, error: "not_waiting" };
  if (decision !== "approve" && decision !== "block") return { item, error: "bad_decision" };
  item.status = decision === "approve" ? "approved" : "blocked";
  item.resolvedBy = by;
  item.resolvedAt = new Date().toISOString();
  events.emit("update", item);
  return { item, error: null };
}

export function clear() {
  payments.clear();
  events.emit("reset");
}
