import { App, applyDocumentTheme, applyHostStyleVariables } from "@modelcontextprotocol/ext-apps";
import { OpenAIExtensions } from "@openai/mcp-extensions/app";

const app = new App({ name: "guardian-widget", version: "1.0.0" });
new OpenAIExtensions(app);
const root = document.getElementById("root");

const pct = (p) => `${Math.round((p ?? 0) * 100)}%`;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const LABELS = {
  impersonates_authority: "Claims to be police, bank or govt",
  pressure_or_secrecy: "Threats, rush or secrecy",
  payee_mismatch: "Payee doesn't fit the story",
};
const STATUS = {
  awaiting_family: "Waiting for your decision",
  approved: "You approved this payment",
  blocked: "You blocked this payment",
  warned: "The payer was warned",
  allowed: "Went through normally",
};
const inr = (n) => Number(n ?? 0).toLocaleString("en-IN");
// The stamp follows the payment's life: Held → Blocked / Approved.
const stampFor = (i) => i.status === "blocked" ? ["Blocked", "hold"] : i.status === "approved" ? ["Approved", "allow"]
  : [{ hold: "Held", warn: "Check", allow: "Clear" }[i.verdict], i.verdict];

function bar(label, p) {
  const tone = p >= 0.8 ? "bad" : p >= 0.35 ? "warn" : "ok";
  return `<div class="g-bar"><span>${esc(label)}</span><div class="g-track"><div class="g-fill ${tone}" style="width:${pct(p)}"></div></div><b>${pct(p)}</b></div>`;
}

function verdictCard(item) {
  const p = item.payment ?? {};
  const [word, tone] = stampFor(item);
  const actions = item.status === "awaiting_family"
    ? `<div class="g-actions"><button class="btn btn-primary g-block cursor-interaction" data-id="${item.id}" data-d="block">Block payment</button>
       <button class="btn cursor-interaction" data-id="${item.id}" data-d="approve">Approve payment</button></div>`
    : `<div class="g-status ${item.status}">${STATUS[item.status] ?? item.status}</div>`;
  return `<section class="g-card">
    <span class="g-stamp ${tone}">${word}</span>
    <div class="g-amt">₹${inr(p.amount)} to ${esc(p.payeeName ?? p.payeeId ?? "unknown")}</div>
    <div class="g-sub">${esc(p.payeeId ?? "")}</div>
    <div class="g-big">${pct(item.probability)}<small>chance this is a scam (${esc(item.scamType.replaceAll("_", " "))})</small></div>
    ${item.signals.map((s) => bar(LABELS[s.name] ?? s.name, s.probability)).join("")}
    ${item.explanation ? `<p class="g-explain">${esc(item.explanation)}</p>` : ""}
    <div class="g-foot">Decided in ${item.decisionsMs} ms by ${item.source === "decisions" ? "the OpenAI Decisions API" : "the fallback model"}</div>
    ${actions}
  </section>`;
}

let view = "verdict";
function render(data) {
  if (!data) return;
  if (data.kind === "resolved") {
    return view === "dashboard" ? render({ kind: "dashboard", items: data.items }) : data.item && render({ kind: "verdict", item: data.item });
  }
  view = data.kind;
  if (data.kind === "verdict") {
    root.innerHTML = verdictCard(data.item);
  } else if (data.kind === "dashboard") {
    const waiting = data.items.filter((i) => i.status === "awaiting_family").length;
    root.innerHTML = `<h2 class="g-h">Guardian family view</h2>
      <p class="g-muted">${waiting === 0 ? "Nothing needs you right now." : waiting === 1 ? "One payment is waiting for you." : `${waiting} payments are waiting for you.`}</p>
      ${data.items.length ? data.items.map(verdictCard).join("") : ""}
      <button class="btn cursor-interaction g-refresh">Refresh</button>`;
  }
}

root.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  btn.disabled = true;
  const result = btn.classList.contains("g-refresh")
    ? await app.callServerTool({ name: "guardian_family_dashboard", arguments: {} })
    : await app.callServerTool({ name: "guardian_resolve_payment", arguments: { id: btn.dataset.id, decision: btn.dataset.d } });
  render(result.structuredContent);
});

function applyHostContext(ctx) {
  if (ctx?.theme != null) applyDocumentTheme(ctx.theme);
  if (ctx?.styles?.variables != null) applyHostStyleVariables(ctx.styles.variables);
}
app.addEventListener("hostcontextchanged", applyHostContext);
app.ontoolresult = (result) => render(result.structuredContent);
await app.connect();
applyHostContext(app.getHostContext());
