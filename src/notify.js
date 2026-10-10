import * as store from "./store.js";

// Tell the family the moment a payment is held. MCP Events (which can wake a ChatGPT Dot) need a newer MCP SDK,
// so for now this is a plain webhook: point FAMILY_WEBHOOK_URL at anything that can reach Rahul
// (an automation, a bot, or an MCP Events bridge).
const url = process.env.FAMILY_WEBHOOK_URL;
const sent = new Set();

store.events.on("update", async (item) => {
  if (!url || item.status !== "awaiting_family" || sent.has(item.id)) return;
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
  try {
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "payment_held", timestamp: new Date().toISOString(), data }) });
  } catch (err) {
    console.warn("[notify] webhook failed:", err.message);
  }
});
