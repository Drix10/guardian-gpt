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
- Agents API demo: `gpt-6-luna`. Never use Ultrafast; avoid `gpt-6-astra`.

## Layout
- `src/decide.js` — Decisions API wrapper; rejects incomplete answers; Structured Outputs fallback; cautious default (never fails open).
- `src/guardian.js` — question set, `verdictFor` (the single verdict rule), automatic phone/payment signals, explanations.
- `src/validate.js` — zod schemas for every input. `src/limits.js` — local vs remote rate limits.
- `src/store.js` — bounded in-memory payments; only waiting payments can be decided. `src/notify.js` — payment_held webhook.
- `src/mcp.js` — MCP tools + ChatGPT widget resource (bump WIDGET_URI whenever ui/ changes).
- `src/app.js` — Express app (localhost-only except /mcp); `src/server.js` just listens.
- `ui/` — widget source (bundled to `dist/`). `web/` — demo payment app, family dashboard, accuracy page.
- `test/` — `npm test` (no API calls), `npm run test:live`. `data/eval.jsonl` + `scripts/eval.js` — labelled eval.

## Conventions
- Keep functions small; no frameworks on the web pages (plain HTML/CSS/JS).
- Never log API keys. Load secrets from `.env` via dotenv.
- Run `npm run build` (widget) and `npm start` (server on :8787). Run `npm test` before every commit.
- Escape all dynamic text before putting it in HTML. Never default a missing model answer to "allow".
