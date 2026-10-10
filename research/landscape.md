# What's already built (Jev + DevDay launches) — saturation map

## Jev / decision-model ecosystem
- ~1,000+ projects (awesome-jev 981 entries; PyTorchKR index 1,142; arXiv survey 2,170 repos).
- Top traction: browser-use/jev-ultrafast (22k★), fast-jev-compaction (7.5k★), Vercel agent-command safety middleware, LangChain model routing, Jev Plays Pokémon, open Jev clones, Inbox Zero, DocJev, tax-doc-classifier, SQL plugins, HA-Jev, jev-oncall, World Monitor, trading bots.
- TypeSafe raised $870M @ $7.5B on Oct 9. "Jev in 25 lines" HN 692 pts (a parody).

## Already built on OpenAI launches since DevDay
- Decisions: simonw/llm-openai-decisions; per-simmons/decisions-api-demos (game bot, auto-blur PII in recordings, bad-take cutter, voice control, X feed cleaner, focus orb, wiki race); HA camera alerts; Decisions MCP server; luna-pruner; ERCOT grid alerts; intent router; Vercel PR triage; tattoo image classifier.
- Dots: Decision Lab overnight build, Dot as PM, Dot negotiating customer service, 7-agent Lean proof swarm, dot2api, WhatsApp/Telegram/WeChat bridges, 10+ clones.
- Plugins: mcp-extensions examples, SEO sidebar dashboard, JobPaper, mcp-events-starter, hookdeck mcp-events-bridge.
- Agents API: Mars mission sim; little else.

## SATURATED — avoid
Agents playing games · model/agent routers (~100) · browser clickers · coding-agent guards / compaction / MCP firewalls · eval/calibration benchmarks · trading bots · email/ticket triage · feed/chat moderation · Luna-vs-Jev benchmarks · Dots clones · Dots for inbox/meeting prep/bug hunting (OpenAI's own demos).
Image decisions not unique vs other competitors (Cloudflare Clef, pplx-decider, Liquid d1) — only vs Jev.

## THIN / OPEN
Compliance/legal (2), voice (5), robotics (9), finance (8), moderation (10), labeling (10).
- **UPI / digital-arrest / elder scam shield: NOT FOUND** on any launch (closest: text-only 0★ Jev SMS scam filter, jev-guard exchange risk gate). Nothing with images, UPI, digital arrest, or family loop. ← both agents' #1 gap
- **Civic/112 triage: NOT FOUND** on Decisions/Dots (JEVATHON had FirstMinute stroke scorer, LiftLine).
- **Welfare paperwork: NOT FOUND** (adjacent: tax-doc-classifier, formanator).
- **Real-world action consent gate** for Dots/Agents (predicate check of outbound email/payment/form vs user boundaries) — only shell-command guards exist.

## Design risks to handle
- Decisions returned `type:"refusal"` on banking questions (PIN retrieval, crypto, account access) in one benchmark → scam content may trigger refusals; handle explicitly. https://stacktoheap.com/blog/2026/10/08/jev-the-decisions-strike-back/
- Overconfidence: 99% stated → 68% correct in one test (https://anth.us/blog/openai-decisions-api-preview/). Calibrate our own thresholds on a labeled set.
- Choice-order bias (86%→73% moving option first→last). Prefer predicates; shuffle/average if needed.
- Base64 images only, no caching, Luna only. Dots needs Pro and is not in EU/UK.
