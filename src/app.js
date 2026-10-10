import path from "node:path";
import express from "express";
import { assess } from "./guardian.js";
import * as store from "./store.js";
import { mountMcp } from "./mcp.js";
import { checkLimiter } from "./limits.js";
import { checkSchema, decisionSchema, formatIssues } from "./validate.js";
import "./notify.js";

const HEARTBEAT_MS = 25_000;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

// Remote = came through the tunnel (cf-connecting-ip) or from another machine (non-localhost Host).
export function isRemote(req) {
  return Boolean(req.headers["cf-connecting-ip"]) || !LOCAL_HOSTS.has(String(req.hostname ?? "").toLowerCase());
}
// Optional: GUARDIAN_MCP_TOKEN moves the public endpoint to /mcp/<token> (an unguessable URL).
export const MCP_PATH = process.env.GUARDIAN_MCP_TOKEN ? `/mcp/${process.env.GUARDIAN_MCP_TOKEN}` : "/mcp";
export const isMcpPath = (p) => p === MCP_PATH;

export function createApp({ limiter = checkLimiter } = {}) {
  const app = express();
  app.disable("x-powered-by");

  // Only /mcp is public. Everything else (web demo, family decisions, reset) is localhost-only,
  // and this runs before any request body is read.
  app.use((req, res, next) => {
    if (isRemote(req) && !isMcpPath(req.path)) {
      return res.status(403).json({ error: "Only /mcp is available remotely." });
    }
    next();
  });

  // Body size per route: screenshots only ever arrive at /api/check.
  app.use("/api/check", express.json({ limit: "30mb" }));
  app.use(express.json({ limit: "1mb" }));

  app.post("/api/check", async (req, res) => {
    const parsed = checkSchema.safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: formatIssues(parsed.error) });
    if (!limiter("local")) return res.status(429).json({ error: "Too many checks right now. Try again in a minute." });
    try {
      res.json(store.record(await assess(parsed.data)));
    } catch (err) {
      console.error("[check]", err);
      res.status(502).json({ error: "Guardian couldn't reach the decision service. Try again." });
    }
  });

  app.get("/api/payments", (_req, res) => res.json(store.list()));

  app.post("/api/payments/:id/decision", (req, res) => {
    const parsed = decisionSchema.safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: formatIssues(parsed.error) });
    const { item, error } = store.resolve(req.params.id, parsed.data.decision, parsed.data.by ?? "family (web)");
    if (error === "not_found") return res.status(404).json({ error: "No such payment." });
    if (error === "not_waiting") return res.status(409).json({ error: `This payment is already ${item.status}.`, item });
    res.json(item);
  });

  app.post("/api/reset", (_req, res) => {
    store.clear();
    res.json({ ok: true });
  });

  app.get("/api/events", (req, res) => {
    res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    res.flushHeaders();
    const send = (item) => res.write(`data: ${JSON.stringify(item)}\n\n`);
    const reset = () => res.write(`data: {"reset":true}\n\n`);
    // Comment line keeps proxies from closing an idle stream.
    const heartbeat = setInterval(() => res.write(": ping\n\n"), HEARTBEAT_MS);
    store.events.on("update", send);
    store.events.on("reset", reset);
    req.on("close", () => {
      clearInterval(heartbeat);
      store.events.off("update", send);
      store.events.off("reset", reset);
    });
  });

  mountMcp(app, { limiter, path: MCP_PATH, originOf: (req) => (isRemote(req) ? "remote" : "local") });
  app.use(express.static(path.resolve(import.meta.dirname, "../web")));

  // Malformed or oversized JSON → a clear 4xx instead of an HTML error page.
  app.use((err, _req, res, _next) => {
    const status = err.status ?? err.statusCode ?? 500;
    if (status >= 500) console.error("[app]", err);
    res.status(status).json({ error: status === 413 ? "Request too large." : status === 400 ? "Malformed JSON." : "Internal error." });
  });

  return app;
}
