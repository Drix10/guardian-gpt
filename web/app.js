const SCENARIOS = [
  {
    id: "live", names: { them: "Caller", me: "Amma" }, label: "Live call, nothing typed",
    payment: { payeeName: "RBI Verification Cell", payeeId: "rbi.verify2291@okaxis", amount: 450000, firstTime: true },
    situation: { onCall: true, callType: "whatsapp_video", callerInContacts: false, callMinutes: 38, usualMaxAmount: 15000, payeeAccountAgeDays: 3, payeeReports: 7 },
    chat: [],
  },
  {
    id: "arrest", situation: { onCall: true, callType: "whatsapp_video", callerInContacts: false, callMinutes: 52, usualMaxAmount: 20000, payeeAccountAgeDays: 12, payeeReports: 2 }, names: { them: "Caller", me: "Amma" }, label: "Digital arrest call", payment: { payeeName: "RBI Verification Cell", payeeId: "rbi.verify2291@okaxis", amount: 450000, firstTime: true },
    chat: [
      ["sys", "WhatsApp video call from +91 98XXX XXX21. A man in police uniform, CBI logo on the wall behind him."],
      ["them", "I am Inspector Vikram Sharma, CBI Mumbai. A FedEx parcel in your Aadhaar name has 5 passports and 200g MDMA."],
      ["them", "You are under DIGITAL ARREST. Do not disconnect this call. Do not tell your son or anyone, it will compromise the investigation."],
      ["me", "Sir I have done nothing, please help me 🙏"],
      ["them", "To prove innocence transfer ₹4,50,000 to RBI verification account. Fully refunded in 2 hours after verification."],
    ],
  },
  {
    id: "trading", situation: { onCall: false, usualMaxAmount: 25000, payeeInContacts: false, payeeAccountAgeDays: 20, payeeReports: 3 }, names: { them: "Group admin", me: "Amma" }, label: "Fake trading group", payment: { payeeName: "Elite Capital VIP Desk", payeeId: "elitecap.desk@ybl", amount: 200000, firstTime: true },
    chat: [
      ["them", "Welcome to SEBI-Registered Elite VIP Stock Group 🚀 Our mentor's IPO picks gave 312% last month."],
      ["them", "Your app dashboard shows profit ₹6,84,000. To withdraw, pay 30% 'tax clearance' first."],
      ["me", "Can you deduct it from the profit?"],
      ["them", "No madam, SEBI rule. Pay within 1 hour or the account is frozen and profits lost."],
    ],
  },
  {
    id: "mum", situation: { onCall: false, usualMaxAmount: 10000, payeeInContacts: false, payeeAccountAgeDays: 45, payeeReports: 0 }, names: { them: "New number", me: "Amma" }, label: "\"Hi Mum, new number\"", payment: { payeeName: "Priya S", payeeId: "priya.help22@paytm", amount: 38000, firstTime: true },
    chat: [
      ["them", "Hi Mum, this is my new number, old phone fell in water 😭"],
      ["them", "Can you pay my hostel fees urgently? Deadline today. Send to my friend Priya's UPI, my bank app isn't working on this phone."],
      ["me", "Beta call me once?"],
      ["them", "Can't talk mic broken. Please mum quickly, will explain later ❤️"],
    ],
  },
  {
    id: "legit", situation: { onCall: false, usualMaxAmount: 8000, payeeInContacts: true, payeeAccountAgeDays: 2100, payeeReports: 0 }, names: { them: "Ravi, son", me: "Amma", safe: true }, label: "Son's electricity bill", payment: { payeeName: "Ravi Kumar", payeeId: "ravi.kumar@oksbi", amount: 4500, firstTime: false, note: "BESCOM bill money for Ravi (my son)" },
    chat: [
      ["them", "Amma, the BESCOM bill came, ₹4,480. Can you send me ₹4,500 on my SBI UPI? I'll pay it from my app tonight like every month."],
      ["me", "Ok kanna, sending to your usual UPI now."],
      ["them", "Thanks Amma, I'll call you after office 📞"],
    ],
  },
  {
    id: "agent", situation: { usualMaxAmount: 100000, payeeAccountAgeDays: 6, payeeReports: 1 }, names: { them: "Agent", me: "You", safe: false }, label: "AI agent at checkout", payment: { payeeName: "Amazon Deals Checkout", payeeId: "amaz0n-deals-checkout.shop", amount: 89999, firstTime: true, actor: "AI shopping agent (on behalf of user)" },
    chat: [
      ["me", "Agent task: buy an iPhone 17 under ₹95,000 from a trusted seller."],
      ["them", "Found 'Amazon Mega Diwali Deal' through an Instagram ad. The link opened amaz0n-deals-checkout.shop."],
      ["them", "Page says 'Only 2 left! Offer ends in 04:59'. Checkout only accepts a direct UPI transfer: no card, no cash on delivery."],
    ],
  },
];

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
let current = SCENARIOS[0];
let images = [];
let currentId = null;

function loadScenario(s) {
  payToken++;
  inflight?.abort();
  current = s;
  images = [];
  resetPhone();
  $("thumbs").innerHTML = "";
  for (const k of ["payeeName", "payeeId", "amount"]) $(k).value = s.payment[k];
  $("firstTime").checked = s.payment.firstTime;
  $("amtLabel").textContent = Number(s.payment.amount).toLocaleString("en-IN");
  $("noticed").innerHTML = noticed(s);
  $("chat").hidden = !s.chat.length;
  $("chat").innerHTML = s.chat.map(([who, t]) => who === "sys"
    ? `<div class="sys">${t}</div>`
    : `<div class="msg ${who}${who === "them" && !s.names.safe ? " threat" : ""}" data-who="${s.names[who]}">${t}</div>`).join("");
  document.querySelectorAll("#scenarios button").forEach((b) => b.classList.toggle("on", b.dataset.id === s.id));
  $("result").className = "result empty";
  $("result").innerHTML = "Press Pay on the phone. Guardian reads everything on the left and decides before any money moves.";
}

// Signals the payment app collects by itself, shown the way a person would say them.
function noticed(s) {
  const x = s.situation;
  if (!x) return "";
  const rows = [];
  if (x.onCall) rows.push(["Call", `${{ whatsapp_video: "WhatsApp video call", whatsapp_audio: "WhatsApp voice call" }[x.callType] ?? "Phone call"} with ${x.callerInContacts === true ? "a saved contact" : x.callerInContacts === false ? "an unknown number" : "someone"}${x.callMinutes != null ? `, ${x.callMinutes} min so far` : ""}`, x.callerInContacts === false]);
  else if (x.onCall === false) rows.push(["Call", "Not on a call", false]);
  if (x.screenShareApp) rows.push(["Screen", `${x.screenShareApp} is open`, true]);
  if (x.usualMaxAmount) {
    const k = s.payment.amount / x.usualMaxAmount;
    rows.push(["Amount", k >= 2 ? `${Math.round(k)}x her usual largest payment` : "Within her normal range", k >= 2]);
  }
  rows.push(["Payee", s.payment.firstTime ? "First payment to this person" : "Paid before", s.payment.firstTime]);
  if (x.payeeAccountAgeDays != null) rows.push(["Account age", x.payeeAccountAgeDays < 30 ? `Opened ${x.payeeAccountAgeDays} days ago` : `${Math.round(x.payeeAccountAgeDays / 365)}+ years old`, x.payeeAccountAgeDays < 30]);
  if (x.payeeReports != null) rows.push(["Reports", x.payeeReports ? `${x.payeeReports} scam reports on this UPI ID` : "No scam reports", x.payeeReports > 0]);
  const typed = s.chat.length ? "" : `<p class="none-typed">Amma didn't type or upload anything.</p>`;
  return `<h3>What the phone noticed, automatically</h3><dl class="signals">${rows.map(([k, v, bad]) => `<dt>${k}</dt><dd class="${bad ? "bad" : ""}">${v}</dd>`).join("")}</dl>${typed}`;
}

$("scenarios").innerHTML = SCENARIOS.map((s) => `<li><button data-id="${s.id}"><span>${s.label}</span><span class="amt">₹${Number(s.payment.amount).toLocaleString("en-IN")}</span></button></li>`).join("");
$("scenarios").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (b) loadScenario(SCENARIOS.find((s) => s.id === b.dataset.id));
});

// Screenshots → downscaled data URLs (the Decisions API takes base64 images inline).
const MAX_IMAGES = 4;
$("file").addEventListener("change", async (e) => {
  const forScenario = current;
  for (const f of e.target.files) {
    if (images.length >= MAX_IMAGES) break;
    try {
      const url = await downscale(f);
      if (current !== forScenario) break;
      images.push(url);
      const img = document.createElement("img");
      img.src = url;
      img.alt = "Attached screenshot";
      $("thumbs").append(img);
    } catch {
      // Not an image we can read: skip it.
    }
  }
  e.target.value = "";
});
function downscale(file, max = 1024) {
  return new Promise((resolve, reject) => {
    const src = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(src);
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = Object.assign(document.createElement("canvas"), { width: Math.round(img.width * k), height: Math.round(img.height * k) });
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(src);
      reject(new Error("unreadable image"));
    };
    img.src = src;
  });
}

// The phone screen is re-rendered often, so listen on the container (event delegation).
const PHONE_FORM = $("screen").innerHTML;
const STATUS_BAR = `<div class="statusbar"><span>9:41</span><span>5G&nbsp;&nbsp;82%</span></div>`;
let language = "en";
function resetPhone() {
  $("screen").dataset.state = "form";
  $("screen").innerHTML = STATUS_BAR + PHONE_FORM;
  $("language").value = language;
}
$("screen").addEventListener("click", (e) => {
  if (e.target.closest("#payBtn")) pay();
});
$("screen").addEventListener("input", (e) => {
  if (e.target.id === "amount") $("amtLabel").textContent = Number(e.target.value || 0).toLocaleString("en-IN");
});
$("screen").addEventListener("change", (e) => {
  if (e.target.id === "language") language = e.target.value;
});

let payToken = 0;
let inflight = null;

// Put the payer's own edits back after an error, instead of resetting the scenario.
function restoreForm(payment) {
  resetPhone();
  $("payeeName").value = payment.payeeName ?? "";
  $("payeeId").value = payment.payeeId ?? "";
  $("amount").value = Number.isFinite(payment.amount) ? payment.amount : "";
  $("firstTime").checked = Boolean(payment.firstTime);
  $("amtLabel").textContent = inr(payment.amount);
}

async function pay() {
  const token = ++payToken;
  inflight?.abort();
  inflight = new AbortController();
  const payment = {
    payeeName: $("payeeName").value.trim(), payeeId: $("payeeId").value.trim(), amount: Number($("amount").value),
    firstTime: $("firstTime").checked, actor: current.payment.actor, note: current.payment.note,
  };
  const shots = [...images]; // exactly what is sent, even if more files finish loading meanwhile
  const context = current.chat.map(([who, t]) => `${who === "me" ? "PAYER" : who === "sys" ? "CONTEXT" : "OTHER PARTY"}: ${t}`).join("\n");
  phoneLang = language;
  showPhone("checking");
  $("result").className = "result";
  $("result").innerHTML = `<div class="spinner"></div><p>Reading the ${current.chat.length ? "conversation, the " : ""}phone's signals and the payment…</p>`;
  try {
    const res = await fetch("/api/check", {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: inflight.signal,
      body: JSON.stringify({ payment, context, images: shots, language, situation: current.situation ?? null }),
    });
    const item = await res.json().catch(() => ({}));
    if (token !== payToken) return;
    if (!res.ok) throw Object.assign(new Error(item.error ?? `HTTP ${res.status}`), { status: res.status });
    currentId = item.id;
    renderResult(item, shots.length);
    showPhone(item.verdict, item);
  } catch (err) {
    if (token !== payToken || err.name === "AbortError") return;
    restoreForm(payment);
    $("result").className = "result";
    $("result").innerHTML = err.status === 400
      ? `<p class="error">${esc(err.message)}</p><p class="note">Fix that on the phone and press Pay again.</p>`
      : `<p class="error">Guardian couldn't decide right now.</p><p class="note">${esc(err.message)} Your details are kept. Check that the server is running and OPENAI_API_KEY is set in .env, then press Pay again.</p>`;
  }
}

const pct = (p) => `${Math.round((p ?? 0) * 100)}%`;
const LABELS = {
  impersonates_authority: "Claims to be police, bank or govt",
  pressure_or_secrecy: "Threats, rush or secrecy",
  payee_mismatch: "Payee doesn't fit the story",
};
const tone = (p) => (p >= 0.8 ? "bad" : p >= 0.35 ? "warn" : "ok");
const bar = (label, p, t = tone(p)) => `<div class="bar"><span>${label}</span><div class="track"><div class="fill ${t}" style="width:${pct(p)}"></div></div><b>${pct(p)}</b></div>`;
const inr = (n) => Number(n ?? 0).toLocaleString("en-IN");
const patternName = (v) => (v === "unclear_pattern" ? "not clear from signals alone" : String(v ?? "").replaceAll("_", " "));

// The stamp follows the payment's life: Held → Blocked / Approved.
const STAMP = { hold: ["Held", "hold"], warn: ["Check", "warn"], allow: ["Clear", "allow"], blocked: ["Blocked", "hold"], approved: ["Approved", "allow"], expired: ["Expired", "warn"] };
const STAMP_SUB = {
  hold: "Payment paused until family approves", warn: "Payment needs a second look", allow: "Payment goes through",
  blocked: "Blocked by the family", approved: "Approved by the family", expired: "Nobody decided in time; the payment did not go through",
};
// It is always Rahul's decision; say where he made it rather than guessing who pressed what.
const decider = () => "Rahul";
const decidedWhere = (by = "") => (/web/i.test(by) ? "on the family dashboard" : "in ChatGPT");
const POLICY = {
  probability: "Guardian holds at 80% or more, asks for a second look from 35%, and otherwise stays out of the way.",
  risk: "Held because the risk was rated high even though the probability is under 80%: Guardian errs on the side of a pause.",
};
const stamp = (key) => `<span class="stamp land ${STAMP[key][1]}" id="verdictStamp">${STAMP[key][0]}</span>`;

function renderResult(item, nShots = 0) {
  const types = (item.scamTypeProbabilities ?? []).filter((t) => t.probability >= 0.02).sort((a, b) => b.probability - a.probability).slice(0, 3);
  const shots = nShots ? ` and ${nShots} screenshot${nShots > 1 ? "s" : ""}` : "";
  const by = { decisions: "the OpenAI Decisions API (gpt-6-luna)", fallback: "the fallback model", unavailable: "a cautious default (the models were unreachable)" }[item.source] ?? item.source;
  $("result").innerHTML = `
    <div class="verdict-row">
      <div class="big">${pct(item.probability)}<small>chance this is a scam</small></div>
      ${stamp(item.verdict)}
    </div>
    <p class="stamp-sub" id="stampSub">${STAMP_SUB[item.verdict]}</p>
    ${(item.signals ?? []).map((s) => bar(LABELS[s.name] ?? s.name, s.probability)).join("")}
    <h3>Which scam it looks like</h3>
    ${types.map((t) => bar(patternName(t.value), t.probability, t.value === "legitimate" ? "ok" : tone(t.probability))).join("")}
    ${item.explanation ? `<div class="explain">${esc(item.explanation)}</div>` : ""}
    <p class="meta">Decided in ${item.decisionsMs} ms by ${by}: one call, six questions, ${current.chat.length ? "the chat and " : ""}the phone's signals${shots}.</p>
    <p class="policy">${item.verdict === "hold" && item.reason === "risk" ? POLICY.risk : POLICY.probability}</p>`;
}

const ICON = {
  ok: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" stroke-width="3"/><path d="M14 25l7 7 13-15" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  hold: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" stroke-width="3"/><path d="M19 15v18M29 15v18" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>',
  warn: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5L45 42H3z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M24 18v12" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><circle cx="24" cy="36" r="2.2" fill="currentColor"/></svg>',
};

// Phone copy follows the language the payer chose.
const PHONE = {
  en: {
    checking: "Guardian is checking…",
    paid: (p) => `Paid ₹${inr(p.amount)}`, to: (p) => `to ${esc(p.payeeName || p.payeeId)}`,
    warnTitle: "Wait, this looks unusual", cancel: "Cancel payment",
    held: "Payment paused", onCall: "You're on a call with an unknown number. You can hang up.", waiting: "We've asked your son Rahul to confirm. You'll see his answer here.",
    blocked: (who) => `${who} blocked this payment. Your money is safe.`, report: "To report it, call 1930 or visit cybercrime.gov.in",
    approved: (who) => `${who} approved it. Payment sent.`, expired: "Nobody confirmed in time, so the money was not sent.", reset: "Start over",
  },
  hi: {
    checking: "Guardian जाँच कर रहा है…",
    paid: (p) => `₹${inr(p.amount)} का भुगतान हो गया`, to: (p) => `${esc(p.payeeName || p.payeeId)} को`,
    warnTitle: "रुकिए, यह असामान्य लग रहा है", cancel: "भुगतान रद्द करें",
    held: "भुगतान रोका गया", onCall: "आप एक अनजान नंबर से कॉल पर हैं। आप कॉल काट सकते हैं।", waiting: "हमने आपके बेटे राहुल से पुष्टि करने को कहा है। उनका जवाब यहीं दिखेगा।",
    blocked: () => "राहुल ने यह भुगतान रोक दिया। आपका पैसा सुरक्षित है।", report: "शिकायत के लिए 1930 पर कॉल करें या cybercrime.gov.in पर जाएँ",
    approved: () => "राहुल ने मंज़ूरी दे दी। भुगतान भेज दिया गया।", expired: "समय पर किसी ने पुष्टि नहीं की, इसलिए पैसे नहीं भेजे गए।", reset: "फिर से शुरू करें",
  },
};
let phoneLang = "en";

function showPhone(state, item) {
  const s = $("screen");
  s.dataset.state = state;
  const bar = STATUS_BAR;
  const t = PHONE[phoneLang] ?? PHONE.en;
  if (state === "checking") s.innerHTML = `<div class="ph ph-check"><div class="spinner"></div><p>${t.checking}</p></div>`;
  if (state === "allow") s.innerHTML = `<div class="ph ph-ok"><div class="ico">${ICON.ok}</div><h3>${t.paid(item.payment)}</h3><p>${t.to(item.payment)}</p></div>`;
  if (state === "warn") s.innerHTML = `<div class="ph ph-warn"><div class="ico">${ICON.warn}</div><h3>${t.warnTitle}</h3><p>${esc(item.explanation)}</p><button class="btn-pay" onclick="window.__reset()">${t.cancel}</button></div>`;
  if (state === "hold") s.innerHTML = `<div class="ph ph-hold"><div class="ico">${ICON.hold}</div><h3>${t.held}</h3>${item.situation?.onCall && item.situation?.callerInContacts === false ? `<p class="oncall">${t.onCall}</p>` : ""}<p>${esc(item.explanation)}</p>
      <div class="waiting" id="waiting">${t.waiting}</div></div>`;
  s.insertAdjacentHTML("afterbegin", bar);
  s.insertAdjacentHTML("beforeend", `<button class="reset" onclick="window.__reset()">${t.reset}</button>`);
}

// Live updates when the family approves/blocks (from ChatGPT, the web dashboard or a family agent).
function applyDecision(item) {
  if (!item || item.id !== currentId || !["blocked", "approved", "expired"].includes(item.status)) return;
  const t = PHONE[phoneLang] ?? PHONE.en;
  const who = decider(item.resolvedBy);
  if ($("waiting")) {
    $("waiting").outerHTML = item.status === "blocked"
      ? `<div class="waiting done bad">${t.blocked(who)}<br><small>${t.report}</small></div>`
      : item.status === "approved"
        ? `<div class="waiting done ok">${t.approved(who)}</div>`
        : `<div class="waiting done">${t.expired}</div>`;
  }
  if ($("verdictStamp")) {
    $("verdictStamp").outerHTML = stamp(item.status);
    $("stampSub").textContent = item.status === "expired" ? STAMP_SUB.expired : `${STAMP_SUB[item.status]} (Rahul, ${decidedWhere(item.resolvedBy)})`;
  }
}
const stream = new EventSource("/api/events");
stream.onmessage = (e) => {
  const item = JSON.parse(e.data);
  if (!item.reset) applyDecision(item);
};
// A missed event (reconnect, server restart) can't strand the phone on "waiting".
stream.onopen = async () => {
  if (!currentId || !$("waiting")) return;
  const all = await fetch("/api/payments").then((r) => r.json()).catch(() => []);
  applyDecision(Array.isArray(all) ? all.find((p) => p.id === currentId) : null);
};

window.__reset = () => loadScenario(current);
loadScenario(SCENARIOS[0]);
