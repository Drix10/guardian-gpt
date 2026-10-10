# OpenAI DevDay 2026 (Sep 29) — full launch inventory (as of 2026-10-10)

Tags: [OFFICIAL] developers.openai.com / learn.chatgpt.com / help.openai.com / forum; [PRESS] Simon Willison, Latent Space, Decrypt, CNBC; [UNVERIFIED] snippets/SEO.
openai.com/index/*, chatgpt.com/features/*, help.openai.com 403'd to fetcher. Canonical list: https://community.openai.com/t/devday-2026-announcements-and-developer-resources/1402006 · Keynote: https://www.youtube.com/watch?v=Fls_onRviPM

**Corrections:** Agents API public beta started **Sep 10** (DevDay added computer use). GPT-6 Astra shipped **Sep 3**; GPT-6 Sol/Luna **Sep 22**; **GPT-6.1 Sol** at DevDay. "Ultrafast" = speed tier, "Pro 500" = ChatGPT plan (not models).

## 1. Checklist
| # | Launch | Status | Link |
|---|---|---|---|
| 1 | GPT-6.1 Sol — near-Astra at 1/5 price | GA API/ChatGPT/Codex | https://openai.com/index/introducing-gpt-6-1-sol/ |
| 2 | Ultrafast tier (8x Codex, 6x API) | Astra GA; Sol Oct 8 | https://developers.openai.com/api/docs/guides/ultrafast-mode |
| 3 | Agents API (hosted Codex harness) | Public beta since Sep 10 | https://openai.com/index/introducing-the-agents-api/ |
| 4 | Computer use in Agents API | Beta (new) | https://developers.openai.com/api/docs/guides/agents-api/tools/computer-use |
| 5 | Decisions API | Preview → public beta Oct 6–7 | https://community.openai.com/t/decisions-api-is-now-available-in-public-beta/1403877 |
| 6 | Amazon Bedrock Managed Agents (Agents API on AWS) | Launched | https://aws.amazon.com/bedrock/managed-agents-openai/ |
| 7 | Private Intelligence: ZDR + Private Safety Processing | ZDR orgs; Private Inference preview fall | https://developers.openai.com/api/docs/guides/private-safety-processing |
| 8 | Codex Cloud (runs w/ laptop closed) | Launched ("preview limitations") | https://learn.chatgpt.com/docs/cloud |
| 9 | Codex CLI refresh (voice, /agents, resume, worktrees) | GA v0.143.0 | https://learn.chatgpt.com/docs/codex/cli |
| 10 | Codex Code Review | Launched | https://learn.chatgpt.com/docs/code-review?surface=app |
| 11 | Codex Security Cloud | GA (per Willison) | https://learn.chatgpt.com/docs/security/setup |
| 12 | Plugin Extensions | Launched; Free/Go soon | https://developers.openai.com/plugins/build/extensions |
| 13 | Plugin discovery / in-chat recs | Launched | https://developers.openai.com/plugins |
| 14 | Plugin submission revamp | Launched | https://developers.openai.com/plugins/deploy/submission |
| 15 | Sites with plugins (per-user data, SQLite, scheduled tasks) | Launched | https://chatgpt.com/features/sites/ |
| 16 | MCP Events | Work chats + Dots; spec draft | https://developers.openai.com/plugins/build/mcp-events |
| 17 | Sign in with ChatGPT (users spend their plan in your app) | Preview, client ID needed | https://developers.openai.com/siwc |
| 18 | OpenAI Marketplace | Eligible enterprises | https://openai.com/business/marketplace/ |
| 19 | Dots | Pro first → Business/Ent; not EEA/CH/UK | https://openai.com/index/introducing-dots/ |
| 20 | Specialist Dots | Enterprise preview | recap |
| 21 | ChatGPT Space | Pro/Business/Ent, web+desktop | https://chatgpt.com/features/space/ |
| 22 | Pages (co-edited docs w/ charts, interactive tools) | In Space | same |
| 23 | Collaborative Slides | "next few weeks" | — |
| 24 | Teams + Team Tasks | Launched | https://learn.chatgpt.com/docs/enterprise/teams |
| 25 | ChatGPT in Slack/Teams | Launched | https://chatgpt.com/features/chatgpt-in-slack-and-teams/ |
| 26 | Meetings plugin | Beta macOS Pro/Business | https://help.openai.com/en/articles/20001546 |
| 27 | Shareable Profiles | Launched | https://help.openai.com/en/articles/20001539 |
| 28 | Pro 500 ($500/mo, 25x Plus, Ultrafast); Pro 200 reopened | GA | https://help.openai.com/en/articles/9793128 |
| 29 | 45% lower TTFT, >30% faster tool calls | GA | recap |
| 30 | OpenClaw enterprise harness | mentioned only | — |
| 31 | Worldwide usage-limit reset | one-off | — |

Pre-DevDay (Sep): GPT-Live 1 GA (Sep 10), project key expiry (Sep 10), key governance (Sep 15), **Responses API multi-agent beta** (Sep 29).

## 2. Models [OFFICIAL — https://developers.openai.com/api/docs/models , /pricing]
| Model | ID | Ctx / out | $/1M in / cached / cache-write / out | Use |
|---|---|---|---|---|
| GPT-6 Astra | `gpt-6-astra` | 1.05M / 128K | 10 / 1 / 12.50 / 50 | hardest reasoning, computer use; powers Dots; Agents API model |
| GPT-6.1 Sol | `gpt-6.1-sol` | 1.05M / 128K | 2 / 0.10 / 2.50 / 10 | **default hackathon model** |
| GPT-6 Luna | `gpt-6-luna` | 1.05M / 128K | 0.10 / 0.01 / 0.125 / 0.50 | high-volume classify/route; Decisions engine; tools+vision |

- Batch/Flex 0.5x, Fast 2x, **Ultrafast 6x** (`service_tier: "ultrafast"`, WebSockets recommended; Luna has none). Sol UF TPM: 1M Build / 4M Launch / 40M Grow; Astra UF: 500K / 1M / 5M. Sol US+EU, Astra US only.
- Sol: matches Astra on DeepSWE, −2.1 on OSWorld 2.0, beats Claude Opus 5.5 on AutomationBench at 1/3 cost; indep ~1pt below Astra at $0.72/task vs $3.26 [PRESS — https://latent.space/p/ainews-openai-devday-2026-dots-61]. Ultrafast up to ~300 tok/s [PRESS — https://simonwillison.net/2026/Sep/29/openai-devday-2026-live-blog/].
- [UNVERIFIED] Astra effort levels low…max; GPT-6.1 Astra reportedly pulled over safety.
- Others: GPT-Image-2.5 (Sunburst/Flare); GPT-Live-1; `gpt-realtime-2.1` (+mini); GPT-Realtime-1.5, -Translate; GPT-Transcribe, GPT-Live-Transcribe, GPT-Realtime-Whisper; GPT-5.6 Cyber; GPT-Rosalind (life sci). Containers $0.03/20min @1GB → $1.92 @64GB. **No video/Sora launch.**

## 3. Agents API [OFFICIAL]
Docs: https://developers.openai.com/api/docs/guides/agents-api/overview · /quickstart · /multi-agent · FAQ https://help.openai.com/en/articles/20001551-agents-api-beta-faq
- OpenAI-hosted **Codex harness** (loop, compaction, recovery, exec, subagents) vs Responses API (you run loop).
- Objects: Agent, Session (durable memory via `session_id`), Environment (`openai_hosted` | `self_hosted` w/ `workspace_directory` | `none`), Events/Items, Tools (programmatic, MCP, web search, computer use), Skills (`capability_directories`).
- Endpoints: `POST /v1/agents/sessions`; `GET|DELETE /v1/agents/sessions/{id}`; `GET|POST /v1/agents/sessions/{id}/events`; `GET /v1/agents/sessions/{id}/items`. Header `OpenAI-Beta: agents=v1`. Scopes `api.agents.read`, `api.agents.write`, `api.responses.write`.
```python
from openai import OpenAI
with OpenAI() as client:
    with client.beta.agents.sessions.create(
        agent={"model": "gpt-6-astra",
               "instructions": "Write clean code, run it, and report the actual output."},
        environment={"type": "openai_hosted"},
        input="Create tree.py ... Run it and show me the output.",
        stream=True,
    ).with_result_collection() as stream:
        for event in stream: print(event.to_json(indent=None), flush=True)
        result = stream.get_final_result()
    print(result.output_text); session_id = result.session_id
```
- Multi-agent: `agent.multi_agent.enabled: true`; `max_concurrent_subagents` (6 in guide / 4 in overview); subagents inherit MCP/web/env, **no function tools**.
- Computer use: `{"type":"computer_use","include_screenshots":true}` + env `desktop.enabled: true`; hosted browser; `agent.session.requires_action` → `computer_use_approval_request` (`browser_origin_access`, `browser_authentication`); creds never reach model; screenshots as base64 JPEG in `computer_use_call` items.
- Limits: US only, **no ZDR**, docs list only `gpt-6-astra`. Cookbook apps: `sev_bot`, `slack_bot`, `data_analyst` under developers.openai.com `/cookbook/examples/agents_api/apps/`.

## 4. Codex [OFFICIAL]
- Cloud: isolated workspaces, reusable envs (secrets, env vars, OIDC, internet toggle); start from web/desktop/mobile/CLI/GitHub/Slack.
- CLI v0.143.0: `curl -fsSL https://chatgpt.com/codex/install.sh | sh`; voice, `/agents`, `codex resume`, worktrees, Ultrafast; 1,751+ plugins.
- **Codex SDK**: `npm i @openai/codex-sdk` / `pip install openai-codex`. TS `new Codex().startThread().run("...")`; Py `Codex().thread_start(model="gpt-6.1-sol", sandbox=Sandbox.workspace_write).run(...)`. https://learn.chatgpt.com/docs/codex-sdk
- Code Review; Security Cloud (scan, "Fix with Codex"); OSS Codex Security CLI https://github.com/openai/codex-security

## 5. Other surfaces
- Space + Pages: Pro/Business/Ent, **no public API** — reach via plugins/MCP/Dots.
- MCP Events: see plugins.md / dots.md (10s callback timeout, cursor replay, idempotent writes).
- Sign in with ChatGPT: OAuth, user's plan pays via Responses API; preview; 16 partners (Devin, Nous/Hermes, T3 Code).
- GPT-Live 1: full-duplex voice ~$0.05/min, delegates to backend model via `delegation_id`, results via `session.commentary.append`; telephony. https://openai.com/index/introducing-gpt-live-1-in-the-api/
- Trust: ZDR + Private Safety Processing (your bucket, attested runtime), key expiry/governance, computer-use approvals.
- Sites: SQLite, scheduled tasks, per-user plugin data; 8M sites [PRESS].

## 6. Hackathons found
- **Sea x OpenAI Codex Hackathon, HCMC, Oct 31** — teams 3–4, built on the day, ≤40 teams; tracks: Autonomous & Adaptive AI / AI-Native Products & Ops / Deep Domain AI; $30K/$15K/$5K credits + Pro; judged on problem framing, build quality, depth of thinking, **effective use of Codex**. https://codexhackathon.sea.com/
- Cerebral Valley Codex Hackathon SF (Feb 5) — $90K credits, Greg Brockman judging. https://cerebralvalley.ai/e/openai-codex-hackathon
- Codex Community Hackathons (Kochi, Hanoi, Istanbul, Seoul) [UNVERIFIED] — Usefulness, Execution, Use of Codex, Potential; $5K/$2.5K/$1K credits + $100 Codex credits.
- OpenAI Build Week (Jul 13–21).
→ Assume "meaningful use of Codex" is judged.
