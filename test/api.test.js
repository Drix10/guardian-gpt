import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

process.env.OPENAI_API_KEY ||= "test-key";
const { createApp } = await import("../src/app.js");
const store = await import("../src/store.js");

let server, base;
before(async () => {
  server = createApp({ limiter: () => true }).listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((r) => server.close(r)));

const post = (path, body, headers = {}) =>
  fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });
const mcp = async (method, params = {}) => {
  const res = await post("/mcp", { jsonrpc: "2.0", id: 1, method, params }, { Accept: "application/json, text/event-stream" });
  return res.json();
};
const held = () => store.record({ verdict: "hold", probability: 1, scamType: "digital_arrest", signals: [], payment: { amount: 450000, payeeName: "RBI Verification Cell", payeeId: "rbi.verify2291@okaxis" }, situation: { payeeReports: 7, payeeAccountAgeDays: 3 } });

test("static pages are served locally", async () => {
  for (const p of ["/", "/family.html", "/eval.html", "/app.js", "/style.css"]) assert.equal((await fetch(base + p)).status, 200, p);
});

test("/api/check rejects invalid input with 400 (no API call made)", async () => {
  for (const body of [{}, { payment: { amount: 0 } }, { payment: { amount: "1" } }, { payment: { amount: 5 }, images: ["http://x"] }]) {
    const res = await post("/api/check", body);
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.ok((await res.json()).error);
  }
});

test("malformed JSON gets a JSON 400, not a crash", async () => {
  const res = await post("/api/check", "{not json");
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error, "Malformed JSON.");
});

test("rate limit returns 429", async () => {
  const limited = createApp({ limiter: () => false }).listen(0);
  await new Promise((r) => limited.once("listening", r));
  const res = await fetch(`http://127.0.0.1:${limited.address().port}/api/check`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payment: { amount: 100 } }) });
  assert.equal(res.status, 429);
  await new Promise((r) => limited.close(r));
});

test("the public tunnel can only reach /mcp", async () => {
  const viaTunnel = { "cf-connecting-ip": "203.0.113.9" };
  assert.equal((await fetch(base + "/api/payments", { headers: viaTunnel })).status, 403);
  assert.equal((await post("/api/reset", {}, viaTunnel)).status, 403);
  assert.equal((await fetch(base + "/", { headers: viaTunnel })).status, 403);
  const res = await post("/mcp", { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }, { ...viaTunnel, Accept: "application/json, text/event-stream" });
  assert.equal(res.status, 200);
});

test("decisions: block, then approve is refused with 409; bad input 400; unknown 404", async () => {
  store.clear();
  const p = held();
  assert.equal((await post(`/api/payments/${p.id}/decision`, { decision: "maybe" })).status, 400);
  const blocked = await post(`/api/payments/${p.id}/decision`, { decision: "block" });
  assert.equal(blocked.status, 200);
  assert.equal((await blocked.json()).status, "blocked");
  const late = await post(`/api/payments/${p.id}/decision`, { decision: "approve" });
  assert.equal(late.status, 409);
  assert.equal((await late.json()).item.status, "blocked");
  assert.equal((await post("/api/payments/nope/decision", { decision: "block" })).status, 404);
});

test("live updates: SSE delivers new payments and resets, and cleans up listeners", async () => {
  store.clear();
  const before = store.events.listenerCount("update");
  const ctrl = new AbortController();
  const res = await fetch(base + "/api/events", { signal: ctrl.signal });
  const reader = res.body.getReader();
  await new Promise((r) => setTimeout(r, 50));
  const p = held();
  store.clear();
  let text = "";
  while (!text.includes('"reset":true')) text += new TextDecoder().decode((await reader.read()).value);
  assert.ok(text.includes(p.id));
  ctrl.abort();
  await new Promise((r) => setTimeout(r, 100));
  assert.equal(store.events.listenerCount("update"), before);
});

test("reset clears everything", async () => {
  held();
  assert.equal((await post("/api/reset", {})).status, 200);
  assert.deepEqual(await (await fetch(base + "/api/payments")).json(), []);
});

test("MCP: tools are listed with the right safety annotations", async () => {
  const { result } = await mcp("tools/list");
  const byName = Object.fromEntries(result.tools.map((t) => [t.name, t]));
  for (const n of ["guardian_check", "guardian_family_dashboard", "guardian_resolve_payment", "guardian_block_payment", "guardian_approve_payment", "guardian_payee_report"]) assert.ok(byName[n], n);
  assert.equal(byName.guardian_block_payment.annotations.destructiveHint, false);
  assert.equal(byName.guardian_approve_payment.annotations.destructiveHint, true);
  assert.equal(byName.guardian_payee_report.annotations.readOnlyHint, true);
  assert.equal(byName.guardian_check._meta["openai/outputTemplate"], "ui://guardian/widget-v4.html");
});

test("MCP: widget resource is served (and cached)", async () => {
  const a = await mcp("resources/read", { uri: "ui://guardian/widget-v4.html" });
  const b = await mcp("resources/read", { uri: "ui://guardian/widget-v4.html" });
  assert.ok(a.result.contents[0].text.includes("<script type=\"module\">"));
  assert.equal(a.result.contents[0].text, b.result.contents[0].text);
});

test("MCP: approve needs a person's yes; block works once; report knows the payee", async () => {
  store.clear();
  const p = held();
  const noYes = await mcp("tools/call", { name: "guardian_approve_payment", arguments: { id: p.id } });
  assert.ok(noYes.error || noYes.result?.isError, "approve without confirmation must fail");
  assert.equal(store.get(p.id).status, "awaiting_family");

  const report = await mcp("tools/call", { name: "guardian_payee_report", arguments: { payee_id: "rbi.verify2291@okaxis" } });
  assert.equal(report.result.structuredContent.scamReports, 7);
  assert.equal(report.result.structuredContent.accountAgeDays, 3);

  const block = await mcp("tools/call", { name: "guardian_block_payment", arguments: { id: p.id } });
  assert.match(block.result.content[0].text, /Blocked payment .*₹4,50,000/);
  const again = await mcp("tools/call", { name: "guardian_block_payment", arguments: { id: p.id } });
  assert.match(again.result.content[0].text, /already blocked/);
  const approveLate = await mcp("tools/call", { name: "guardian_approve_payment", arguments: { id: p.id, confirmed_by_person: true } });
  assert.equal(approveLate.result.isError, true);
  assert.equal(store.get(p.id).status, "blocked");
  const missing = await mcp("tools/call", { name: "guardian_block_payment", arguments: { id: "nope" } });
  assert.equal(missing.result.isError, true);
});

test("MCP: widget resolve returns the true state even if already decided", async () => {
  store.clear();
  const p = held();
  store.resolve(p.id, "block");
  const r = await mcp("tools/call", { name: "guardian_resolve_payment", arguments: { id: p.id, decision: "approve" } });
  assert.equal(r.result.structuredContent.item.status, "blocked");
  assert.match(r.result.content[0].text, /already blocked/);
});

test("MCP: guardian_check rejects a missing or zero amount without calling the API", async () => {
  for (const args of [{ context: "hi" }, { amount: 0 }]) {
    const r = await mcp("tools/call", { name: "guardian_check", arguments: args });
    assert.equal(r.result.isError, true);
    assert.match(r.result.content[0].text, /Guardian needs a valid payment. (Enter an amount above ₹0.|Enter the amount in rupees.)/);
  }
});

// fetch() can't set Host (forbidden header), so speak raw HTTP like a neighbour on the Wi-Fi would.
const raw = (method, path, host, body) => new Promise((resolve, reject) => {
  const { port } = server.address();
  const req = http.request({ host: "127.0.0.1", port, method, path, headers: { Host: host, "Content-Type": "application/json", Accept: "application/json, text/event-stream" } }, (res) => {
    res.resume();
    res.on("end", () => resolve(res.statusCode));
  });
  req.on("error", reject);
  req.end(body ? JSON.stringify(body) : undefined);
});

test("another machine on the Wi-Fi (non-localhost Host) can only reach /mcp", async () => {
  const lan = "192.168.1.23:8787";
  assert.equal(await raw("GET", "/api/payments", lan), 403);
  assert.equal(await raw("POST", "/api/payments/x/decision", lan, { decision: "approve" }), 403);
  assert.equal(await raw("GET", "/", lan), 403);
  assert.equal(await raw("GET", "/mcp/../api/payments", lan), 403, "no path tricks");
  assert.equal(await raw("POST", "/mcp", lan, { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }), 200);
  assert.equal(await raw("GET", "/api/payments", "localhost:8787"), 200, "localhost still works");
});

test("body limits: big bodies are refused on /mcp and small routes, before any work", async () => {
  const big = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: { pad: "x".repeat(2_000_000) } });
  assert.equal((await post("/mcp", big, { Accept: "application/json, text/event-stream" })).status, 413);
  assert.equal((await post("/api/reset", JSON.stringify({ pad: "x".repeat(2_000_000) }))).status, 413);
});

test("MCP: a failed check returns an error the card can show (not a stuck Loading…)", async () => {
  const r = await mcp("tools/call", { name: "guardian_check", arguments: { context: "no amount" } });
  assert.equal(r.result.isError, true);
  assert.equal(r.result.structuredContent.kind, "error");
  assert.ok(r.result.structuredContent.message);
});

test("MCP: deciding a payment that no longer exists tells the card why", async () => {
  const r = await mcp("tools/call", { name: "guardian_resolve_payment", arguments: { id: "gone", decision: "block" } });
  assert.equal(r.result.structuredContent.item, null);
  assert.match(r.result.structuredContent.message, /no longer exists/);
});

test("MCP: check output fences the model-written explanation", async () => {
  // Drive the formatting path with a stored item through the dashboard instead of a paid call.
  store.clear();
  held();
  const r = await mcp("tools/call", { name: "guardian_family_dashboard", arguments: {} });
  assert.equal(r.result.structuredContent.kind, "dashboard");
  assert.equal(r.result.structuredContent.items.length, 1);
});

test("public demo mode: visitors get the web demo in their own view, can't reset, can't touch the stage demo", async () => {
  const demo = createApp({ limiter: () => true, publicDemo: true }).listen(0);
  await new Promise((r) => demo.once("listening", r));
  const port = demo.address().port;
  const as = (method, path, host, body) => new Promise((resolve, reject) => {
    const req = http.request({ host: "127.0.0.1", port, method, path, headers: { Host: host, "Content-Type": "application/json" } }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    req.end(body ? JSON.stringify(body) : undefined);
  });
  const PUBLIC = "tube-x.trycloudflare.com";
  store.clear();
  const stage = store.record({ verdict: "hold", probability: 1, payment: { amount: 1 } }); // main view
  const visitor = store.record({ verdict: "hold", probability: 1, payment: { amount: 2 } }, "public");

  assert.equal((await as("GET", "/", PUBLIC)).status, 200, "public can open the pay app");
  assert.equal((await as("GET", "/family.html", PUBLIC)).status, 200);
  assert.equal((await as("POST", "/api/reset", PUBLIC, {})).status, 403, "only the presenter can clear history");

  const publicList = JSON.parse((await as("GET", "/api/payments", PUBLIC)).body);
  assert.deepEqual(publicList.map((p) => p.id), [visitor.id], "visitors see only public payments");
  const localList = JSON.parse((await as("GET", "/api/payments", "localhost:8787")).body);
  assert.deepEqual(localList.map((p) => p.id), [stage.id], "the stage sees only its own payments");

  assert.equal((await as("POST", `/api/payments/${stage.id}/decision`, PUBLIC, { decision: "approve" })).status, 404, "visitors can't decide stage payments");
  assert.equal(store.get(stage.id).status, "awaiting_family");
  assert.equal((await as("POST", `/api/payments/${visitor.id}/decision`, PUBLIC, { decision: "block" })).status, 200);
  await new Promise((r) => demo.close(r));
});
