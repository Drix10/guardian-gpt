const SCENARIOS = [
  {
    id: "arrest", names: { them: "Caller", me: "Amma" }, label: "🚔 Digital arrest", payment: { payeeName: "RBI Verification Cell", payeeId: "rbi.verify2291@okaxis", amount: 450000, firstTime: true },
    chat: [
      ["them", "📹 WhatsApp video call · +91 98XXX XXX21 · man in police uniform, CBI logo behind him"],
      ["them", "I am Inspector Vikram Sharma, CBI Mumbai. A FedEx parcel in your Aadhaar name has 5 passports and 200g MDMA."],
      ["them", "You are under DIGITAL ARREST. Do not disconnect this call. Do not tell your son or anyone, it will compromise the investigation."],
      ["me", "Sir I have done nothing, please help me 🙏"],
      ["them", "To prove innocence transfer ₹4,50,000 to RBI verification account. Fully refunded in 2 hours after verification."],
    ],
  },
  {
    id: "trading", names: { them: "Group admin", me: "Amma" }, label: "📈 Fake trading group", payment: { payeeName: "Elite Capital VIP Desk", payeeId: "elitecap.desk@ybl", amount: 200000, firstTime: true },
    chat: [
      ["them", "Welcome to SEBI-Registered Elite VIP Stock Group 🚀 Our mentor's IPO picks gave 312% last month."],
      ["them", "Your app dashboard shows profit ₹6,84,000. To withdraw, pay 30% 'tax clearance' first."],
      ["me", "Can you deduct it from the profit?"],
      ["them", "No madam, SEBI rule. Pay within 1 hour or the account is frozen and profits lost."],
    ],
  },
  {
    id: "mum", names: { them: "New number", me: "Amma" }, label: "📱 \"Hi Mum, new number\"", payment: { payeeName: "Priya S", payeeId: "priya.help22@paytm", amount: 38000, firstTime: true },
    chat: [
      ["them", "Hi Mum, this is my new number, old phone fell in water 😭"],
      ["them", "Can you pay my hostel fees urgently? Deadline today. Send to my friend Priya's UPI, my bank app isn't working on this phone."],
      ["me", "Beta call me once?"],
      ["them", "Can't talk mic broken. Please mum quickly, will explain later ❤️"],
    ],
  },
  {
    id: "legit", names: { them: "Ravi, son", me: "Amma", safe: true }, label: "✅ Son's electricity bill", payment: { payeeName: "Ravi Kumar", payeeId: "ravi.kumar@oksbi", amount: 4500, firstTime: false },
    chat: [
      ["them", "Amma, BESCOM bill came ₹4,480. I paid last month, can you do this one? Sending you the bill photo."],
      ["me", "Ok kanna, I will send to your SBI UPI, same as always."],
      ["them", "Thanks Amma, I'll call you tonight after office 📞"],
    ],
  },
  {
    id: "agent", names: { them: "Agent", me: "You", safe: false }, label: "🤖 AI agent checkout", payment: { payeeName: "Amazon Deals Checkout", payeeId: "amaz0n-deals-checkout.shop", amount: 89999, firstTime: true, actor: "AI shopping agent (on behalf of user)" },
    chat: [
      ["me", "Agent task: buy an iPhone 17 under ₹95,000 from a trusted seller."],
      ["them", "🤖 Agent: Found 'Amazon Mega Diwali Deal' via an Instagram ad → redirected to amaz0n-deals-checkout.shop"],
      ["them", "🤖 Agent: Page says 'Only 2 left! Offer ends in 04:59'. Payment page asks for direct UPI transfer, no card/COD options."],
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
  $("chat").innerHTML = s.chat.map(([who, t]) => `<div class="msg ${who}${who === "them" && !s.names.safe ? " threat" : ""}" data-who="${s.names[who]}">${t}</div>`).join("");
  document.querySelectorAll(".scenarios button").forEach((b) => b.classList.toggle("on", b.dataset.id === s.id));
  $("result").className = "result empty";
  $("result").innerHTML = "Press Pay on the phone. Guardian reads everything on the left and decides before any money moves.";
}

$("scenarios").innerHTML = SCENARIOS.map((s) => `<button data-id="${s.id}">${s.label}</button>`).join("");
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
let language = "en";
function resetPhone() {
  $("screen").innerHTML = PHONE_FORM;
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
    firstTime: $("firstTime").checked, actor: current.payment.actor,
  };
  const context = current.chat.map(([who, t]) => `${who === "me" ? "PAYER" : "OTHER PARTY"}: ${t}`).join("\n");
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
  impersonates_authority: "Pretends to be police / bank / govt",
  pressure_or_secrecy: "Threats, urgency or secrecy",
  payee_mismatch: "Payee doesn't match the story",
};
const tone = (p) => (p >= 0.8 ? "bad" : p >= 0.35 ? "warn" : "ok");
const bar = (label, p) => `<div class="bar"><span>${label}</span><div class="track"><div class="fill ${tone(p)}" style="width:${pct(p)}"></div></div><b>${pct(p)}</b></div>`;

const STAMP = { hold: "Held", warn: "Check", allow: "Clear" };
const STAMP_SUB = { hold: "Payment paused until family approves", warn: "Payment needs a second look", allow: "Payment goes through" };

function renderResult(item) {
  const types = (item.scamTypeProbabilities ?? []).filter((t) => t.probability >= 0.02).sort((a, b) => b.probability - a.probability).slice(0, 3);
  const shots = images.length ? ` and ${images.length} screenshot${images.length > 1 ? "s" : ""}` : "";
  $("result").innerHTML = `
    <div class="verdict-row">
      <div class="big">${pct(item.probability)}<small>chance this is a scam</small></div>
      <span class="stamp land ${item.verdict}">${STAMP[item.verdict]}</span>
    </div>
    <p class="stamp-sub">${STAMP_SUB[item.verdict]}</p>
    ${item.signals.map((s) => bar(LABELS[s.name], s.probability)).join("")}
    <h3>Which scam it looks like</h3>
    ${types.map((t) => bar(t.value.replaceAll("_", " "), t.probability)).join("")}
    ${item.explanation ? `<div class="explain">${item.explanation}</div>` : ""}
    <p class="meta">Decided in ${item.decisionsMs} ms by ${item.source === "decisions" ? "the OpenAI Decisions API (gpt-6-luna)" : "the fallback model"}: one call, six questions, the chat${shots}.</p>
    <p class="policy">Guardian holds at 80% or more, asks for a second look from 35%, and otherwise stays out of the way.</p>`;
}

function showPhone(state, item) {
  const s = $("screen");
  if (state === "checking") s.innerHTML = `<div class="ph ph-check"><div class="spinner"></div><p>Guardian is checking…</p></div>`;
  if (state === "allow") s.innerHTML = `<div class="ph ph-ok"><div class="ico">✓</div><h3>Paid ₹${item.payment.amount.toLocaleString("en-IN")}</h3><p>to ${item.payment.payeeName}</p></div>`;
  if (state === "warn") s.innerHTML = `<div class="ph ph-warn"><div class="ico">!</div><h3>Wait — this looks unusual</h3><p>${item.explanation ?? ""}</p><button class="btn-pay" onclick="window.__reset()">Cancel</button></div>`;
  if (state === "hold") s.innerHTML = `<div class="ph ph-hold"><div class="ico">✋</div><h3>Payment paused</h3><p>${item.explanation ?? ""}</p>
      <div class="waiting" id="waiting">We've asked your son Rahul to confirm. You'll see his answer here.</div></div>`;
  s.insertAdjacentHTML("beforeend", `<button class="reset" onclick="window.__reset()">↺ reset</button>`);
}

// Live updates when the family approves/blocks (from ChatGPT or the web dashboard).
new EventSource("/api/events").onmessage = (e) => {
  const item = JSON.parse(e.data);
  if (item.reset) return;
  if (item.id !== currentId || !$("waiting")) return;
  if (item.status === "blocked") $("waiting").outerHTML = `<div class="waiting done bad">Rahul blocked this payment. Your money is safe.<br><small>To report it, call 1930 or visit cybercrime.gov.in</small></div>`;
  if (item.status === "approved") $("waiting").outerHTML = `<div class="waiting done ok">Rahul approved it. Payment sent.</div>`;
};

window.__reset = () => loadScenario(current);
loadScenario(SCENARIOS[0]);
