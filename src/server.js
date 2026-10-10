import "dotenv/config";
import path from "node:path";
import express from "express";
import { assess } from "./guardian.js";
import * as store from "./store.js";
import { mountMcp } from "./mcp.js";

const app = express();
app.use(express.json({ limit: "15mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.post("/api/check", async (req, res) => {
  try {
    const { payment, context, images, language } = req.body;
    const item = store.record(await assess({ payment, context, images, language }));
    res.json(item);
  } catch (err) {
    console.error("[check]", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/payments", (_req, res) => res.json(store.list()));

app.post("/api/payments/:id/decision", (req, res) => {
  const item = store.resolve(req.params.id, req.body.decision, req.body.by ?? "family (web)");
  item ? res.json(item) : res.sendStatus(404);
});

app.get("/api/events", (req, res) => {
  res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  res.flushHeaders();
  const send = (item) => res.write(`data: ${JSON.stringify(item)}\n\n`);
  store.events.on("update", send);
  req.on("close", () => store.events.off("update", send));
});

mountMcp(app);
app.use(express.static(path.resolve(import.meta.dirname, "../web")));

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => console.log(`Guardian on http://localhost:${port}  (MCP: /mcp)`));
