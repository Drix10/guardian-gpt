const SCENARIOS = [
  {
    id: "arrest", names: { them: "Caller", me: "Amma" }, label: "Digital arrest call", payment: { payeeName: "RBI Verification Cell", payeeId: "rbi.verify2291@okaxis", amount: 450000, firstTime: true },
    chat: [
      ["sys", "WhatsApp video call from +91 98XXX XXX21. A man in police uniform, CBI logo on the wall behind him."],
      ["them", "I am Inspector Vikram Sharma, CBI Mumbai. A FedEx parcel in your Aadhaar name has 5 passports and 200g MDMA."],
      ["them", "You are under DIGITAL ARREST. Do not disconnect this call. Do not tell your son or anyone, it will compromise the investigation."],
      ["me", "Sir I have done nothing, please help me 🙏"],
      ["them", "To prove innocence transfer ₹4,50,000 to RBI verification account. Fully refunded in 2 hours after verification."],
    ],
  },
  {
    id: "trading", names: { them: "Group admin", me: "Amma" }, label: "Fake trading group", payment: { payeeName: "Elite Capital VIP Desk", payeeId: "elitecap.desk@ybl", amount: 200000, firstTime: true },
    chat: [
      ["them", "Welcome to SEBI-Registered Elite VIP Stock Group 🚀 Our mentor's IPO picks gave 312% last month."],
      ["them", "Your app dashboard shows profit ₹6,84,000. To withdraw, pay 30% 'tax clearance' first."],
      ["me", "Can you deduct it from the profit?"],
      ["them", "No madam, SEBI rule. Pay within 1 hour or the account is frozen and profits lost."],
    ],
  },
  {
    id: "mum", names: { them: "New number", me: "Amma" }, label: "\"Hi Mum, new number\"", payment: { payeeName: "Priya S", payeeId: "priya.help22@paytm", amount: 38000, firstTime: true },
    chat: [
      ["them", "Hi Mum, this is my new number, old phone fell in water 😭"],
      ["them", "Can you pay my hostel fees urgently? Deadline today. Send to my friend Priya's UPI, my bank app isn't working on this phone."],
      ["me", "Beta call me once?"],
      ["them", "Can't talk mic broken. Please mum quickly, will explain later ❤️"],
    ],
  },
  {
    id: "legit", names: { them: "Ravi, son", me: "Amma", safe: true }, label: "Son's electricity bill", payment: { payeeName: "Ravi Kumar", payeeId: "ravi.kumar@oksbi", amount: 4500, firstTime: false, note: "BESCOM bill money for Ravi (my son)" },
    chat: [
      ["them", "Amma, the BESCOM bill came, ₹4,480. Can you send me ₹4,500 on my SBI UPI? I'll pay it from my app tonight like every month."],
      ["me", "Ok kanna, sending to your usual UPI now."],
      ["them", "Thanks Amma, I'll call you after office 📞"],
    ],
  },
  {
    id: "agent", names: { them: "Agent", me: "You", safe: false }, label: "AI agent at checkout", payment: { payeeName: "Amazon Deals Checkout", payeeId: "amaz0n-deals-checkout.shop", amount: 89999, firstTime: true, actor: "AI shopping agent (on behalf of user)" },
    chat: [
      ["me", "Agent task: buy an iPhone 17 under ₹95,000 from a trusted seller."],
      ["them", "Found 'Amazon Mega Diwali Deal' through an Instagram ad. The link opened amaz0n-deals-checkout.shop."],
      ["them", "Page says 'Only 2 left! Offer ends in 04:59'. Checkout only accepts a direct UPI transfer: no card, no cash on delivery."],
    ],
  },
];

const $ = (id) => document.getElementById(id);
let current = SCENARIOS[0];
let images = [];
let currentId = null;

function loadScenario(s) {
  current = s;
  images = [];
  resetPhone();
  $("thumbs").innerHTML = "";
  for (const k of ["payeeName", "payeeId", "amount"]) $(k).value = s.payment[k];
  $("firstTime").checked = s.payment.firstTime;
  $("amtLabel").textContent = Number(s.payment.amount).toLocaleString("en-IN");
  $("chat").innerHTML = s.chat.map(([who, t]) => who === "sys"
    ? `<div class="sys">${t}</div>`
    : `<div class="msg ${who}${who === "them" && !s.names.safe ? " threat" : ""}" data-who="${s.names[who]}">${t}</div>`).join("");
  document.querySelectorAll("#scenarios button").forEach((b) => b.classList.toggle("on", b.dataset.id === s.id));
  $("result").className = "result empty";
  $("result").innerHTML = "Press Pay on the phone. Guardian reads everything on the left and decides before any money moves.";
}

$("scenarios").innerHTML = SCENARIOS.map((s) => `<li><button data-id="${s.id}"><span>${s.label}</span><span class="amt">₹${Number(s.payment.amount).toLocaleString("en-IN")}</span></button></li>`).join("");
$("scenarios").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (b) loadScenario(SCENARIOS.find((s) => s.id === b.dataset.id));
});

// Screenshots → downscaled data URLs (the Decisions API takes base64 images inline).
$("file").addEventListener("change", async (e) => {
  for (const f of e.target.files) {
    const url = await downscale(f);
    images.push(url);
    $("thumbs").insertAdjacentHTML("beforeend", `<img src="${url}">`);
  }
});
function downscale(file, max = 1024) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = Object.assign(document.createElement("canvas"), { width: img.width * k, height: img.height * k });
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.85));
    };
    img.src = URL.createObjectURL(file);
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

async function pay() {
  const payment = {
    payeeName: $("payeeName").value, payeeId: $("payeeId").value, amount: Number($("amount").value),
    firstTime: $("firstTime").checked, actor: current.payment.actor, note: current.payment.note,
  };
  const context = current.chat.map(([who, t]) => `${who === "me" ? "PAYER" : "OTHER PARTY"}: ${t}`).join("\n");
  phoneLang = language;
  showPhone("checking");
  $("result").className = "result";
  $("result").innerHTML = `<div class="spinner"></div><p>Reading the conversation and the payment…</p>`;
  try {
    const res = await fetch("/api/check", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment, context, images, language }),
    });
    const item = await res.json();
    if (!res.ok) throw new Error(item.error ?? `HTTP ${res.status}`);
    currentId = item.id;
    renderResult(item);
    showPhone(item.verdict, item);
  } catch (err) {
    loadScenario(current);
    $("result").innerHTML = `<div class="verdict hold">Error: ${err.message}</div><p>Is the server running and is OPENAI_API_KEY set in .env?</p>`;
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

// The stamp follows the payment's life: Held → Blocked / Approved.
const STAMP = { hold: ["Held", "hold"], warn: ["Check", "warn"], allow: ["Clear", "allow"], blocked: ["Blocked", "hold"], approved: ["Approved", "allow"] };
const STAMP_SUB = {
  hold: "Payment paused until family approves", warn: "Payment needs a second look", allow: "Payment goes through",
  blocked: "Rahul blocked it from the family dashboard", approved: "Rahul approved it from the family dashboard",
};
const stamp = (key) => `<span class="stamp land ${STAMP[key][1]}" id="verdictStamp">${STAMP[key][0]}</span>`;

function renderResult(item) {
  const types = (item.scamTypeProbabilities ?? []).filter((t) => t.probability >= 0.02).sort((a, b) => b.probability - a.probability).slice(0, 3);
  const shots = images.length ? ` and ${images.length} screenshot${images.length > 1 ? "s" : ""}` : "";
  $("result").innerHTML = `
    <div class="verdict-row">
      <div class="big">${pct(item.probability)}<small>chance this is a scam</small></div>
      ${stamp(item.verdict)}
    </div>
    <p class="stamp-sub" id="stampSub">${STAMP_SUB[item.verdict]}</p>
    ${item.signals.map((s) => bar(LABELS[s.name], s.probability)).join("")}
    <h3>Which scam it looks like</h3>
    ${types.map((t) => bar(t.value.replaceAll("_", " "), t.probability, t.value === "legitimate" ? "ok" : tone(t.probability))).join("")}
    ${item.explanation ? `<div class="explain">${item.explanation}</div>` : ""}
    <p class="meta">Decided in ${item.decisionsMs} ms by ${item.source === "decisions" ? "the OpenAI Decisions API (gpt-6-luna)" : "the fallback model"}: one call, six questions, the chat${shots}.</p>
    <p class="policy">Guardian holds at 80% or more, asks for a second look from 35%, and otherwise stays out of the way.</p>`;
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
    paid: (p) => `Paid ₹${inr(p.amount)}`, to: (p) => `to ${p.payeeName}`,
    warnTitle: "Wait, this looks unusual", cancel: "Cancel payment",
    held: "Payment paused", waiting: "We've asked your son Rahul to confirm. You'll see his answer here.",
    blocked: "Rahul blocked this payment. Your money is safe.", report: "To report it, call 1930 or visit cybercrime.gov.in",
    approved: "Rahul approved it. Payment sent.", reset: "Start over",
  },
  hi: {
    checking: "Guardian जाँच कर रहा है…",
    paid: (p) => `₹${inr(p.amount)} का भुगतान हो गया`, to: (p) => `${p.payeeName} को`,
    warnTitle: "रुकिए, यह असामान्य लग रहा है", cancel: "भुगतान रद्द करें",
    held: "भुगतान रोका गया", waiting: "हमने आपके बेटे राहुल से पुष्टि करने को कहा है। उनका जवाब यहीं दिखेगा।",
    blocked: "राहुल ने यह भुगतान रोक दिया। आपका पैसा सुरक्षित है।", report: "शिकायत के लिए 1930 पर कॉल करें या cybercrime.gov.in पर जाएँ",
    approved: "राहुल ने मंज़ूरी दे दी। भुगतान भेज दिया गया।", reset: "फिर से शुरू करें",
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
  if (state === "warn") s.innerHTML = `<div class="ph ph-warn"><div class="ico">${ICON.warn}</div><h3>${t.warnTitle}</h3><p>${item.explanation ?? ""}</p><button class="btn-pay" onclick="window.__reset()">${t.cancel}</button></div>`;
  if (state === "hold") s.innerHTML = `<div class="ph ph-hold"><div class="ico">${ICON.hold}</div><h3>${t.held}</h3><p>${item.explanation ?? ""}</p>
      <div class="waiting" id="waiting">${t.waiting}</div></div>`;
  s.insertAdjacentHTML("afterbegin", bar);
  s.insertAdjacentHTML("beforeend", `<button class="reset" onclick="window.__reset()">${t.reset}</button>`);
}

// Live updates when the family approves/blocks (from ChatGPT or the web dashboard).
new EventSource("/api/events").onmessage = (e) => {
  const item = JSON.parse(e.data);
  if (item.reset || item.id !== currentId) return;
  if (item.status !== "blocked" && item.status !== "approved") return;
  const t = PHONE[phoneLang] ?? PHONE.en;
  if ($("waiting")) {
    $("waiting").outerHTML = item.status === "blocked"
      ? `<div class="waiting done bad">${t.blocked}<br><small>${t.report}</small></div>`
      : `<div class="waiting done ok">${t.approved}</div>`;
  }
  if ($("verdictStamp")) {
    $("verdictStamp").outerHTML = stamp(item.status);
    $("stampSub").textContent = STAMP_SUB[item.status];
  }
};

window.__reset = () => loadScenario(current);
loadScenario(SCENARIOS[0]);
