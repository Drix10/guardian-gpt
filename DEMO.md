# Guardian — demo script & judge prep

## Before you go on stage (checklist)
- [ ] Server running: `npm start` → http://localhost:8787 (pay app), `/family.html` (family), `/eval.html` (accuracy)
- [ ] Tunnel running (cloudflared) and ChatGPT plugin connected (Work tab → `@Guardian`)
- [ ] Two windows side by side: **Pay app** (left) and **Family dashboard** (right) — or ChatGPT sidebar as the family view
- [ ] Do one warm-up "Pay" before you start (first call is slower ~0.6s)
- [ ] Backup: screen-record one full run now, in case wifi dies

---

## The 3-minute pitch

### 0:00 – 0:20 · The problem (say it slowly)
> "Last year Indians lost **₹22,845 crore** to cyber fraud — up 206%. Americans reported **$12.5 billion**.
> The worst kind is the 'digital arrest': a fake CBI officer on a video call tells a retired person they're under arrest,
> don't hang up, don't tell your family, and pay to clear your name.
> Banks can stop a *stolen* card. They can't stop *you* sending your own money — because to the bank, it looks like a normal payment."

### 0:20 – 0:35 · The idea
> "Guardian is **the decision layer for payments**. Right before money moves, it looks at the **whole situation** —
> the chat, the call, the screenshots, who you're paying — and makes one calibrated decision: **allow, warn, or hold**.
> When it's confident it's a scam, it pauses the payment and asks your family. When it's not sure, it never acts alone."

### 0:35 – 1:50 · Live demo (the money shot)
1. **Pay app → "🚔 Digital arrest"** scenario is loaded. Point at the chat: *"Inspector Sharma, CBI… don't tell your son… pay ₹4.5 lakh to an 'RBI verification account'."*
2. Press **Pay ₹4,50,000**.
3. Phone turns red: **"Payment paused"** with the explanation. Right panel: **100% scam**, the three red flags (pretends to be police, secrecy/threats, payee doesn't match), pattern = *digital arrest*, **decided in ~200 ms**.
4. Switch language to **हिन्दी** and press Pay again → same decision, explanation in Hindi (mentions 1930 helpline).
5. Go to the **Family dashboard** (or ChatGPT sidebar → Guardian) → the held payment is waiting for "Rahul" → click **Block payment**.
6. Back on the phone: **"Rahul blocked this payment. Your money is safe."** — live, no refresh.
7. Now **"✅ Son's electricity bill"** → Pay → **ALLOW, 11%** — goes straight through.
   > "This matters as much as catching scams: if Guardian annoys people on real payments, they'll turn it off."
8. (If time) **"🤖 AI agent checkout"** → HOLD 99%.
   > "And the same decision layer protects **AI agents** that pay for you — Dots and the Agents API now browse and buy on their own. Here an agent was lured to a lookalike Amazon domain."

### 1:50 – 2:30 · How we used OpenAI's tools
- **Decisions API (gpt-6-luna)** — the core. One call asks 6 bounded questions (3 yes/no red flags, is-scam, scam pattern, 4-level risk) over text **and screenshots**, and returns **calibrated probabilities**. ~185 ms median, input-tokens-only pricing → fractions of a paisa per payment, cheap enough to run on **every** UPI payment.
- **Calibrated policy** — hold ≥ 80%, warn ≥ 35%, else allow. Guardian only acts alone when the model is confident; otherwise a human decides.
- **gpt-6.1-sol** — only called when we warn/hold, to explain *why* in plain English/Hindi. We don't use the big model for decisions.
- **ChatGPT plugin (MCP + plugin extensions)** — the family dashboard lives in the ChatGPT **sidebar**; anyone can also `@Guardian` a suspicious message in ChatGPT and get the verdict card with Block/Approve buttons.
- **Codex** — see "How we built it" below (be accurate about what Codex did).

### 2:30 – 2:50 · Does it work? → open `/eval.html`
> "We tested 30 hand-labelled cases — 15 scams across 7 patterns and 15 deliberately *hard* genuine payments: a son abroad asking for fees, a real police e-challan, a new plumber, a friend's hospital loan.
> It caught **all 15 scams with zero false alarms**, identified the pattern every time, median **185 ms**. It's a small test set — a sanity check, not a production benchmark."

### 2:50 – 3:00 · Close
> "Generating payments is easy. **Deciding which ones to trust is the bottleneck.** Guardian is that decision layer — for your parents, and for their AI agents."

---

## Likely judge questions — and answers

**"Google Messages / Truecaller already detect scams."**
> They judge one SMS at a time, on the phone. Guardian decides at the **moment of payment**, over the **whole story** — video-call screenshots, chat, payee, amount — and it can **stop the money** with a family approval loop. It complements spam filters; it's the last line of defence.

**"How would it see WhatsApp/video calls in real life?"**
> The real deployment is **inside the payment app or bank** (the PSP calls Guardian's API before a UPI payment goes through, with the recent context the user shares or the app already has). Consumers can also forward/screenshot to Guardian in ChatGPT. Today's demo simulates the payment app.

**"What about false positives? Old people will get annoyed."**
> That's exactly why we use **calibrated probabilities** and three tiers. Only ≥80% holds; genuine payments in our test scored 2–13%. And a hold isn't a block — family approves in one tap.

**"Can't the model be overconfident?"**
> Yes — public tests show Luna can be overconfident, so we **set thresholds on our own labelled set** (that's what `/eval.html` is for) and would recalibrate on real bank data. Next step: a much larger eval with real reported scams.

**"Why not just use GPT with a prompt?"**
> Free-text answers have to be parsed and aren't calibrated. Decisions API returns **bounded answers + probabilities in one ~0.2s call**, billed on input only — cheap enough for UPI scale (UPI did 228 billion transactions in 2025).
> We measured it: our own fallback (same model, Structured Outputs) took **~2.6 s** for the same question set vs **~0.26 s** with the Decisions API — 10x faster, and no probabilities.

**"Privacy?"**
> We only send the context around a payment the user is about to make; Decisions API supports ZDR and data residency options. Explanations only run on flagged payments.

**"Why does Visa / a bank care?"**
> Authorised push-payment scams are the fraud banks can't block with card-fraud rules, and regulators are pushing liability onto them. Guardian is a drop-in "pause-before-pay" decision API.

**"What's next?"**
> MCP Events so a held payment **wakes the family member's ChatGPT/Dot** instantly; screenshot capture from the payment app; recalibration on real I4C/bank-reported cases; an API for PSPs.

---

## How we built it (keep this honest)
- Research → idea selection → build happened in one session today.
- Stack: Node 24 + Express, `openai` SDK (`client.decisions.create`), MCP server (`@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps`, `@openai/mcp-extensions`), cloudflared tunnel to ChatGPT.
- `AGENTS.md` in the repo documents the architecture and model budget for coding agents.
- Only say Codex did what Codex actually did (see notes from your teammate / Claude).

## If something breaks on stage
- Decisions API error → Guardian automatically falls back to Structured Outputs on Luna (`source: fallback` shows in the meta line). Keep going.
- Tunnel/ChatGPT fails → use `/family.html` as the family view. Same data, same live update.
- Everything fails → play the backup recording.
