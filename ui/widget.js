import { App, applyDocumentTheme, applyHostStyleVariables } from "@modelcontextprotocol/ext-apps";
import { OpenAIExtensions } from "@openai/mcp-extensions/app";

const app = new App({ name: "guardian-widget", version: "1.0.0" });
new OpenAIExtensions(app);
const root = document.getElementById("root");

const pct = (p) => `${Math.round((p ?? 0) * 100)}%`;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const LABELS = {
  impersonates_authority: "Pretends to be police / bank / govt",
  pressure_or_secrecy: "Threats, urgency or secrecy",
  payee_mismatch: "Payee doesn't match the story",
};
const STATUS = {
  awaiting_family: "Waiting for you",
  approved: "Approved",
  blocked: "Blocked",
  warned: "Warned",
  allowed: "Allowed",
};

function bar(label, p) {
  const tone = p >= 0.8 ? "bad" : p >= 0.35 ? "warn" : "ok";
  return `<div class="g-bar"><span>${esc(label)}</span><div class="g-track"><div class="g-fill ${tone}" style="width:${pct(p)}"></div></div><b>${pct(p)}</b></div>`;
}

function verdictCard(item, withActions) {
  const tone = item.verdict === "hold" ? "bad" : item.verdict === "warn" ? "warn" : "ok";
  const title = { hold: "Payment held", warn: "Be careful", allow: "Looks safe" }[item.verdict];
  const p = item.payment ?? {};
  const actions = withActions && item.status === "awaiting_family"
    ? `<div class="g-actions"><button class="btn btn-primary cursor-interaction" data-id="${item.id}" data-d="block">Block payment</button>
       <button class="btn cursor-interaction" data-id="${item.id}" data-d="approve">Approve</button></div>`
    : `<div class="g-status ${item.status}">${STATUS[item.status] ?? item.status}</div>`;
  return `<section class="card g-card ${tone}">
    <header><span class="g-pill ${tone}">${title}</span><span class="g-amt">₹${esc(p.amount ?? "?")} → ${esc(p.payeeName ?? p.payeeId ?? "unknown")}</span></header>
    <div class="g-big">${pct(item.probability)} <small>scam probability · ${esc(item.scamType.replaceAll("_", " "))}</small></div>
    ${item.signals.map((s) => bar(LABELS[s.name] ?? s.name, s.probability)).join("")}
    ${item.explanation ? `<p class="g-explain">${esc(item.explanation)}</p>` : ""}
    <footer class="g-muted">Decided in ${item.decisionsMs} ms · ${item.source === "decisions" ? "OpenAI Decisions API" : "fallback"}</footer>
    ${actions}
  </section>`;
}

function render(data) {
  if (!data) return;
  if (data.kind === "verdict") {
    root.innerHTML = verdictCard(data.item, true);
  } else if (data.kind === "dashboard") {
    const waiting = data.items.filter((i) => i.status === "awaiting_family");
    root.innerHTML = `<h2 class="g-h">🛡️ Guardian · Family</h2>
      <p class="g-muted">${waiting.length} payment(s) waiting for your decision</p>
      ${data.items.length ? data.items.map((i) => verdictCard(i, true)).join("") : `<p class="g-muted">No payments checked yet.</p>`}
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
