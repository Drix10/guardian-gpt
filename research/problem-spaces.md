# Problem spaces — where cheap, calibrated, vision-capable decisions create a step change

(Global/US-centric pass. India-scale addendum pending.)

## Platform caveats
- Decisions API: `gpt-6-luna`; predicate/choice/score with probabilities. Independent test (classmethod) measured **~256ms median**, not 150ms; 145–406 input tokens/request. Image-token cost & max options unpublished. https://dev.classmethod.jp/en/articles/openai-decisions-overview/ , https://www.firecrawl.dev/blog/openai-decisions-api-vs-jev
- Cost assumption: ~1,000 input tokens per multimodal decision ≈ $0.0001/decision ≈ $100 per 1M decisions (assumption).
- **Why calibration matters**: LLM verbalized confidence is overconfident (https://arxiv.org/pdf/2604.01457 , https://arxiv.org/html/2603.09985v1). Calibrated probabilities enable **selective automation** — act above threshold, humans handle the uncertain middle.

## Ranked candidates (Impact / Novelty / Demo / Wow)

### 1) Disaster Damage Radar — 9/7/9/10 = 35
- 27 billion-dollar US disasters in 2024, $182.7B, ≥568 deaths (https://climate.gov/news-features/blogs/beyond-data/2024-active-year-us-billion-dollar-weather-and-climate-disasters). FEMA got 250k+ applications in one day (Helene/Milton) (https://fema.gov/fr/node/686379). Inspections 30–45+ days post-Irma (https://www.wptv.com/news/region-c-palm-beach-county/loxahatchee-acreage/people-may-wait-weeks-for-fema-inspections-after-applying).
- `score` on before/after satellite crops; `choice` on survivor posts/photos; fast-track confident cases, uncertain → inspectors. Dot watches feeds.
- Data: xBD/xView2 850,736 buildings (https://arxiv.org/pdf/1911.09296); CrisisMMD (https://arxiv.org/pdf/1805.00713).

### 2) Guardian Dot — scam shield for elders — 9/7/9/9 = 34
- 60+ reported $4.9B losses in 2024 (+43%), 147k complaints, 7.5k lost >$100k (https://www.aarp.org/money/scams-fraud/fbi-report-fraud-2024.html). FTC: true elder loss up to $61.5B (2023) (https://www.ftc.gov/system/files/ftc_gov/pdf/federal-trade-commission-protecting-older-adults-report_102024.pdf). US fraud $12.5B 2024; text scams $470M (https://www.ftc.gov/news-events/press-releases/terms/879).
- Gap: per-message filters miss multi-week cross-channel scams; Google on-device covers SMS/RCS only (https://blog.google/security/new-ai-powered-scam-detection-features/).
- Dot + predicates over email/SMS/pop-up screenshots/bank alerts; >0.9 hold + family approval, middle nudge, low silent. <$1/person/yr (assumption).
- Data: UCI SMS Spam (https://archive.ics.uci.edu/dataset/228/sms+spam+collection), phishing corpora, scripted pig-butchering threads.

### 3) Denial / prior-auth Appeal Autopilot — 10/7/8/8 = 33
- 43 PAs/physician/week, ~12 hrs; 94% delay care; 19% serious adverse event (https://www.ajmc.com/view/ama-survey-highlights-growing-burden-of-prior-authorization-on-physicians-patients). MA: ~50M determinations 2023, 3.2M denials, 11.7% appealed, **81.7% overturned** (https://www.aha.org/news/headline/2025-01-29-kff-ma-insurers-made-nearly-50-million-prior-authorization-determinations-2023). ACA: 20% in-network denied, <1% appealed (https://www.kff.org/private-insurance/claims-denials-and-appeals-in-aca-marketplace-plans-in-2023/). CMS-0057-F timelines (https://www.capminds.com/blog/cms-0057-f-complete-compliance-guide-for-us-health-plans/).
- Criteria as predicates over chart + scanned docs; approve/appeal-only (AI never denies).
- Data: NCD/LCD, Synthea (https://synthetichealth.github.io/synthea/).

### 4) Paperwork Guardian — 9/8/8/8 = 33
- Medicaid unwinding: 25M+ disenrolled, **69% procedural** (https://www.kff.org/medicaid/issue-brief/medicaid-enrollment-and-unwinding-tracker/). ~1 in 5 EITC-eligible don't claim (https://irs.gov/pub/irs-soi/24rpeitcunderclaimsty2021census.pdf).
- Snap letter → `choice` notice type, predicates action-required / deadline ≤14d, `score` urgency → Dot tracks, prefills, escalates when uncertain.

### 5) Continuous safety predicates for blind pedestrians — 8/8/7/10 = 33
- 43M blind, 295M moderate-severe VI (https://pubmed.ncbi.nlm.nih.gov/33275950/); 2.2B with VI (WHO). Be My Eyes 1M+ users, turn-based.
- ~1 fps narrow predicates (walk signal? obstacle? vehicle?), speak only above threshold, ~$0.36/hr. Latency = safety risk → assistive only.
- Data: ImVisible (https://github.com/samuelyu2002/ImVisible), VizWiz.

### 6) Foodborne outbreak radar — 7/8/9/8 = 32
- 48M sick, 128k hospitalized, 3k deaths/yr US (CDC). NYC Yelp: 294k reviews → 468 illness reports, only 3% reported, 3 outbreaks (https://archive.cdc.gov/www_cdc_gov/media/mmwrnews/2014/0522.html). Chicago model-ranked inspections found violations 7.5 days sooner (https://arxiv.org/pdf/1910.04906).
- Data: Yelp Open Dataset ~7M reviews, 200k photos.

### 7) Wildfire smoke first-alert — 8/5/9/9 = 31
- JEC: $394–893B/yr (https://www.jec.senate.gov/...). CA pilot 1,039 cameras, AI beat 911 ~40% of time. Data: FIgLib (https://www.hpwren.ucsd.edu/FIgLib/).

### 8) Crop-disease triage — 9/5/9/7 = 30
- Up to 40% crops lost; $220B+/yr; 475M+ farms <2ha; extension worker ratios 1:1000–3500 vs 1:400. Data: PlantVillage 54,309 imgs. Moderate novelty.

### 9) Legal-aid intake triage — 8/7/8/7 = 30
- 92% of low-income civil problems get no/inadequate help (https://justicegap.lsc.gov/resource/executive-summary); ~3.6M eviction filings; 90% landlords vs 10% tenants represented. Data: Learned Hands / LIST.

### 10) 911 / ED triage co-pilot — 9/6/6/8 = 29
- 1/3 ED encounters mistriaged; 66% sensitivity for critically ill (https://pubmed.ncbi.nlm.nih.gov/36930151/). 911 staffing ~30% short. High regulatory burden. Data: KTAS Kaggle.

### 11) Counterfeit medicine photo check — 9/8/3/8 = 28
- WHO: 1 in 10 medical products in LMICs substandard/falsified; 72k–169k child pneumonia deaths. No good dataset.

### 12) Clinical-trial matching — 8/5/8/6 = 27 (TrialGPT exists)
### 13) CyberTipline / sextortion triage — 9/6/3/6 = 24 (CSAM can't go to 3rd-party APIs)
### 14) SOC alert triage — 7/3/8/6 = 24 (crowded)
### 15) Clinician inbox triage — 7/3/6/5 = 21 (Epic ships it)

## Agent's top 3
1. **Paperwork Guardian** (4+3+9): plugin + Dot; snap any letter → classify, deadline, appeal-win odds; act when confident, navigator when not.
2. **Guardian Dot**: cross-channel scam shield with calibrated thresholds; pig-butchering demo.
3. **Disaster Damage Radar**: xBD + CrisisMMD, calibration curves on stage.
Wildcard: blind-pedestrian predicates (best live demo, safety risk).

---

# India-scale addendum (Bangalore audience)

Gaps (search budget ran out — fetch before pitching): IRDAI claim repudiation, NCRB cybercrime counts, NPCI UPI-fraud counts, BBMP grievance volumes, Bengaluru flood losses, TomTom traffic.
Model budget: Decisions API/`gpt-6-luna` for all classify/route/triage; `gpt-6.1-sol` for generation/orchestration; Astra not strictly needed; no Ultrafast. Voice via Bhashini/AI4Bharat ASR → Decisions on transcript.
Judge tags: [V] Visa payments trust/safety, [G] Google multilingual/a11y/agri, [M] Microsoft a11y/multilingual.

### A) Kavach — UPI & "digital arrest" scam shield — 10/7/9/9 = 35 [V][G]
- **₹22,845.73 cr lost to cyber fraud in 2024 (+206%), 36.37 lakh complaints** (I4C/MHA — https://www.angelone.in/news/market-updates/cyber-fraud-costs-indians-22-845-crore-in-2024-government)
- Jan–Sep 2024: stock-trading scams ₹4,636 cr (2.28 lakh); **digital arrest ₹1,616 cr (63,481)**; 45% from SE Asia; ~4.5 lakh mule accounts frozen (https://thewire.in/tech/india-lost-rs-11333-crore-to-cyber-fraud-in-2024)
- RBI FY25: card/internet = 66.8% of bank-fraud cases (https://www.medianama.com/2025/12/223-cards-internet-fraud-66-in-fy25-decline-banking-rbi/)
- UPI 2025: **228B txns, ~₹300 lakh cr** (https://www.businesstoday.in/technology/news/story/upi-ends-2025-on-a-high-with-record-monthly-and-annual-transactions-with-plans-for-future-initiatives-509218-2026-01-02)
- Supreme Court (late 2025) ordered CBI probe, asked why AI/ML isn't used (https://en.wikipedia.org/wiki/Digital_arrest)
- Gap: digital-arrest runs hours over video calls; bank rules see only final transfer; spam filters see one SMS.
- Predicates over SMS/WhatsApp/screenshots (fake CBI call frame, fake trading dashboard, UPI collect)/UPI intent → pause-before-pay + Dot pings family/bank; Sol explains in Kannada/Hindi/Hinglish. Bank-side mule scoring variant.
- Data: no verified public UPI scam dataset → synthetic Hinglish/Kannada threads from I4C advisories + screenshot mockups.

### B) Namma Suraksha — 112/108 + Bengaluru civic triage — 8/8/8/9 = 33 [G][M]
- 112 handled ~29 cr calls nationally (https://outlookindia.com/national/29-crore-calls-handled-by-national-emergency-response-helpline-112-so-far-officials-news-294218)
- **Bengaluru 112: 26.92 lakh calls in 2024, ~58% blank/prank** (https://newskarnataka.com/bengaluru/bengaluru-police-combat-rising-blank-and-crank-calls-to-112-helpline/30032025/)
- **1,72,890 road deaths in 2023 (~20/hr)** (https://www.theweek.in/wire-updates/business/2025/08/28/del82-biz-road-accidents-report.html)
- Bhashini ASR → `score` severity + "blank/prank?"; citizen photos → category/agency `choice`, severity, dedup → live map; calibrated auto-close vs human.
- Data: synthetic transcripts, MoRTH on OpenCity (https://data.opencity.in/dataset/road-accidents-in-india-2023)

### C) Seva Saathi — Paperwork Guardian in Indian languages — 9/6/8/8 = 31 [G][M]
- PM-JAY: 8.9 cr+ admissions (https://newsonair.gov.in/over-8-9-crore-hospital-admissions-authorized-under-ayushman-bharat-health-minister-jp-nadda); CAG 2023 found fake/duplicate beneficiaries, inconsistent settlement, weak grievance redress (https://bwhealthcareworld.com/article/major-discrepancies-in-pmjay-scheme-from-fake-beneficiaries-to-faulty-implementation-cag-report--487172)
- PMFBY: ₹2,829 cr pending 2016-18 (old, refresh). Literacy 80.9% (7+) → ~1 in 5 can't read letters.
- Novelty risk: Microsoft Research/AI4Bharat **Jugalbandi** exists → differentiate on vision, calibrated escalation, acting on behalf.

### D) Crop disease + PMFBY loss evidence — 9/6/9/7 = 31 [G]
- 146M holdings, 86% small/marginal (~0.6 ha). Photos double as geotagged claim evidence. Data: PlantVillage.

### E) Court pendency triage (NJDG) — 9/8/6/6 = 29
- **4,76,57,328 pending in district courts + 63,66,023 in HCs (31 Dec 2025)**; govt cites lack of mechanisms to "track and group cases" (https://ianslive.in/over-476-crore-cases-pending-across-indian-courts-govt-tells-parliament--20260213184542). Weak on stage.

### F) Road safety — 9/5/8/8 = 30 [G]
- 4,80,583 crashes 2023; two-wheelers 44.8% of deaths; 54,568 no-helmet deaths (https://www.nextias.com/ca/current-affairs/30-08-2025/road-accidents-in-india-2023-report). Data: IIIT-H IDD.

### G) Fake/substandard medicines — 8/8/5/8 = 29
- Coldrif DEG syrup killed 24 children in 2025 (https://en.wikipedia.org/wiki/2025_India_cough_syrup_crisis). No packaging dataset.

### H) MSME credit/KYC — 8/5/7/6 = 26 [V]
- Credit gap ₹20–25 lakh cr (RBI committee) / ~₹30 lakh cr (SIDBI); only 14% access formal credit. Crowded.

### India data helpers
AI4Bharat (IndicTrans2, IndicVoices, Kathbath, Shrutilipi, IndicXlit) https://ai4bharat.iitm.ac.in/ · Bhashini APIs https://bhashini.gov.in/ · data.gov.in / OpenCity.

### Agent's revised top 3 (Bangalore)
1. **Kavach** (UPI/digital-arrest shield) — demo: Jayanagar grandparent on fake digital-arrest call; ₹4 lakh transfer frozen live. Visa angle.
2. **Namma Suraksha** (112 + civic triage, live Bengaluru map).
3. **Seva Saathi** (vernacular paperwork guardian).
Runner-up: NJDG court triage.
