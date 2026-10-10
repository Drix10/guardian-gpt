import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { RESOURCE_MIME_TYPE, registerAppResource, registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { OpenAIExtensions } from "@openai/mcp-extensions/server";
import { assess } from "./guardian.js";
import * as store from "./store.js";

const WIDGET_URI = "ui://guardian/widget-v1.html";
const ROOT = path.resolve(import.meta.dirname, "..");

function widgetHtml() {
  const js = fs.readFileSync(path.join(ROOT, "dist/widget.js"), "utf8");
  const baseCss = fs.readFileSync(path.join(ROOT, "node_modules/@openai/mcp-extensions/styles.css"), "utf8");
  const css = fs.readFileSync(path.join(ROOT, "ui/widget.css"), "utf8");
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss}\n${css}</style></head>` +
    `<body><div id="root" class="g-root"><p class="g-muted">Loading Guardian…</p></div>` +
    `<script type="module">${js}</script></body></html>`;
}

const dashboard = () => ({ kind: "dashboard", items: store.list().slice(0, 20) });

function buildServer() {
  const server = new McpServer({ name: "guardian", version: "1.0.0" });
  new OpenAIExtensions(server);

  registerAppResource(server, "guardian-widget", WIDGET_URI, {}, async () => ({
    contents: [{
      uri: WIDGET_URI,
      mimeType: RESOURCE_MIME_TYPE,
      text: widgetHtml(),
      _meta: {
        ui: { csp: { connectDomains: [], resourceDomains: [] }, prefersBorder: true },
        "openai/ui": { availableDisplayModes: ["inline", "fullscreen"] },
      },
    }],
  }));

  registerAppTool(server, "guardian_check", {
    title: "Check a payment for scams",
    description:
      "Use BEFORE anyone sends money when a message, call, or request asks for a payment, OTP, refund, investment, or 'verification'. " +
      "Pass the conversation text and payment details. Returns a calibrated scam probability, the scam pattern, and allow/warn/hold. " +
      "Held payments are sent to the family member for approval.",
    inputSchema: {
      context: z.string().describe("The messages, call transcript, or description of what happened before the payment"),
      amount: z.number().optional().describe("Amount in INR"),
      payee_name: z.string().optional(),
      payee_id: z.string().optional().describe("UPI ID, account, or website domain"),
      first_time: z.boolean().optional().describe("True if paying this payee for the first time"),
      language: z.enum(["en", "hi"]).optional().describe("Language for the explanation"),
    },
    _meta: { ui: { resourceUri: WIDGET_URI } },
  }, async (args) => {
    const result = await assess({
      payment: { amount: args.amount, payeeName: args.payee_name, payeeId: args.payee_id, firstTime: args.first_time ?? true, actor: "ChatGPT user" },
      context: args.context,
      language: args.language ?? "en",
    });
    const item = store.record(result);
    return {
      structuredContent: { kind: "verdict", item },
      content: [{ type: "text", text: `Guardian verdict: ${item.verdict.toUpperCase()} (scam probability ${(item.probability * 100).toFixed(0)}%, pattern ${item.scamType}). ${item.explanation ?? ""}` }],
    };
  });

  registerAppTool(server, "guardian_family_dashboard", {
    title: "Guardian family dashboard",
    description: "Show payments Guardian has checked for your family, including payments held for your approval.",
    inputSchema: {},
    _meta: {
      ui: { resourceUri: WIDGET_URI },
      "openai/ui": { entrypoints: [{ type: "global" }, { type: "thread" }] },
    },
  }, async () => ({
    structuredContent: dashboard(),
    content: [{ type: "text", text: `${store.list().filter((p) => p.status === "awaiting_family").length} payment(s) awaiting family approval.` }],
  }));

  registerAppTool(server, "guardian_resolve_payment", {
    title: "Approve or block a held payment",
    description: "Approve or block a payment that Guardian held for family review.",
    inputSchema: { id: z.string(), decision: z.enum(["approve", "block"]) },
    _meta: { ui: { resourceUri: WIDGET_URI, visibility: ["model", "app"] } },
  }, async ({ id, decision }) => {
    const item = store.resolve(id, decision, "family (ChatGPT)");
    return {
      structuredContent: dashboard(),
      content: [{ type: "text", text: item ? `Payment ${id} ${item.status}.` : `No payment ${id}.` }],
    };
  });

  return server;
}

export function mountMcp(app) {
  app.post("/mcp", async (req, res) => {
    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on("close", () => { transport.close(); server.close(); });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("[mcp]", err);
      if (!res.headersSent) res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal error" }, id: null });
    }
  });
  const notAllowed = (_req, res) => res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed" }, id: null });
  app.get("/mcp", notAllowed);
  app.delete("/mcp", notAllowed);
}
