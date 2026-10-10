import { createHmac } from "node:crypto";
import * as store from "./store.js";

// Tell the family the moment a payment is held. MCP Events (which can wake a ChatGPT Dot) need a newer MCP SDK,
// so for now this is a plain webhook: point FAMILY_WEBHOOK_URL at anything that can reach Rahul
// (an automation, a bot, or an MCP Events bridge).
const url = process.env.FAMILY_WEBHOOK_URL;
const secret = process.env.FAMILY_WEBHOOK_SECRET; // optional: receiver can verify X-Guardian-Signature
const sent = new Set(); // ids notified and still waiting; removed once decided, so it stays small

store.events.on("reset", () => sent.clear());
store.events.on("update", async (item) => {
  if (item.status !== "awaiting_family") {
    sent.delete(item.id);
    return;
  }
  if (!url || sent.has(item.id)) return;
  sent.add(item.id);
  const data = {
    id: item.id,
    amount: item.payment?.amount,
    payeeName: item.payment?.payeeName,
    payeeId: item.payment?.payeeId,
    probability: item.probability,
    scamType: item.scamType,
    explanation: item.explanation,
  };
  const body = JSON.stringify({ type: "payment_held", timestamp: new Date().toISOString(), data });
  const headers = { "Content-Type": "application/json" };
  if (secret) headers["X-Guardian-Signature"] = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(5_000) });
      if (res.ok) return;
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.warn(`[notify] webhook attempt ${attempt} failed:`, err.message);
    }
  }
  sent.delete(item.id); // never delivered: allow a later update to try again
});
