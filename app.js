/* Quiz Flashcards – static site (works on GitHub Pages) */
const els = {
  deckMeta: document.getElementById("deckMeta"),
  qIndex: document.getElementById("qIndex"),
  qTotal: document.getElementById("qTotal"),
  correctCount: document.getElementById("correctCount"),
  attemptedCount: document.getElementById("attemptedCount"),
  progressBar: document.getElementById("progressBar"),
  questionText: document.getElementById("questionText"),
  options: document.getElementById("options"),
  submitBtn: document.getElementById("submitBtn"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  sectionPill: document.getElementById("sectionPill"),
  multiPill: document.getElementById("multiPill"),
  helperText: document.getElementById("helperText"),
  flashcard: document.getElementById("flashcard"),
  backBtn: document.getElementById("backBtn"),
  nextFromBackBtn: document.getElementById("nextFromBackBtn"),
  resultBadge: document.getElementById("resultBadge"),
  resultMeta: document.getElementById("resultMeta"),
  correctAnswer: document.getElementById("correctAnswer"),
  yourAnswer: document.getElementById("yourAnswer"),
  explanation: document.getElementById("explanation"),
  topicSelect: document.getElementById("topicSelect"),
  shuffleBtn: document.getElementById("shuffleBtn"),
  restartBtn: document.getElementById("restartBtn"),
  randomBtn: document.getElementById("randomBtn"),
  resetProgressBtn: document.getElementById("resetProgressBtn"),
  githubHint: document.getElementById("githubHint"),
};

const STORAGE_KEY = "quiz_flashcards_v1";
const PROGRESS_KEY = "quiz_flashcards_progress_v1";

let deck = null;
let allQuestions = null; // full deck questions
let currentTopic = 'ALL';

let order = [];
let i = 0;

let currentSelections = new Set();
let lastSubmitted = null; // { selectedIds: [], isCorrect: bool, correctIds: [] }

function uniqId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function normalizeIds(ids) {
  return [...ids].map(String).sort();
}

function setsEqual(a, b) {
  const aa = normalizeIds(a);
  const bb = normalizeIds(b);
  if (aa.length !== bb.length) return false;
  for (let k = 0; k < aa.length; k++) if (aa[k] !== bb[k]) return false;
  return true;
}

function optionLabelMap(q) {
  const map = new Map();
  for (const opt of q.options) map.set(opt.id, opt.text);
  return map;
}

function readProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { attempted: {}, correct: {} };
    const parsed = JSON.parse(raw);
    return {
      attempted: parsed.attempted || {},
      correct: parsed.correct || {},
    };
  } catch {
    return { attempted: {}, correct: {} };
  }
}

function writeProgress(p) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

function computeStats() {
  const p = readProgress();

  // Stats should reflect the currently selected topic (order array).
  const visibleIds = new Set();
  for (const qi of order) {
    const q = allQuestions ? allQuestions[qi] : (deck?.questions?.[qi]);
    const qid = String(q?.id ?? qi);
    visibleIds.add(qid);
  }

  let attemptedCount = 0;
  let correctCount = 0;
  for (const qid of visibleIds) {
    if (p.attempted[qid]) attemptedCount++;
    if (p.correct[qid]) correctCount++;
  }

  els.attemptedCount.textContent = String(attemptedCount);
  els.correctCount.textContent = String(correctCount);

  const total = order.length || 0;
  const pct = total ? Math.round((attemptedCount / total) * 100) : 0;
  els.progressBar.style.width = `${pct}%`;
}

function setFlipped(isFlipped) {
  els.flashcard.classList.toggle("is-flipped", !!isFlipped);
}

function resetCardState() {
  currentSelections = new Set();
  lastSubmitted = null;
  setFlipped(false);
  els.submitBtn.disabled = true;
  els.helperText.textContent = "";
}

function getCurrentQuestion() {
  return allQuestions[order[i]];
}

function render() {
  if (!deck) return;

  const q = getCurrentQuestion();
  const total = order.length;

  els.qIndex.textContent = String(i + 1);
  els.qTotal.textContent = String(total);

  els.sectionPill.textContent = (q.section && q.section.trim()) ? q.section : "—";
  els.multiPill.textContent = q.multi ? "Select 2+ (multi)" : "Single choice";
  els.questionText.textContent = q.question;

  els.options.innerHTML = "";
  const inputType = q.multi ? "checkbox" : "radio";
  const groupName = `q_${q.id || order[i] || uniqId()}`;

  const map = optionLabelMap(q);

  q.options.forEach((opt, idx) => {
    const optEl = document.createElement("label");
    optEl.className = "opt";
    optEl.setAttribute("data-opt-id", opt.id);

    const input = document.createElement("input");
    input.type = inputType;
    input.name = groupName;
    input.value = opt.id;
    input.checked = currentSelections.has(opt.id);

    input.addEventListener("change", () => {
      if (!q.multi) currentSelections = new Set();
      if (input.checked) currentSelections.add(opt.id);
      else currentSelections.delete(opt.id);

      els.submitBtn.disabled = currentSelections.size === 0;
      if (q.multi) {
        els.helperText.textContent = currentSelections.size < 2
          ? "This one is multi-select (you likely need 2 or more choices)."
          : "";
      } else {
        els.helperText.textContent = "";
      }
    });

    const idBox = document.createElement("div");
    idBox.className = "opt-id";
    idBox.textContent = String(idx + 1);

    const main = document.createElement("div");
    main.className = "opt-main";

    const text = document.createElement("div");
    text.className = "opt-text";
    text.textContent = opt.text;

    main.appendChild(text);

    optEl.appendChild(input);
    optEl.appendChild(idBox);
    optEl.appendChild(main);

    // Clicking the option row should toggle the input naturally via label.
    els.options.appendChild(optEl);
  });

  // Back-side placeholders
  els.resultBadge.textContent = "—";
  els.resultBadge.classList.remove("good", "bad");
  els.resultMeta.textContent = "";
  els.correctAnswer.textContent = "—";
  els.yourAnswer.textContent = "—";
  els.explanation.textContent = "—";

  // Buttons
  els.prevBtn.disabled = i === 0;
  els.nextBtn.disabled = i === total - 1;
  els.nextFromBackBtn.disabled = i === total - 1;

  computeStats();
}

function setIndex(nextIndex) {
  if (!deck) return;
  const total = order.length;
  i = Math.max(0, Math.min(total - 1, nextIndex));
  resetCardState();
  render();
}

function next() {
  setIndex(i + 1);
}

function prev() {
  setIndex(i - 1);
}

function random() {
  if (!deck) return;
  const total = order.length;
  const r = Math.floor(Math.random() * total);
  setIndex(r);
}

function shuffleOrder() {
  if (!deck) return;
  // Fisher–Yates
  for (let k = order.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [order[k], order[j]] = [order[j], order[k]];
  }
  setIndex(0);
}

function resetProgress() {
  localStorage.removeItem(PROGRESS_KEY);
  computeStats();
  els.helperText.textContent = "Progress reset.";
  setTimeout(() => (els.helperText.textContent = ""), 1200);
}

function submit() {
  const q = getCurrentQuestion();
  const selectedIds = normalizeIds(currentSelections);
  const correctIds = normalizeIds(q.correct || []);
  const isCorrect = setsEqual(selectedIds, correctIds);

  lastSubmitted = { selectedIds, correctIds, isCorrect };

  // Save progress
  const p = readProgress();
  const qid = String(q.id ?? order[i]);
  p.attempted[qid] = true;
  if (isCorrect) p.correct[qid] = true;
  else delete p.correct[qid];
  writeProgress(p);

  // Fill back side
  const map = optionLabelMap(q);
  const toText = (ids) => {
    if (!ids.length) return "—";
    return ids.map(id => `${id}: ${map.get(id) ?? "(missing option text)"}`).join(" • ");
  };

  els.correctAnswer.textContent = toText(correctIds);
  els.yourAnswer.textContent = toText(selectedIds);
  els.explanation.textContent = q.explanation || "—";

  els.resultBadge.textContent = isCorrect ? "Correct ✅" : "Not quite ❌";
  els.resultBadge.classList.toggle("good", isCorrect);
  els.resultBadge.classList.toggle("bad", !isCorrect);

  const attemptMsg = q.multi
    ? `Selected ${selectedIds.length} option(s).`
    : `Selected 1 option.`;
  els.resultMeta.textContent = attemptMsg;

  computeStats();
  setFlipped(true);
}

function backToQuestion() {
  setFlipped(false);
}


function getSectionValue(q) {
  // Be tolerant: different converters may call this field different things.
  return (
    q?.section ??
    q?.topic ??
    q?.category ??
    q?.group ??
    q?.sectionTitle ??
    q?.section_name ??
    q?.topic_name ??
    ""
  );
}

function prettyTopicName(section) {
  const s = String(section || "").trim();
  if (!s) return "Unsorted";
  // Normalize different dash types in your source
  return s.replace(/\s+—\s+/g, " - ").replace(/\s+–\s+/g, " - ");
}

function computeTopics(questions) {
  const counts = new Map();
  for (const q of questions) {
    const key = prettyTopicName(getSectionValue(q));
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  // Sort topics alphabetically but keep "ALL" at top in the UI
  return Array.from(counts.entries()).sort((a,b) => a[0].localeCompare(b[0]));
}

function buildTopicOptions() {
  const topics = computeTopics(allQuestions);
  els.topicSelect.innerHTML = "";
  const optAll = document.createElement("option");
  optAll.value = "ALL";
  optAll.textContent = `All topics (${allQuestions.length})`;
  els.topicSelect.appendChild(optAll);

  const optAllRand = document.createElement("option");
  optAllRand.value = "ALL_RANDOM";
  optAllRand.textContent = `All topics (randomized)`;
  els.topicSelect.appendChild(optAllRand);

  for (const [name, count] of topics) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = `${name} (${count})`;
    els.topicSelect.appendChild(opt);
  }
}

function applyTopic(topicValue) {
  currentTopic = topicValue || "ALL";
  localStorage.setItem("quiz_flashcards_topic_v1", currentTopic);

  // Build order as a list of indices into allQuestions
  order = [];
  for (let idx = 0; idx < allQuestions.length; idx++) {
    const sec = prettyTopicName(getSectionValue(allQuestions[idx]));
    if (currentTopic === "ALL" || currentTopic === "ALL_RANDOM" || sec === currentTopic) order.push(idx);
  }

  // If doing the combined exam mode, randomize immediately
  if (currentTopic === "ALL_RANDOM") {
    shuffleOrder();
  }

  // Reset position and render
  i = 0;
  resetCardState();
  render();

  // Update meta line
  const topicLabel = (currentTopic === "ALL" ? "All topics" : (currentTopic === "ALL_RANDOM" ? "All topics (randomized)" : currentTopic));
  els.deckMeta.textContent = `${deck.title || "Study Deck"} • ${topicLabel} • ${order.length} questions`;
}

function initHostingLink() {
  // Helpful link: GitHub Pages docs (no hard URL in markup per policy; keep in JS ok)
  // Users can still click.
  els.githubHint.href = "https://pages.github.com/";
  els.githubHint.textContent = "GitHub Pages guide";
}

function wireEvents() {
  els.submitBtn.addEventListener("click", submit);
  els.prevBtn.addEventListener("click", prev);
  els.nextBtn.addEventListener("click", next);
  els.backBtn.addEventListener("click", backToQuestion);
  els.nextFromBackBtn.addEventListener("click", () => { backToQuestion(); next(); });

  els.shuffleBtn.addEventListener("click", shuffleOrder);
  els.restartBtn.addEventListener("click", () => {
    // Restart current quiz without wiping progress: go back to Q1 and optionally reshuffle.
    if (currentTopic === "ALL_RANDOM") {
      shuffleOrder();
    }
    i = 0;
    resetCardState();
    render();
  });
  els.randomBtn.addEventListener("click", random);
  els.resetProgressBtn.addEventListener("click", resetProgress);

  els.topicSelect.addEventListener("change", () => {
    applyTopic(els.topicSelect.value);
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Ignore if user is selecting text or focused on something else
    if (e.altKey || e.ctrlKey || e.metaKey) return;

    const key = e.key.toLowerCase();

    if (key === "arrowright") { e.preventDefault(); if (!els.flashcard.classList.contains("is-flipped")) next(); }
    if (key === "arrowleft") { e.preventDefault(); if (!els.flashcard.classList.contains("is-flipped")) prev(); }

    if (key === "enter") {
      if (!els.flashcard.classList.contains("is-flipped") && !els.submitBtn.disabled) {
        e.preventDefault();
        submit();
      }
    }
    if (key === "escape") {
      if (els.flashcard.classList.contains("is-flipped")) {
        e.preventDefault();
        backToQuestion();
      }
    }

    // Number keys: toggle option selection (1..9)
    if (!els.flashcard.classList.contains("is-flipped") && /^[1-9]$/.test(key)) {
      const idx = Number(key) - 1;
      const optLabels = Array.from(els.options.querySelectorAll(".opt"));
      const optLabel = optLabels[idx];
      if (!optLabel) return;

      const input = optLabel.querySelector("input");
      if (!input) return;

      // Toggle
      if (input.type === "radio") {
        input.checked = true;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        input.checked = !input.checked;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  });
}

async function loadDeck() {
  // Prefer questions.json in the root folder.
  // Cache-bust in dev; GitHub pages caches aggressively sometimes.
  const url = `questions.json?cb=${Date.now()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load questions.json (${res.status})`);
  const data = await res.json();

  if (!data || !Array.isArray(data.questions)) {
    throw new Error("questions.json is missing a top-level 'questions' array.");
  }

  // Validate minimal schema
  data.questions = data.questions.map((q, idx) => {
    const id = q.id ?? `q${idx + 1}`;
    const options = Array.isArray(q.options) ? q.options : [];
    const correct = Array.isArray(q.correct) ? q.correct : [];
    return {
      id,
      question: String(q.question ?? ""),
      multi: !!q.multi || correct.length > 1,
      options: options.map((o, j) => ({
        id: String(o.id ?? String.fromCharCode(65 + j)),
        text: String(o.text ?? ""),
      })),
      correct: correct.map(String),
      explanation: String(q.explanation ?? ""),
    };
  });

  return data;
}

async function init() {
  initHostingLink();
  wireEvents();

  try {
    deck = await loadDeck();
    allQuestions = deck.questions;
    // Default order includes all questions; topic selection will rebuild order.
    order = allQuestions.map((_, idx) => idx);
    i = 0;

    buildTopicOptions();
    const savedTopic = localStorage.getItem("quiz_flashcards_topic_v1") || "ALL";
    els.topicSelect.value = savedTopic;
    applyTopic(savedTopic);

    render();
  } catch (err) {
    console.error(err);
    els.deckMeta.textContent = "Could not load questions.json";
    els.questionText.textContent = "Error: " + (err?.message || String(err));
    els.options.innerHTML = "";
    els.helperText.textContent = "Make sure questions.json exists in the same folder as index.html.";
  }
}

init();
