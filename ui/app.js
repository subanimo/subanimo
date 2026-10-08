"use strict";

const I18N = {
  tr: {
    tagline: "Altyazıdan, videonuzun üstüne koyacağınız şeffaf animasyonlar",
    "s1.title": "Altyazı dosyanızı seçin",
    "s1.hint": "Videonuzun .srt altyazı dosyası. Animasyonların zamanlaması buradan alınır.",
    "s1.drop": "Dosyayı buraya sürükleyin ya da tıklayıp seçin",
    "s1.loaded": "{name}: {cues} satır, {min} dakika",
    "s1.name": "Video adı (çıktı klasörü):",
    "s2.title": "Yapay zekaya animasyon planı hazırlatın",
    "s2.ai": "Yapay zeka:",
    "s2.other": "Diğer (Grok, DeepSeek...)",
    "s2.count": "Animasyon sayısı:",
    "s2.h1": "\"Prompt'u kopyala\" butonuna basın.",
    "s2.h2": "Yapay zekanın sitesini açın, kopyaladığınız metni yapıştırın ve altyazı dosyanızı ekleyin.",
    "s2.h3": "Gönderin. Gelen cevabın tamamını kopyalayıp 3. adıma yapıştırın.",
    "s2.copy": "Prompt'u kopyala",
    "s2.open": "Yapay zekayı aç",
    "s2.copied": "Kopyalandı ✓",
    "s3.title": "Yapay zekanın cevabını yapıştırın",
    "s3.hint": "Cevabın tamamını yapıştırabilirsiniz; içindeki JSON'u kendimiz ayıklarız ve hemen kontrol ederiz.",
    "s3.placeholder": "{ \"effects\": [ ... ] }",
    "s3.ok": "Hazır: {n} animasyon.",
    "s3.errors": "Düzeltilmesi gereken {n} sorun var. Bu listeyi kopyalayıp yapay zekaya \"bunları düzelt\" diyerek gönderebilirsiniz:",
    "s3.warnings": "Uyarılar (render yine de yapılabilir):",
    "s3.disk": "Tahmini boyut: {need}. Diskte boş: {free}.",
    "s3.diskLow": "Diskte yeterli yer yok: gereken yaklaşık {need}, boş {free}. Yer açmadan render başarısız olur.",
    "s3.copyErrors": "Sorunları kopyala",
    "s3.col.n": "#",
    "s3.col.type": "Tür",
    "s3.col.text": "Metin",
    "s3.col.time": "Zaman",
    "s3.needSrt": "Önce 1. adımda altyazı dosyasını seçin.",
    "s4.title": "Önizleyin ve üretin",
    "s4.hint": "Önizleme her animasyondan tek kare gösterir (hızlı). Üretim, her animasyonu ayrı bir şeffaf video dosyası olarak kaydeder (uzun sürebilir).",
    "s4.preview": "Önizleme",
    "s4.render": "Animasyonları üret",
    "s4.cancel": "Durdur",
    "s4.done": "Bitti! Dosyalar hazır.",
    "s4.open": "Klasörü aç",
    "s4.resolve.title": "DaVinci Resolve'a eklemek için",
    "s4.resolve.1": "Resolve'da videonuzun projesini açın.",
    "s4.resolve.2": "File → Import → Timeline… menüsünden klasördeki timeline.fcpxml dosyasını seçin.",
    "s4.resolve.3": "Animasyonlar yeni bir timeline'da doğru zamanlarda gelir. Videonuzun timeline'ı 01:00:00:00'dan başlamalı (Resolve'un varsayılanı).",
    license: "Yalnızca ticari olmayan kullanım içindir (PolyForm Noncommercial 1.0.0). Görüntüler Remotion ile üretilir; Remotion'ın kendi lisans koşulları da geçerlidir (remotion.dev/license).",
    output: "Çıktı klasörü:",
    openOutput: "Klasörü aç",
    "notice.title": "Başlamadan önce",
    "notice.body": "Subanimo yalnızca ticari olmayan kullanım içindir (PolyForm Noncommercial 1.0.0): kişisel projeler, hobi, eğitim ve hayır işleri. Müşteri işleri, ücretli hizmetler ve ticari içerik üretimi için kullanılamaz.",
    "notice.remotion": "Animasyonlar Remotion kütüphanesiyle üretilir. Remotion'ın lisans koşulları için: remotion.dev/license",
    "notice.ok": "Anladım",
    "setup.downloading": "İlk kurulum: görüntü motoru indiriliyor… %{p}. Bu yalnızca bir kez olur.",
    "setup.preparing": "Hazırlanıyor…",
    "err.server": "Uygulamaya ulaşılamıyor. Siyah pencere kapandıysa Subanimo'u yeniden başlatın.",
    "err.busy": "Başka bir iş çalışıyor.",
  },
  en: {
    tagline: "Transparent animations for your video, planned from its subtitles",
    "s1.title": "Choose your subtitle file",
    "s1.hint": "The .srt subtitles of your video. Animation timing comes from this file.",
    "s1.drop": "Drop the file here or click to choose",
    "s1.loaded": "{name}: {cues} lines, {min} minutes",
    "s1.name": "Video name (output folder):",
    "s2.title": "Let an AI plan the animations",
    "s2.ai": "AI:",
    "s2.other": "Other (Grok, DeepSeek...)",
    "s2.count": "Number of animations:",
    "s2.h1": "Press \"Copy prompt\".",
    "s2.h2": "Open the AI's website, paste the text and attach your subtitle file.",
    "s2.h3": "Send it. Copy the whole answer and paste it into step 3.",
    "s2.copy": "Copy prompt",
    "s2.open": "Open the AI",
    "s2.copied": "Copied ✓",
    "s3.title": "Paste the AI's answer",
    "s3.hint": "You can paste the whole answer; the JSON inside is picked out and checked right away.",
    "s3.placeholder": "{ \"effects\": [ ... ] }",
    "s3.ok": "Ready: {n} animations.",
    "s3.errors": "{n} problem(s) need fixing. You can copy this list and send it to the AI with \"fix these\":",
    "s3.warnings": "Warnings (rendering is still possible):",
    "s3.disk": "Estimated size: {need}. Free disk space: {free}.",
    "s3.diskLow": "Not enough disk space: about {need} needed, {free} free. Rendering will fail until you free up space.",
    "s3.copyErrors": "Copy problems",
    "s3.col.n": "#",
    "s3.col.type": "Type",
    "s3.col.text": "Text",
    "s3.col.time": "Time",
    "s3.needSrt": "Choose the subtitle file in step 1 first.",
    "s4.title": "Preview and create",
    "s4.hint": "Preview shows one frame of each animation (fast). Create saves every animation as its own transparent video file (can take a while).",
    "s4.preview": "Preview",
    "s4.render": "Create animations",
    "s4.cancel": "Stop",
    "s4.done": "Done! The files are ready.",
    "s4.open": "Open folder",
    "s4.resolve.title": "To add them in DaVinci Resolve",
    "s4.resolve.1": "Open your video's project in Resolve.",
    "s4.resolve.2": "Use File → Import → Timeline… and pick timeline.fcpxml from the folder.",
    "s4.resolve.3": "The animations arrive on a new timeline at the right times. Your video's timeline should start at 01:00:00:00 (Resolve's default).",
    license: "For non-commercial use only (PolyForm Noncommercial 1.0.0). Images are made with Remotion; Remotion's own license terms also apply (remotion.dev/license).",
    output: "Output folder:",
    openOutput: "Open folder",
    "notice.title": "Before you start",
    "notice.body": "Subanimo is for non-commercial use only (PolyForm Noncommercial 1.0.0): personal projects, hobbies, education and charity. It may not be used for client work, paid services or commercial content production.",
    "notice.remotion": "Animations are made with the Remotion library. For Remotion's license terms see remotion.dev/license",
    "notice.ok": "I understand",
    "setup.downloading": "First-time setup: downloading the video engine… {p}%. This happens only once.",
    "setup.preparing": "Preparing…",
    "err.server": "Cannot reach the app. If the black window was closed, start Subanimo again.",
    "err.busy": "Another job is running.",
  },
};

const AI_SITES = {chatgpt: "https://chatgpt.com/", gemini: "https://gemini.google.com/", claude: "https://claude.ai/new"};
const $ = (id) => document.getElementById(id);

const store = {
  get(k) {
    try { return localStorage.getItem("rn." + k); } catch { return null; }
  },
  set(k, v) {
    try { localStorage.setItem("rn." + k, v); } catch { /* private mode or full: ignore */ }
  },
};

const state = {
  lang: store.get("lang") || ((navigator.language || "").toLowerCase().startsWith("tr") ? "tr" : "en"),
  srt: store.get("srt") || "",
  srtName: store.get("srtName") || "",
  json: store.get("json") || "",
  check: null,
  job: null,
  setup: null,
};

const t = (key, vars = {}) => (I18N[state.lang][key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
const pick = (msg) => (msg && typeof msg === "object" ? msg[state.lang] ?? msg.en : String(msg ?? ""));
const mb = (bytes) => (bytes >= 1e9 ? (bytes / 1e9).toFixed(1) + " GB" : Math.round(bytes / 1e6) + " MB");
const tc = (frames) => {
  const s = Math.floor(frames / 30);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"})[c]);

async function api(path, body) {
  const res = await fetch(path, {method: "POST", headers: {"Content-Type": "application/json", "X-Subanimo": "1"}, body: JSON.stringify(body)});
  return {status: res.status, data: await res.json().catch(() => ({}))};
}

/* ---------- language ---------- */

function applyLang() {
  document.documentElement.lang = state.lang;
  for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll("[data-i18n-placeholder]")) el.placeholder = t(el.dataset.i18nPlaceholder);
  for (const b of document.querySelectorAll("[data-lang]")) b.classList.toggle("active", b.dataset.lang === state.lang);
  renderSrt();
  renderCheck();
  renderJob();
  renderSetup();
}

for (const b of document.querySelectorAll("[data-lang]")) {
  b.addEventListener("click", () => {
    state.lang = b.dataset.lang;
    store.set("lang", state.lang);
    applyLang();
  });
}

/* ---------- step 1: subtitles ---------- */

function countCues(text) {
  const times = [...text.matchAll(/(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/g)];
  const last = times[times.length - 1];
  const minutes = last ? Math.round((+last[5] * 3600 + +last[6] * 60 + +last[7]) / 60) : 0;
  return {cues: times.length, minutes};
}

function renderSrt() {
  const drop = $("drop");
  if (!state.srt) {
    $("drop-text").textContent = t("s1.drop");
    drop.classList.remove("filled");
    $("name-row").hidden = true;
    return;
  }
  const {cues, minutes} = countCues(state.srt);
  $("drop-text").textContent = t("s1.loaded", {name: state.srtName, cues, min: minutes});
  drop.classList.add("filled");
  $("name-row").hidden = false;
}

function loadSrtFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.srt = String(reader.result);
    state.srtName = file.name;
    store.set("srt", state.srt);
    store.set("srtName", file.name);
    $("name").value = file.name.replace(/\.[^.]+$/, "");
    store.set("name", $("name").value);
    renderSrt();
    scheduleCheck();
  };
  reader.readAsText(file);
}

$("srt-file").addEventListener("change", (e) => loadSrtFile(e.target.files[0]));
const drop = $("drop");
drop.addEventListener("dragover", (e) => {
  e.preventDefault();
  drop.classList.add("over");
});
drop.addEventListener("dragleave", () => drop.classList.remove("over"));
drop.addEventListener("drop", (e) => {
  e.preventDefault();
  drop.classList.remove("over");
  loadSrtFile(e.dataTransfer.files[0]);
});
$("name").addEventListener("input", () => store.set("name", $("name").value));

/* ---------- step 2: prompt ---------- */

const updateAiLink = () => {
  const site = AI_SITES[$("model").value];
  $("open-ai").hidden = !site;
  if (site) $("open-ai").href = site;
};
$("model").addEventListener("change", () => {
  store.set("model", $("model").value);
  updateAiLink();
});
$("count").addEventListener("change", () => store.set("count", $("count").value));

$("copy").addEventListener("click", async () => {
  const res = await fetch(`/api/prompt?model=${$("model").value}&count=${$("count").value}`);
  const text = await res.text();
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  $("copied").hidden = false;
  setTimeout(() => ($("copied").hidden = true), 2500);
});

/* ---------- step 3: answer ---------- */

let checkTimer;
function scheduleCheck() {
  clearTimeout(checkTimer);
  checkTimer = setTimeout(runCheck, 400);
}

async function runCheck() {
  state.json = $("json").value;
  store.set("json", state.json);
  if (!state.json.trim()) {
    state.check = null;
    return renderCheck();
  }
  if (!state.srt) {
    state.check = {needSrt: true};
    return renderCheck();
  }
  try {
    state.check = (await api("/api/check", {srt: state.srt, json: state.json})).data;
  } catch {
    state.check = {serverDown: true};
  }
  renderCheck();
}
$("json").addEventListener("input", scheduleCheck);

function renderCheck() {
  const box = $("check");
  const c = state.check;
  const ready = !!(c && c.ok);
  $("preview").disabled = !ready || state.job?.status === "running";
  $("render").disabled = !ready || state.job?.status === "running" || (c && c.diskOk === false);
  if (!c) return void (box.innerHTML = "");
  if (c.needSrt) return void (box.innerHTML = `<ul class="issues err"><li>${esc(t("s3.needSrt"))}</li></ul>`);
  if (c.serverDown) return void (box.innerHTML = `<ul class="issues err"><li>${esc(t("err.server"))}</li></ul>`);

  let html = "";
  if (c.errors?.length) {
    html += `<p>${esc(t("s3.errors", {n: c.errors.length}))}</p><ul class="issues err">${c.errors.map((e) => `<li>${esc(pick(e))}</li>`).join("")}</ul>`;
    html += `<div class="row"><button type="button" id="copy-errors">${esc(t("s3.copyErrors"))}</button></div>`;
  } else {
    html += `<p class="ok">${esc(t("s3.ok", {n: c.effects.length}))}</p>`;
    if (c.freeBytes !== undefined && c.freeBytes !== null) {
      html += c.diskOk
        ? `<p class="muted">${esc(t("s3.disk", {need: mb(c.neededBytes), free: mb(c.freeBytes)}))}</p>`
        : `<ul class="issues err"><li>${esc(t("s3.diskLow", {need: mb(c.neededBytes), free: mb(c.freeBytes)}))}</li></ul>`;
    }
  }
  if (c.warnings?.length) html += `<p>${esc(t("s3.warnings"))}</p><ul class="issues warn">${c.warnings.map((w) => `<li>${esc(pick(w))}</li>`).join("")}</ul>`;
  if (c.effects?.length) {
    html += `<div class="summary"><div class="scroll"><table><tr><th>${t("s3.col.n")}</th><th>${t("s3.col.type")}</th><th>${t("s3.col.text")}</th><th>${t("s3.col.time")}</th></tr>`;
    html += c.effects.map((e, i) => `<tr><td>${i + 1}</td><td>${esc(e.effectType)}${e.style ? ` · ${esc(e.style)}` : ""}</td><td>${esc(e.text)}</td><td>${tc(e.startFrame)}</td></tr>`).join("");
    html += `</table></div></div>`;
  }
  box.innerHTML = html;
  const copyBtn = $("copy-errors");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => navigator.clipboard.writeText(c.errors.map((e) => "- " + pick(e)).join("\n")).catch(() => undefined));
  }
}

/* ---------- step 4: preview & render ---------- */

async function startJob(kind) {
  const {status, data} = await api(kind === "preview" ? "/api/preview" : "/api/render", {srt: state.srt, json: state.json, name: $("name").value || state.srtName || "video"});
  if (status === 409) alert(t("err.busy"));
  else if (status >= 400 && data.errors) {
    state.check = {ok: false, errors: data.errors};
    renderCheck();
  }
}
$("preview").addEventListener("click", () => startJob("preview"));
$("render").addEventListener("click", () => startJob("render"));
$("cancel").addEventListener("click", () => api("/api/cancel", {}));
// The project shown in the app: the running/last job, otherwise the name typed in step 1.
const projectName = () => state.job?.name || $("name").value.trim() || "";
$("open-folder").addEventListener("click", () => api("/api/open", {name: state.job?.name}));
$("open-output").addEventListener("click", () => api("/api/open", {name: projectName()}));

// Footer shows the folder the button opens: the project's folder once it has output, otherwise the root.
let outputRoot = "";
let pathSep = "/";
function renderOutputPath() {
  const name = state.job?.name;
  $("output-root").textContent = name ? outputRoot + pathSep + name : outputRoot;
}

function renderJob() {
  renderOutputPath();
  const j = state.job;
  const running = j?.status === "running";
  $("job").hidden = !j;
  $("cancel").hidden = !running;
  $("done").hidden = !(j && j.kind === "render" && j.status === "done");
  if (!j) return;
  $("bar-fill").style.width = `${Math.round((j.progress || 0) * 100)}%`;
  $("job-step").textContent = pick(j.step) + (j.message ? " — " + pick(j.message) : "");
  $("job-step").className = j.status === "error" ? "issues err" : "";
  const grid = $("previews");
  const effects = state.check?.effects ?? [];
  grid.innerHTML = (j.previews || []).map((src, i) => `<figure><img src="${esc(src)}" alt=""><figcaption>${i + 1}. ${esc(effects[i]?.effectType ?? "")}${effects[i]?.style ? " · " + esc(effects[i].style) : ""}</figcaption></figure>`).join("");
  renderCheck();
}

function renderSetup() {
  const s = state.setup;
  const banner = $("setup");
  if (!s || s.status === "ready") return void (banner.hidden = true);
  banner.hidden = false;
  banner.className = "banner" + (s.status === "error" ? " err" : "");
  banner.textContent = s.status === "error" ? pick(s.message) : s.status === "downloading" && s.percent > 0 && s.percent < 1 ? t("setup.downloading", {p: Math.round(s.percent * 100)}) : t("setup.preparing");
}

/* ---------- live updates ---------- */

function connect() {
  const es = new EventSource("/api/events");
  es.onmessage = (ev) => {
    const {setup, job} = JSON.parse(ev.data);
    state.setup = setup;
    state.job = job ?? null;
    renderSetup();
    renderJob();
  };
  es.onerror = () => {
    es.close();
    $("setup").hidden = false;
    $("setup").className = "banner err";
    $("setup").textContent = t("err.server");
    setTimeout(connect, 3000);
  };
}

/* ---------- start ---------- */

(async function init() {
  $("model").value = store.get("model") || "chatgpt";
  $("count").value = store.get("count") || "30";
  $("json").value = state.json;
  $("name").value = store.get("name") || "";
  updateAiLink();
  applyLang();
  try {
    const info = await (await fetch("/api/info")).json();
    outputRoot = info.outputRoot;
    pathSep = info.sep || "/";
    renderOutputPath();
  } catch {
    /* shown by the event stream */
  }
  if (!store.get("noticeSeen")) {
    $("notice").showModal();
    $("notice").addEventListener("close", () => store.set("noticeSeen", "1"));
  }
  connect();
  if (state.json) runCheck();
})();
