import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { RESOURCE_MIME_TYPE, registerAppResource, registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { OpenAIExtensions } from "@openai/mcp-extensions/server";
import { assess } from "./guardian.js";
import * as store from "./store.js";

const WIDGET_URI = "ui://guardian/widget-v2.html";
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
      "A HOLD means the payment is paused (not blocked) and waiting for the family member to block or approve it in the Guardian card. " +
      "Describe it as held/paused, never as blocked, unless the family has blocked it.",
    inputSchema: {
      context: z.string().optional().describe("The messages, call transcript, or description of what happened before the payment (optional: Guardian also works from automatic signals alone)"),
      amount: z.number().optional().describe("Amount in INR"),
      payee_name: z.string().optional(),
      payee_id: z.string().optional().describe("UPI ID, account, or website domain"),
      first_time: z.boolean().optional().describe("True if paying this payee for the first time"),
      language: z.enum(["en", "hi"]).optional().describe("Language for the explanation"),
      actor: z.string().optional().describe("Who is making the payment, e.g. 'AI shopping agent on behalf of Lakshmi'"),
      // Signals a payment app collects automatically; the payer types nothing.
      on_call: z.boolean().optional().describe("Payer is on a call right now"),
      call_type: z.enum(["whatsapp_video", "whatsapp_audio", "phone"]).optional(),
      caller_in_contacts: z.boolean().optional(),
      call_minutes: z.number().optional(),
      screen_share_app: z.string().optional().describe("Name of an open screen-sharing app, e.g. AnyDesk"),
      usual_max_amount: z.number().optional().describe("Payer's usual largest payment in INR"),
      payee_in_contacts: z.boolean().optional(),
      payee_verified_merchant: z.boolean().optional(),
      payee_account_age_days: z.number().optional(),
      payee_reports: z.number().optional().describe("Scam reports against this payee in a shared registry"),
    },
    _meta: { ui: { resourceUri: WIDGET_URI }, "openai/outputTemplate": WIDGET_URI },
  }, async (args) => {
    const situation = {
      onCall: args.on_call, callType: args.call_type, callerInContacts: args.caller_in_contacts, callMinutes: args.call_minutes,
      screenShareApp: args.screen_share_app, usualMaxAmount: args.usual_max_amount, payeeInContacts: args.payee_in_contacts,
      payeeVerifiedMerchant: args.payee_verified_merchant, payeeAccountAgeDays: args.payee_account_age_days, payeeReports: args.payee_reports,
    };
    const hasSituation = Object.values(situation).some((v) => v !== undefined);
    const result = await assess({
      situation: hasSituation ? situation : null,
      payment: { amount: args.amount, payeeName: args.payee_name, payeeId: args.payee_id, firstTime: args.first_time ?? true, actor: args.actor ?? "ChatGPT user" },
      context: args.context ?? "",
      language: args.language ?? "en",
    });
    const item = store.record(result);
    return {
      structuredContent: { kind: "verdict", item },
      content: [{ type: "text", text: `Guardian verdict: ${item.verdict.toUpperCase()} (scam probability ${(item.probability * 100).toFixed(0)}%, pattern ${item.scamType}). ` +
        (item.verdict === "hold" ? "The payment is PAUSED, not blocked: it is waiting for the family to block or approve it in the Guardian card. " : "") +
        `Amount: ₹${Number(item.payment.amount ?? 0).toLocaleString("en-IN")}. ${item.explanation ?? ""}` }],
    };
  });

  registerAppTool(server, "guardian_family_dashboard", {
    title: "Guardian family dashboard",
    description: "Show payments Guardian has checked for your family, including payments held for your approval.",
    inputSchema: {},
    _meta: {
      ui: { resourceUri: WIDGET_URI },
      "openai/outputTemplate": WIDGET_URI,
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
    _meta: { ui: { resourceUri: WIDGET_URI, visibility: ["model", "app"] }, "openai/outputTemplate": WIDGET_URI },
  }, async ({ id, decision }) => {
    const item = store.resolve(id, decision, "family (ChatGPT)");
    return {
      structuredContent: { kind: "resolved", item, items: dashboard().items },
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
