# The hackathon — Bengaluru, Oct 10 2026

## Most likely event
**"DevDay Exchange Community Meetup & Hackathon (Finale): Bengaluru"** — https://luma.com/0bdmf0sw (listed on official Codex Community calendar https://luma.com/codex-community)
- Hosts: Tushar Mehta, Kushal Vijay (Codex Ambassadors), Rhiannon Payne, Pauline P. Narvas, Polaris School of Technology, Mayank Raj, Madhvan Sharma. Community-led, separate from official DevDay Exchange.
- **Sat Oct 10, 10:00 AM – 2:30 PM IST**, Polaris School of Technology (EPIP Zone). Sold out.
- Focus areas: **Dots, plugin extensions (sidebar/panels), Agents API w/ computer use, MCP Events, Codex + GPT-6.1 Sol.** (Decisions API not listed — but allowed.)
- **Judging (exact): "usefulness, technical execution, originality, and how well the solution works."** No weights.
- Present: "show what you built, explain the problem it solves, and demonstrate how you used OpenAI's tools." Live demo; no video/repo requirement found.
- Prize: **10 tickets to official DevDay Exchange Bengaluru (Oct 16)**. No cash/credits found.
- Unknown: team size, judges, pre-existing code rule.

### ⚠ Format discrepancy (earlier indexed version of the page, snippets only)
- "A **14-day community hackathon** ran **Sep 27 – Oct 9** … top 10 projects invited to demo live at the meetup."
- "Build an AI-powered app with OpenAI Models (**with extra points for using Astra**), an agent, a developer tool, or an automation…"
- Submissions due Oct 9; Oct 10 = Codex workflows, finalist demos, winner announcements.
→ Today is either a finale or a ~4.5h build day. **Confirm with organizers.** Astra bonus may apply → use Astra where it's genuinely needed (Agents API).

## Same organizers' previous event (judge taste)
"OpenAI Codex Community Hackathon – Bengaluru", Aug 15/16 2026 (https://luma.com/mrm3xiov): judged on what was built, **"how meaningfully Codex was used"**, clarity of demo. Submission: problem, Codex usage demo, product demo, GitHub link. Extending existing projects allowed. Encouraged parallel tasks, Skills, worktrees.
Earlier: "OpenAI Codex Hackathon – Bengaluru", Apr 16 2026 (https://luma.com/x495vdw1), OpenAI Developers + GrowthX, tracks Agentic Coding / UX for Agentic Apps / Multimodal / Domain Agents / Evals. Winners not public.

## Other Codex hackathons now
Istanbul Oct 12 (Usefulness, Execution, Use of Codex, Potential) · Tokyo Oct 20 (Codex only; Claude Code/Cursor/Devin banned) · Philippines Oct 17 · Sea x OpenAI Vietnam Oct 31.

## Past winners & patterns
- **Build Week (Jul 2026)**, 47k builders, 8k projects (https://developers.openai.com/blog/build-week-winners): Second Voice (dysarthria), veTriage (vet intake by non-coder, piloted), Echo Canvas (constrained schemas + deterministic geometry), Mechanica (cites evidence or declines), Pulse (cardiac arrest), Sentinel (MCP security scanner, model parameterizes but never writes), Dấu (retry when unsure).
- **Codex Hackathon SF (Feb 2026)**, judges incl. Greg Brockman: 1st **openCortex** — "the decision layer" won it: "Agents generate candidates, and the system decides what deserves action" (https://www.rippletide.com/resources/blog/winning-the-openai-codex-hackathon-moving-from-outputs-to-outcomes-the-decision-layer). Finalist **Yolodex** — Codex skills, parallel subagents in worktrees, AGENTS.md loop (https://github.com/qtzx06/yolodex).
- **Tokyo (Apr 2026)**: SB OAI Japan incident-response agent; "built without humans writing a single line of code".
- Kochi (Apr 2026): Reelit, X86, Archie.

**Patterns:** specific user + real workflow; constrained AI (schemas, gates, honest "I don't know"); visible deep Codex use (skills, AGENTS.md, subagents, worktrees); background/long-running agents not chat wrappers; polished end-to-end demo; newest features; one-sentence problem.

## Playbook
- One user, one workflow, end to end. India-obvious problem.
- Hit all 4 criteria deliberately; zero demo failures.
- Show Codex: AGENTS.md + skills folder, parallel Codex Cloud tasks / worktrees, `/agents` screenshot, Codex code review merges, a stats slide (tasks, PRs, % Codex-written). Build with Codex, not other AI coding tools.
- 3-min demo: 15s problem+user → 90s live run → 30s OpenAI/Codex usage → 15s limits/next.
- Show an approval gate before writes. Pre-recorded backup. Public README.
- Avoid: chat wrapper, over-scope, preview dependency without fallback, no Codex story, long slides, overclaiming.

---

# Winners from other events (fetched pages)

## OpenAI Build Week (Jul 2026, global) — https://developers.openai.com/blog/build-week-winners
Criteria: technical implementation, design/UX, potential impact, idea quality.
- Life: **Second Voice** (1st, dysarthria sentence suggestions; "smallest UX decisions carried the most weight"), **AirBridge for Windows** (2nd, AirPlay from Windows, deterministic policy layer). Finalists: Bander (family preview of AI assistant permissions), O2 (air quality/wildfire), SayAhead (Deaf phone calls).
- Work: **veTriage** (1st, vet intake/urgency routing by non-coder vet, piloted), **Pulse** (2nd, cardiac-arrest state tracking, asks confirmation when unclear). Finalists: LabSpace AI, OpenCounsel, Tomok.
- Dev tools: **Echo Canvas** (1st, acoustic design; AI as constrained authoring layer), **Sentinel** (2nd, MCP server security scanner; "constraining a model is harder than prompting one"). Finalists: Emberframe, GenUI, Vibe Signal (watch app to steer Codex).
- Education: **Mechanica** (1st, ancient Chinese machines museum, cites evidence / competing interpretations), **Dấu** (2nd, Vietnamese tone coach, retry when ambiguous). Finalists: Canopy, Encore!, ResearchOS.

## Codex Hackathon SF (Feb 2026; Brockman judging)
- 1st: persistent multi-agent research platform with a **decision layer** (extract ideas → graph → PageRank-style ranking; "outputs accumulate while progress does not").
- Finalist **Yolodex**: autonomous YOLO labeling/training pipeline built as 6 Codex skills + AGENTS.md, parallel subagents in git worktrees. https://github.com/qtzx06/yolodex

## Global Codex Hackathon Tokyo (Apr 2026)
- Winner SB OAI Japan: **incident-response agent** (logs → root cause → remediation tasks → recovery plan), built with zero human-written code. Criteria: deep Codex integration, business impact, scalability/reusability, demo/pitch.

## JEVATHON (decision-model hackathon — closest analog to Decisions API)
- Winner **Jevolution**: evolution simulator; decision model picks each animal's next move ("middle path between rules-based sim and an LLM agent per animal").
- Others: FirstMinute (paramedic stroke scale, asks only about uncertain items), KYC Sentinel (clear/review/flag routing), JevBag & Flinch (coding-agent gates ~100ms), LiftMinute (elevator emergency calls), Brailly (accessibility: ranks page elements by task relevance), Jevfusion (image gen from decisions), Beethoven (decisions conduct music).
- Winning factors: **scoped down in first 20 minutes**; **multimodal inputs (screenshots, photos, video frames)** made demos visually compelling.

## gpt-oss hackathon (2025)
RoboChef (best overall), smell printer, Steam Print, Memory Palace, Dental Assessment GPT, Bota.

## Kochi Codex Community (Apr 2026)
Reelit, X86, Archie — no descriptions public.

## Cross-event pattern
Winners are NOT local-government tools. They cluster into: (1) accessibility for a specific disability, (2) a professional's real workflow (vet, ER, SRE), (3) developer/agent infrastructure, (4) visually striking creative/simulation demos. Common thread: specific user, constrained AI + deterministic core, asks/escalates when unsure, flawless live demo, deep visible Codex use.
