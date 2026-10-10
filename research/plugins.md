# ChatGPT / Codex Plugins & Plugin Extensions — research (as of 2026-10-10)

Tags: [OFFICIAL] developers.openai.com / learn.chatgpt.com / help.openai.com / github.com/openai / forum; [PRESS]; [LOW] SEO-only.
openai.com recap 403'd; facts via https://community.openai.com/t/devday-2026-announcements-and-developer-resources/1402006 and https://learn.chatgpt.com/docs/whats-new/devday-2026.md
**Docs index:** https://developers.openai.com/plugins/llms.txt · full: https://developers.openai.com/plugins/llms-full.txt

## 1. What a plugin is [OFFICIAL]
- Package = **skills** (SKILL.md) + **one MCP server** + **optional UI**. Installs in ChatGPT **and** Codex — one universal directory. https://developers.openai.com/plugins
- **Apps SDK → "MCP server + UI" part of a plugin.** Blueprints still https://github.com/openai/openai-apps-sdk-examples . `.app.json` (`plugin_asdk_app_…`) is a compat identifier.
- Migration: keep MCP server → wrap in plugin (`plugin.json` + `.app.json`/`mcp.json` + skills) → optionally add `openai/ui` entrypoints. Build on open **MCP Apps** standard (`ui://` resources, JSON-RPC over postMessage); use `window.openai` only for gaps.
- **Plugin extensions** (via **OpenAI MCP Extensions**): sidebar apps, conversation panels, file viewers/editors, settings, deep links, composer @-mentions, richer forms.
- Claude Code plugins can be submitted too; cross-vendor schema `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`.

## 2. Architecture [OFFICIAL]

### Layout & manifest — https://developers.openai.com/plugins/build/plugins.md
```
my-plugin/
├── plugin.json          (or .codex-plugin/plugin.json)
├── mcp.json / .mcp.json
├── .app.json
├── skills/<name>/SKILL.md
├── hooks/  scripts/  assets/
```
```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "my-plugin", "version": "0.1.0", "description": "...",
  "extensions": { "com.openai": {
    "apps": "./.app.json", "hooks": "./hooks/hooks.json",
    "onboardingSkill": "./skills/setup/SKILL.md",
    "interface": { "displayName": "My Plugin", "category": "Productivity",
                   "composerIcon": "./assets/icon.png", "logo": "./assets/logo.png" } } }
}
```
`mcp.json` → `streamable-http` URL; auth `none` | `oauth` | `mixed` | `api_key`.

### UI — https://developers.openai.com/plugins/build/chatgpt-ui.md
- Sandboxed iframe, MCP Apps standard. JSON-RPC: `ui/initialize`, `ui/notifications/tool-input`, `ui/notifications/tool-result`, `tools/call`, `ui/update-model-context`, `ui/message`.
- React → esbuild/Vite single ESM, served as `text/html;profile=mcp-app`.
- CSP: `connectDomains`, `resourceDomains`, `frameDomains` (only for 3rd-party iframes).
- Only the render tool gets `_meta.ui.resourceUri`.
- ChatGPT-only `window.openai`: `requestCheckout`, `uploadFile`, `selectFiles`, `setWidgetState`/`widgetState`, `requestModal`, `displayMode`, `maxHeight` — feature-detect.

### Extension points — spec https://github.com/openai/mcp-extensions/blob/main/docs/spec.md , guide https://developers.openai.com/plugins/build/extensions
```ts
const toolMetadata = {
  ui: { resourceUri: "ui://parts/library" },
  "openai/ui": { entrypoints: [{ type: "global" }] } satisfies OpenAIUiToolMetadata,
};
// thread panel: { type: "thread" }   file viewer: { type: "file", extensions: ["stl"] }
```
| Point | What | Where |
|---|---|---|
| `global` | sidebar app, fullscreen | all |
| `thread` | side panel next to conversation | all |
| `file` | file viewer/editor | **desktop only** |
| display modes | `["inline","fullscreen"]` (no pip) | |
| deep links | `codex://plugins/{id}/app/{tool}?path=…`, `https://chatgpt.com/plugins/{id}/app/{tool}?path=…` | |
| settings | `capabilities.extensions["openai/settings"] = {readTool, updateTool}` | |
| @-mentions | `openai/mentions` + read-only `searchTool` → `resource_link`s | **desktop only** |
| extended forms | MRTR elicitation, thumbnails (`x-openai-thumbnail`), suggestions, pickers | desktop; web partial |
| model context / messages | `openai/modelContext`; `openai/message {target, send}` (`send:false` = draft) | desktop+web |

File viewer protocol: `resources/read` on `host-resource://…` → etag + `writable`; save via `openai/resources/write` with `ifMatch` → `saved|conflict|too-large`; live updates `resources/subscribe`; server gets real path in `_meta["openai/resource"].path`.

### SDKs — https://github.com/openai/mcp-extensions (Apache-2.0, ~956★)
- npm `@openai/mcp-extensions` (`/server`, `/app`); PyPI `openai-mcp-extensions`.
- Server: `@modelcontextprotocol/server@^2` + `new OpenAIExtensions(server)`, `registerAppTool`, `registerAppResource`, `requestFormInput`, `getResourcePath`.
- App: `@modelcontextprotocol/ext-apps@^1.7.5` + `new OpenAIExtensions(app)` + `@openai/mcp-extensions/app/styles.css`.
- Targets MCP **2026-07-28** (legacy 2025-11-25 supported).

### Auth — https://developers.openai.com/plugins/build/auth.md
OAuth 2.1 + PKCE S256; `/.well-known/oauth-protected-resource`; CIMD > DCR > predefined client; echo `resource` → `aud`; RFC 9207 `iss`; redirect `https://chatgpt.com/connector_platform_oauth_redirect`; per-tool `securitySchemes`; 401 + `WWW-Authenticate` (or `_meta["mcp/www_authenticate"]`).

### MCP Events — https://developers.openai.com/plugins/build/mcp-events
`events/list|subscribe|unsubscribe`, webhook delivery (Standard Webhooks, ≤256 KiB, one event/req, `X-MCP-Subscription-Id`), challenge verification, persistent subs, refresh. MCP `2026-07-28`. Works in Work chats (web), desktop w/ Cloud, and Dots. (See dots.md for reliability gotcha.)

### Connections to other products
- **Sites** can host an MCP server → ChatGPT builds a plugin; per-visitor accounts; workspace-private; Business/Enterprise/Edu. https://help.openai.com/en/articles/20001547-hosting-a-plugin-with-chatgpt-sites
- **Dots** use plugins; MCP Events trigger them.
- **Agents API**: pass plugin dir/ZIP in `environment.capability_directories`; tools don't reload into existing sessions; no UI mentioned. https://developers.openai.com/api/docs/guides/agents-api/tools/plugins
- **Codex**: same package format; hooks (SessionStart gets `PLUGIN_ROOT`, `PLUGIN_DATA`); `codex plugin marketplace add|list|upgrade|remove`. Extension UI rendering in Codex not documented. https://developers.openai.com/codex/plugins/build/
- ChatGPT Space / Pages: no plugin docs found (Space exists: https://chatgpt.com/features/space/).

## 3. Scaffold → run → test → ship
1. **10-min smoke test** (https://developers.openai.com/plugins/quickstart): chatgpt.com/plugins → + → Add custom MCP server → `https://tinymcp.dev/api/moldy-aloof-zettabyte/mcp`, No auth → Create as a plugin → install from `?view=personal` → **Work** tab → `@` → `roll_dice`.
2. **Own server + UI** (https://developers.openai.com/plugins/build/app-quickstart.md): `npm i @modelcontextprotocol/sdk @modelcontextprotocol/ext-apps zod`; `server.js` + `public/todo-widget.html` on `:8787/mcp`; `npx @modelcontextprotocol/inspector@latest`; `ngrok http 8787`; add `https://<x>.ngrok.app/mcp`.
3. **Extensions**: `@openai/mcp-extensions` + `openai/ui` entrypoints. Kitchen-sink example: https://github.com/openai/mcp-extensions/tree/main/plugins/bits-and-bolts (React 19, Vite, Tailwind, three.js STL viewer; scripts `build`, `build:plugin:dev`, `build:remote`, `start:remote`).
4. **Package**: in Work/Codex `@plugin-creator create a plugin for ChatGPT and Codex using my MCP server. Use plugin_asdk_app_… Include a personal marketplace entry so I can test it locally.` — or `~/.agents/plugins/marketplace.json` + restart desktop.
5. **Submit** (https://developers.openai.com/plugins/deploy/submission): ZIP, validation, 5 positive + 3 negative tests, video, reviewer creds, org verification, Owner/"Apps Management Write". One review at a time; no API-key auth in portal; remove lifecycle hooks; MCP server changes rescanned daily.

## 4. Availability / distribution / money
- Extensions on web "coming soon to Free and Go" → paid plans now (inference). File viewers + @-mentions desktop only. Sites+plugins: Business/Ent/Edu. MCP Events: Work chats.
- One public directory, workspace sharing, private marketplaces (local, git-subdir, npm). Country restriction in manifest. In-conversation recommendations.
- Monetization: external checkout recommended; in-ChatGPT `requestCheckout` = private beta (physical goods); Stripe, Adyen, PayPal, Checkout.com, Fiserv, Worldpay. No rev-share documented. https://developers.openai.com/plugins/build/monetization.md

## 5. Gotchas
- "Create MCP App" missing → enable **Developer Mode** at chatgpt.com/settings/security (some Pro users lacked toggle — rollout gating). https://community.openai.com/t/create-mcp-app-missing-from-plugins-menu-on-personal-chatgpt-accounts/1401436
- Test in **Work** mode, not Chat.
- Blank widget = CSP or missing bundled JS; ngrok timeouts; 401 without `WWW-Authenticate`. https://developers.openai.com/plugins/deploy/troubleshooting.md
- Version skew across packages — follow mcp-extensions README versions.
- Desktop-only features can't be demoed on web.
- Launch partners: Canva (sidebar), Figma (@-mentions), Adobe (Acrobat/Photoshop file handlers). [PRESS] https://itbrief.com.au/story/openai-adds-plugin-extensions-across-chatgpt-codex

## 6. Hackathon plan
- Hr 0–1: tinymcp smoke test (Dev Mode, Work tab).
- Hr 1–4: fork bits-and-bolts or Pizzaz; ngrok; connect.
- Day 1: one strong surface (`global` sidebar dashboard or `thread` panel editor) + `ui/update-model-context` + `ui/message`.
- Day 2: `file` viewer (desktop demo) or MCP Events automation; package with `@plugin-creator` for ChatGPT + Codex.
- Skip public submission; use `auth: none`/`mixed` unless OAuth matters.
