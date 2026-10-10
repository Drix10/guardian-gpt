import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";

export const events = new EventEmitter();
const payments = new Map();

export function record(assessment) {
  const item = {
    id: randomUUID().slice(0, 8),
    createdAt: new Date().toISOString(),
    status: assessment.verdict === "hold" ? "awaiting_family" : assessment.verdict === "warn" ? "warned" : "allowed",
    ...assessment,
  };
  payments.set(item.id, item);
  events.emit("update", item);
  return item;
}

export function list() {
  return [...payments.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function get(id) {
  return payments.get(id);
}

export function resolve(id, decision, by = "family") {
  const item = payments.get(id);
  if (!item) return null;
  item.status = decision === "approve" ? "approved" : "blocked";
  item.resolvedBy = by;
  item.resolvedAt = new Date().toISOString();
  events.emit("update", item);
  return item;
}

export function clear() {
  payments.clear();
  events.emit("reset");
}
