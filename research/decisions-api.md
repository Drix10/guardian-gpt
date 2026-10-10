# OpenAI Decisions API — research (as of 2026-10-10)

Confidence tags: **[official]** = developers.openai.com docs / changelog / openai-python repo; **[press]** = news/newsletters; **[unverified]** = SEO/explainer only.

## TL;DR
- **Public beta since Oct 6, 2026** (announced as limited preview at DevDay Sept 29). Changelog: "Decisions API released in beta with GPT-6 Luna … typed answers 10x faster than the Responses API." [official]
- `POST https://api.openai.com/v1/decisions`, model `gpt-6-luna` only.
- Bounded outputs + **calibrated probabilities/confidence built in**. No free-text reasoning.
- **$0.10 / 1M input tokens, $0 output.** [official]
- Image input supported (base64 data URLs only).
- Standard API key + SDK upgrade should work — **smoke-test with curl first** (per-org gating not confirmed).

## Endpoint & schema [official]
Guide: https://developers.openai.com/api/docs/guides/decisions

Required: `model` (`"gpt-6-luna"`), `input` (string or array of user messages), `questions` (array).

Every question: `type`, `name` (unique id), `instructions`.

| type | extra fields | answer fields |
|---|---|---|
| `predicate` | — (condition in `instructions`) | `probability` (0–1) |
| `choice` | `choices: [{value, description}]` | `choice`, `confidence`, `probabilities: [{value, probability}]` |
| `score` | ordered `levels: [{label, description}]` | `score` (prob-weighted, can be fractional), `confidence`, `probabilities: [{value (0-indexed), label, probability}]` |

Response: `answers[]`, each echoing `type` + `name`, e.g.
`{"type":"choice","name":"department","choice":"billing","probabilities":[...],"confidence":0.93}`

Image input (base64 data URL only; http(s) URLs and `file_id` rejected):
```json
[{"role":"user","content":[
  {"type":"input_text","text":"Which button should the agent click?"},
  {"type":"input_image","image_url":"data:image/png;base64,...."}]}]
```

Independent questions → one request (evaluated over same input). Dependent questions → sequential requests.

SDK: `client.decisions.create(...) -> Decision` (types `Decision`, `DecisionInputMessageParam`, `DecisionInputTextParam`, `DecisionInputImageParam`). Min versions: Python openai ≥3.26.0, JS ≥7.30.0, Go ≥3.73.0, Ruby ≥0.101.0, Java ≥4.78.0. https://github.com/openai/openai-python/blob/main/api.md

```python
from openai import OpenAI
client = OpenAI()
d = client.decisions.create(
    model="gpt-6-luna",
    input="I was charged twice for my order.",
    questions=[
      {"type":"choice","name":"department","instructions":"Route this ticket.",
       "choices":[{"value":"billing","description":"Payments, refunds, charges"},
                  {"value":"shipping","description":"Delivery issues"},
                  {"value":"other","description":"Anything else"}]},
      {"type":"predicate","name":"urgent","instructions":"Customer is angry or losing money."},
      {"type":"score","name":"severity","instructions":"Rate severity.",
       "levels":[{"label":"low","description":"..."},{"label":"med","description":"..."},{"label":"high","description":"..."}]}
    ])
for a in d.answers: print(a)
```
(`questions` contents reconstructed from field definitions; guide sample was truncated on fetch.)

## Model / latency / pricing / limits
- Model: GPT-6 Luna (launched Sept 22). Commentary: "a light shim over Luna" without Jev-style calibration training. [official model / press commentary — https://www.latent.space/p/ainews-openai-devday-2026-dots-61]
- Latency: official = "~10x faster than Responses API". ~150ms vs ~1.6s figure is from a DevDay slide cited by press. [press — https://www.firecrawl.dev/blog/openai-decisions-api-vs-jev]
- Pricing: $0.10/1M input, no output/cache charges; regional & long-context multipliers apply [official]; exact multipliers (2x >272K, +10% regional) [unverified — smartscope].
- Limits: max questions/choices/context and Decisions-specific RPM/TPM **undocumented**. Luna: 5k RPM / 2M TPM (Build tier), 1.05M ctx. https://developers.openai.com/api/docs/models/gpt-6-luna
- Compliance: ZDR, HIPAA-eligible, US/EU residency. [official]

## Fallback if `/v1/decisions` is blocked
Structured Outputs with enums on `gpt-6-luna` via Responses API, `reasoning.effort: "none"`. Expect ~1–2s and $0.50/M output. Wrap both behind one `decide(input, questions) -> answers` adapter.

## Pairings (our inference — no official integration doc found)
- **Agents API** (public beta, hosted browsers / computer use): cheap per-step controller over screenshots — next action, task done?, needs human approval? Gate expensive Sol/Astra calls.
- **Dots**: approval / autonomous / forbidden boundary classification via predicates.
- **Plugins**: fast UI decisions inside panels.

## Limitations & reactions
- Beta, Luna only, no hosted image URLs, no explanations, undocumented limits.
- Community: "teaser with sparse docs" vs "more potential than Jev". HN submission ~6 pts. TypeSafe founder responded publicly.

## Competitor: Jev (TypeSafe AI) [press]
Purpose-built decision model, GA on OpenRouter since Sept 15; p50 0.21s; text-only; 32–64K ctx; $0.042/1M input. OpenRouter also calls its product "Decisions API" — make sure you hit api.openai.com.

## Hackathon ideas
1. Screenshot co-pilot / agent step selector with live probability "explainability" panel.
2. Model router: `score` difficulty → Luna / Sol / Astra; show $ saved.
3. Realtime triage/moderation dashboard with confidence-threshold escalation.
4. Camera-based visual QA against a fixed taxonomy.
5. Adaptive UI picking components in ~150ms.
6. Benchmark: Decisions vs Structured Outputs vs Jev (latency, accuracy, calibration, cost).

## Links
- Guide: https://developers.openai.com/api/docs/guides/decisions
- Changelog: https://developers.openai.com/api/docs/changelog
- Luna: https://developers.openai.com/api/docs/models/gpt-6-luna
- SDK: https://github.com/openai/openai-python/blob/main/api.md
- Community: https://community.openai.com/t/devday-2026-announcements-and-developer-resources/1402006
- Press: https://aiweekly.co/alerts/openai-launches-decisions-api-public-beta-on-gpt-6-luna , https://www.firecrawl.dev/blog/openai-decisions-api-vs-jev

Note: openai.com/index/devday-2026-recap returned 403 to the fetcher; no API-reference page found (guessed URL 404'd).
