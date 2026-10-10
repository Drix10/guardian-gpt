# OpenAI Dots — research (as of 2026-10-10)

Tags: [official] / [press] / [community] / [unverified]. Note: openai.com & help.openai.com 403 to WebFetch; learn.chatgpt.com fetched fine.

## Bottom line
**There is no Dots API.** No endpoint/SDK/manifest to create or drive a Dot programmatically. You build **for** Dots via:
1. **A plugin** (MCP server + optional skills/UI) that the user's Dot uses as a connected app.
2. **MCP Events** — webhook triggers that wake a Dot.
For a headless, code-controlled Dot-like agent → **Agents API** (public beta).

## What a Dot is [official — https://openai.com/index/introducing-dots/ , https://learn.chatgpt.com/docs/dots]
- Always-on persistent agent in ChatGPT, **GPT-6 Astra**, own cloud computer + Chrome browser, 4,000+ apps via plugins, works "24/7", learns from feedback.
- Created on desktop app/web: name, handle, avatar (shape, color, eyes, glasses, accessories). No mobile-web setup.
- **One Dot per user** for now ("teams of dots" coming). One long thread, no search [press — MacStories].
- Channels: ChatGPT desktop/web/mobile, voice calls, Slack, Teams; texting "coming soon". Shared context across channels.
- Controls: Pause, stop delegated tasks, cancel recurring, reset context, Delete (doesn't undo past actions). https://learn.chatgpt.com/docs/dots/controls

### Triggers
- **Unprompted**: background "proactive research" with **read-only tools**, private notes; can't message/modify/control browser — enforced in code. https://openai.com/index/how-we-build-safety-security-and-privacy-into-dots/
- **Schedules**: natural-language recurring tasks (what, when+tz+end date, notify-on, destination). https://learn.chatgpt.com/docs/dots/tasks-and-memory
- **Events**: watch connected services; plugins push via MCP Events.

### Memory
Conversation → persistent memory (ChatGPT memories + Dot notes) → cross-channel continuity. Resettable. Disconnecting an app doesn't erase learned info.

### Cloud computer
- Sandboxed Linux + Chrome. Community: Debian 13, **no Docker**, no rootless containers, no Unix sockets [community].
- "Take over" / "Return control". Can connect one personal computer (ChatGPT app must be open). https://learn.chatgpt.com/docs/dots/computers-and-apps
- CAPTCHAs / bot checks block many web errands [press, lower-trust].

### Permissions & safety [official]
- App perms reuse ChatGPT plugin permissions (shared with Work and Codex), e.g. read but not send email.
- **Custom Rules** (Settings > Personalization > Permissions): "Take action without asking" / "Take action when you say so" / "Ask before taking action" / "Hand off to you".
- **Auto-review**: separate checker outside the sandbox validates planned actions vs instructions, rules, safety. https://learn.chatgpt.com/docs/sandboxing/auto-review
- Always confirm: permanent deletes, unknown installs, new sensitive access. Always hand back: password changes, moving money. Purchases w/ saved cards need approval. Health data only to named recipient. Credentials kept out of model context; monitor can pause.

## Developer surface

### Path A — Plugin the Dot uses
- Plugin = MCP server + optional skills, ChatGPT UI, Plugin Extensions. https://developers.openai.com/plugins (full export: https://developers.openai.com/plugins/llms-full.txt)
- Test: ChatGPT Plugins → + → "Add custom MCP server" (public HTTPS `/mcp` or Secure MCP Tunnel) → "Create as a plugin". https://developers.openai.com/plugins/deploy/connect-chatgpt
- Dots use supported plugins installed/enabled on the account. Custom MCP plugins seem to reach Dots [unverified forum report].
- Gotcha: skills in plugin not loaded for custom test plugins. https://community.openai.com/t/support-skills-over-mcp-on-custom-plugin/1394917

### Path B — MCP Events (wakes a Dot) [official — https://developers.openai.com/plugins/build/mcp-events]
- Works in ChatGPT Work chats, Desktop Work (Cloud), **and Dots**. All plans.
- Needs MCP protocol `2026-07-28`, stored subscriptions, outbound HTTPS.
- Methods: `events/list`, `events/subscribe`, `events/unsubscribe`.
- Event def: `name`, `description`, `delivery: ["webhook"]`, `inputSchema`, `payloadSchema`.
- Subscribe params: `{name, arguments, delivery:{mode:"webhook", url, secret:"whsec_..."}}` → returns subscription id + `refreshBefore`.
- Delivery: Standard Webhooks POST `{eventId, name, timestamp, data}`; headers `webhook-id`, `webhook-timestamp`, `webhook-signature`, `X-MCP-Subscription-Id`.
- 256 KiB max, one event/request, idempotent, signed challenge verification. Node sample uses `standardwebhooks`.
- **Big gotcha**: forum report — verified subs + HTTP 200 deliveries but Dot task never ran (`last_run_time=null`); "not very robust yet". https://community.openai.com/t/mcp-events-verified-subscription-and-webhook-http-200-but-dot-task-never-runs/1404198

### Path C — Agents API (Dot-like agent in code) [official]
- Public beta, all devs, token + tool cost only. Computer use, subagents, tool search, context compaction, MCP tools, vaults.
- `POST /v1/agents/sessions`, header `OpenAI-Beta: agents=v1`.
```js
client.beta.agents.sessions.create({
  agent: { model: "gpt-6-astra",
    tools: [{ type: "mcp", server_label, transport: { type: "http", server_url } }],
    multi_agent: { enabled: true, max_concurrent_subagents: 3 } },
  vault_ids: [...],
  environment: { type: "openai_hosted" /* | "self_hosted" */, capability_directories: [...] },
  input: "..."
})
```
- No built-in scheduler found — bring your own cron/webhooks.
- https://openai.com/index/introducing-the-agents-api/ · https://developers.openai.com/api/docs/guides/agents-api/overview · .../quickstart · .../tools/computer-use

### Neighbours
- **ChatGPT Space** (shared team + ChatGPT + Dot workspace) and **Pages** (co-edited docs): Pro/Business/Enterprise. https://chatgpt.com/features/space/
- **Team tasks** (scheduled/event): Business/Enterprise.
- **Sign in with ChatGPT**: https://developers.openai.com/siwc
- **Specialist dots**: enterprise pilot, own identity, Microsoft Agent 365 integration planned.

## Availability & pricing [official — https://learn.chatgpt.com/docs/dots]
- Pro 100/200/500 (18+, **not EEA/UK/CH**); Business Premium (worldwide); Enterprise/Edu/Healthcare beta (admin opt-in). Gradual rollout.
- First Dot free; extra Dots/speed "in the future". Chatting doesn't count to limits; Codex/Work tasks it starts do; "deeper work" allowance extended first month.

## Limitations
One Dot/user, one connected Mac, no thread search; CAPTCHAs; no Docker; flaky MCP Events; plugin connections expire; "run finished" ≠ delivered.
Community: https://github.com/VoltAgent/awesome-openai-dots , open-source clone https://github.com/composio-community/open-dot (unofficial).

## Hackathon options
1. MCP plugin + Events that wakes a Dot (e.g. ticket/deploy-failed → triage → draft PR/reply), demo in Slack. Most "on Dots", but flaky → record backup video.
2. Read-only research plugin for proactive research (competitor prices, grants/RFPs) — lowest approval friction.
3. Write-tools plugin + Custom Rules demo (ask-before vs act-without-asking), results into Pages/Space.
4. Dot-style agent on Agents API with own scheduler — if no Pro/Business Premium or in EU/UK.
5. Hybrid: Agents API app also shipped as a plugin a judge's Dot can call.

**Pre-check:** someone on the team needs Pro/Business Premium outside EEA/UK/CH with Dots visible.
