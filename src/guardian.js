import { client, decide } from "./decide.js";

export const SCAM_TYPES = [
  { value: "digital_arrest", description: "Fake police/CBI/customs/court threatening arrest and demanding payment" },
  { value: "investment_trading", description: "Fake stock, crypto or task-based investment promising returns" },
  { value: "kyc_phishing", description: "Fake bank KYC / account block asking for OTP, PIN, link click or app install" },
  { value: "refund_collect_request", description: "Fake refund, cashback or UPI collect request where paying 'receives' money" },
  { value: "family_impersonation", description: "Someone pretending to be a relative or friend in an emergency" },
  { value: "romance_or_job", description: "Romance, lottery, prize or job-offer advance-fee scam" },
  { value: "agent_checkout_fraud", description: "An AI agent or user on a fake shop / spoofed checkout page" },
  { value: "unclear_pattern", description: "Looks like a SCAM, but which kind of scam cannot be told from the information available. Never use this for a genuine payment." },
  { value: "legitimate", description: "A normal, genuine payment" },
];

export const QUESTIONS = [
  { type: "predicate", name: "is_scam", instructions: "The payer is being deceived or coerced into this payment by a scammer." },
  { type: "predicate", name: "impersonates_authority", instructions: "Someone in the context claims to be police, CBI, a court, a regulator, a bank, or a government body." },
  { type: "predicate", name: "pressure_or_secrecy", instructions: "The payer is pressured with threats, extreme urgency, secrecy, or told not to disconnect or not to tell family." },
  { type: "predicate", name: "payee_mismatch", instructions: "The payee does not plausibly match who the payer believes they are paying (e.g. a personal UPI ID for a 'government' account, or a lookalike shop domain)." },
  { type: "choice", name: "scam_type", instructions: "Which pattern best describes this payment?", choices: SCAM_TYPES },
  {
    type: "score", name: "risk", instructions: "How dangerous is it to complete this payment right now?",
    levels: [
      { label: "safe", description: "Normal payment, no red flags" },
      { label: "caution", description: "Some red flags worth a second look" },
      { label: "high", description: "Likely scam" },
      { label: "critical", description: "Clear scam with immediate loss of money" },
    ],
  },
];

// Calibrated policy: act alone only when confident, otherwise involve a human.
export const THRESHOLDS = { hold: 0.8, warn: 0.35 };

// Signals a UPI / bank app can collect on its own (permission given once, in advance).
// The payer types nothing; these are written out in plain words for the model.
export function describeSituation(s, payment = {}) {
  if (!s) return [];
  const out = [];
  const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
  if (s.onCall) {
    const kind = { whatsapp_video: "a WhatsApp video call", whatsapp_audio: "a WhatsApp voice call", phone: "a phone call" }[s.callType] ?? "a call";
    const who = s.callerInContacts ? "someone saved in their contacts" : "an unknown number that is NOT in their contacts";
    out.push(`The payer is on ${kind} RIGHT NOW with ${who}${s.callMinutes != null ? `; the call has lasted ${s.callMinutes} minutes` : ""}.`);
  } else if (s.onCall === false) {
    out.push("The payer is not on any call.");
  }
  if (s.screenShareApp) out.push(`A screen-sharing / remote-control app (${s.screenShareApp}) is open on the phone.`);
  if (s.usualMaxAmount && payment.amount) {
    const x = payment.amount / s.usualMaxAmount;
    out.push(x >= 2
      ? `This payment is ${Math.round(x)}x the payer's usual largest payment (${inr(s.usualMaxAmount)}).`
      : `This amount is within the payer's normal range (usual largest payment ${inr(s.usualMaxAmount)}).`);
  }
  if (s.payeeInContacts != null) out.push(s.payeeInContacts ? "The payee is a saved contact of the payer." : "The payee is not in the payer's contacts.");
  if (s.payeeVerifiedMerchant) out.push("The payee is a verified merchant (checked by the payment network).");
  if (s.payeeAccountAgeDays != null) out.push(`The payee's UPI account is ${s.payeeAccountAgeDays} days old.`);
  if (s.payeeReports != null) out.push(s.payeeReports > 0
    ? `The payee's UPI ID has ${s.payeeReports} scam reports in the shared fraud registry.`
    : "The payee's UPI ID has no scam reports in the shared fraud registry.");
  return out;
}

export function buildInput({ payment = {}, context = "", images = [], situation = null }) {
  const lines = [
    "A PAYMENT IS ABOUT TO BE MADE.",
    `Amount: ₹${payment.amount == null ? "?" : Number(payment.amount).toLocaleString("en-IN")}`,
    `Payee name shown: ${payment.payeeName ?? "unknown"}`,
    `Payee UPI ID / account / site: ${payment.payeeId ?? "unknown"}`,
    `First payment to this payee: ${payment.firstTime ? "yes" : "no"}`,
    payment.note ? `Payment note: ${payment.note}` : null,
    payment.actor ? `Initiated by: ${payment.actor}` : null,
    "",
  ];
  const signals = describeSituation(situation, payment);
  if (signals.length) {
    lines.push("PHONE & PAYMENT SIGNALS (collected automatically by the payment app; the payer typed nothing):");
    for (const s of signals) lines.push(`- ${s}`);
    lines.push("");
  }
  lines.push("WHAT HAPPENED BEFORE THE PAYMENT (messages, calls, screens the payer chose to share):");
  lines.push(context || "(nothing shared: the payer did not type or upload anything; judge from the signals above)");
  const text = lines.filter((l) => l !== null).join("\n");
  const content = [{ type: "input_text", text }];
  for (const url of images) content.push({ type: "input_image", image_url: url });
  return [{ role: "user", content }];
}

export async function assess({ payment, context, images = [], language = "en", situation = null }) {
  const { answers, source, ms } = await decide(buildInput({ payment, context, images, situation }), QUESTIONS);
  const p = answers.is_scam?.probability ?? 0;
  const risk = answers.risk?.score ?? 0;
  const verdict = p >= THRESHOLDS.hold || risk >= 2.5 ? "hold" : p >= THRESHOLDS.warn || risk >= 1.5 ? "warn" : "allow";
  const signals = ["impersonates_authority", "pressure_or_secrecy", "payee_mismatch"].map((name) => ({
    name,
    probability: answers[name]?.probability ?? 0,
  }));
  const result = {
    verdict,
    probability: p,
    risk,
    riskProbabilities: answers.risk?.probabilities ?? [],
    scamType: answers.scam_type?.choice ?? "legitimate",
    scamTypeProbabilities: answers.scam_type?.probabilities ?? [],
    signals,
    decisionsMs: ms,
    source,
    payment,
    situation,
    language,
  };
  const evidence = [...describeSituation(situation, payment), context].filter(Boolean).join("\n");
  result.explanation = verdict === "allow" ? null : await explain(result, evidence, language);
  return result;
}

const LANGS = { en: "simple English", hi: "simple Hindi (Devanagari script)" };

async function explain(result, context, language) {
  const flags = result.signals.filter((s) => s.probability >= 0.5).map((s) => s.name).join(", ") || "none";
  try {
    const res = await client.responses.create({
      model: "gpt-6.1-sol",
      instructions:
        `You are Guardian, protecting an elderly person from payment scams. In ${LANGS[language] ?? LANGS.en}, ` +
        "write at most 3 short sentences: why this payment was paused, and exactly what to do now. " +
        "Warm, calm, no jargon. Never tell them they are stupid. Real police never ask for money on a call. " +
        "Write rupee amounts in the Indian format exactly as given (for example ₹4,50,000).",
      input:
        `Verdict: ${result.verdict}. Scam pattern: ${result.scamType}. Red flags: ${flags}. ` +
        `Payment: ₹${Number(result.payment?.amount ?? 0).toLocaleString("en-IN")} to ${result.payment?.payeeName} (${result.payment?.payeeId}).\nContext:\n${context}`.slice(0, 4000),
    });
    return res.output_text.trim();
  } catch (err) {
    console.warn("[explain] failed:", err.status ?? err.message);
    return "Guardian paused this payment because it looks like a scam. Please talk to a family member before sending money.";
  }
}
