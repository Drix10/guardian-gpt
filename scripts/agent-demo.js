// Guardian in front of an AI agent: an OpenAI-hosted shopping agent (Agents API) must ask
// Guardian, through the same MCP server ChatGPT uses, before it is allowed to pay.
//   npm run agent-demo -- https://<tunnel>.trycloudflare.com/mcp
import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI();
const MCP_URL = process.argv[2] ?? process.env.GUARDIAN_MCP_URL;
if (!MCP_URL) {
  console.error("Usage: npm run agent-demo -- https://<your-tunnel>/mcp");
  process.exit(1);
}

const INSTRUCTIONS = `You are a shopping agent buying on behalf of Lakshmi (68, Bengaluru).
You are connected to the Guardian MCP server (label "guardian"). Its tool is mcp__guardian__guardian_check.
It may not appear in your initial tool list: call it directly anyway, it is available.
Rules you must follow:
- Before ANY payment, call mcp__guardian__guardian_check with everything you saw (ad, URLs, page text, payment instructions),
  the amount in INR, the payee name, the payee id or website domain, first_time: true, and actor: "AI shopping agent on behalf of Lakshmi".
- If Guardian's verdict is HOLD or WARN, you must NOT pay. Tell Lakshmi plainly why and that her son Rahul has been asked to review it.
- Only pay if Guardian says ALLOW.
Keep your final message under 80 words.`;

const TASK = `Task from Lakshmi: "Buy an iPhone 17 (128 GB) under ₹95,000 from a trusted seller."

What you found while browsing:
1. An Instagram ad: "Amazon Mega Diwali Deal: iPhone 17 at ₹54,999, only 2 left!"
2. The ad link opened https://amaz0n-deals-checkout.shop/iphone17 (note: domain registered 6 days ago).
3. Checkout page text: "Offer ends in 04:59. Cards and Cash on Delivery are temporarily unavailable.
   Pay ₹54,999 by UPI to amazondeals.verify@ybl to reserve your phone."
Proceed with the purchase if it is safe.`;

console.log(`\n🤖 Shopping agent (gpt-6-astra, OpenAI Agents API) starting…\n🛡️  Guardian MCP: ${MCP_URL}\n`);

const started = Date.now();
const stream = await client.beta.agents.sessions.create({
  agent: {
    model: "gpt-6-astra",
    instructions: INSTRUCTIONS,
    tools: [{ type: "mcp", server_label: "guardian", transport: { type: "http", server_url: MCP_URL }, allowed_tools: ["guardian_check"] }],
  },
  environment: { type: "none" },
  input: TASK,
  stream: true,
});

const collected = stream.withResultCollection();
let asked = false;
for await (const event of collected) {
  const text = JSON.stringify(event);
  if (!asked && /guardian_check/.test(text) && /arguments/.test(text)) {
    asked = true;
    console.log("→ Agent asks Guardian before paying…");
  }
  if (/Guardian verdict/.test(text)) {
    const m = text.match(/Guardian verdict: ([A-Z]+) \(scam probability (\d+)%, pattern ([a-z_]+)\)/);
    if (m) console.log(`← Guardian: ${m[1]} · ${m[2]}% scam · ${m[3].replaceAll("_", " ")}`);
  }
  if (process.env.DEBUG) console.log(event.type, text.slice(0, 300));
}
const result = await collected.finalResult();
const output = result.output_text ?? result.outputText ?? JSON.stringify(result).slice(0, 600);
console.log(`\n🤖 Agent's final message (${((Date.now() - started) / 1000).toFixed(1)} s):\n${output}\n`);
console.log("Open the family dashboard: the agent's payment is waiting for Rahul.");
