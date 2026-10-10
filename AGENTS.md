# Guardian — agent instructions

Guardian is a payment-time scam interceptor ("the decision layer for payments"). Before money moves, it looks at the
whole situation (chat messages, screenshots, payee, amount) with the OpenAI **Decisions API** and returns a calibrated
allow / warn / hold verdict. Held payments go to a family member for approval inside a **ChatGPT plugin** sidebar.

## Stack
- Node 24, ESM JavaScript (no TypeScript). Express 5. `openai` SDK ≥7.30 (`client.decisions.create`).
- MCP server: `@modelcontextprotocol/sdk` + `@modelcontextprotocol/ext-apps` + `@openai/mcp-extensions`.
- Widget UI bundled with esbuild into a single inline HTML resource.

## Model budget (important)
- All classification: Decisions API, `gpt-6-luna` (cheap, ~0.2s).
- Explanations / text generation: `gpt-6.1-sol`, only for warn/hold verdicts.
- `gpt-6-astra`: only for the Agents API computer-use demo (required there). Never use Ultrafast.

## Layout
- `src/decide.js` — Decisions API wrapper + Structured Outputs fallback.
- `src/guardian.js` — question set, thresholds, verdict policy, explanation.
- `src/store.js` — in-memory held payments + live event stream.
- `src/mcp.js` — MCP tools + widget resource (ChatGPT plugin).
- `src/server.js` — Express: REST API, SSE, static web demo, `/mcp`.
- `ui/` — widget source (bundled to `dist/`). `web/` — demo payment app + family dashboard.
- `data/eval.jsonl` + `scripts/eval.js` — labeled eval set and calibration report.

## Conventions
- Keep functions small; no frameworks on the web pages (plain HTML/CSS/JS).
- Never log API keys. Load secrets from `.env` via dotenv.
- Run `npm run build` (widget) and `npm start` (server on :8787).
