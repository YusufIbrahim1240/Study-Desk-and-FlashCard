// ---------- Langkah 1: data yang perlu diingat ----------
var cards = [];            // tiap kartu: { question, answer, known }
var current = 0;           // kartu yang sedang tampil
var showingAnswer = false; // sedang lihat jawaban atau tidak

// ---------- Langkah 2: cari elemen di halaman ----------
var notesBox = document.getElementById("notes");
var summaryText = document.getElementById("summary");
var cardBox = document.getElementById("card");
var counter = document.getElementById("counter");
var progressBar = document.getElementById("progressBar");
var progressText = document.getElementById("progressText");
var progressPercent = document.getElementById("progressPercent");

// ---------- Langkah 3: simpan & muat kartu (localStorage) ----------
function save() {
  try {
    localStorage.setItem("studydesk-cards", JSON.stringify(cards));
  } catch (e) {}
}

function load() {
  try {
    var saved = localStorage.getItem("studydesk-cards");
    if (saved) {
      cards = JSON.parse(saved);
    }
  } catch (e) {
    cards = [];
  }
}

// ---------- Langkah 4: memotong teks jadi kalimat ----------
function getSentences(text) {
  if (!text) return [];
  var sentences = text.match(/[^.!?]+[.!?]/g);
  if (sentences === null) {
    return [];
  }
  return sentences.map(function (s) {
    return s.trim();
  });
}

// ---------- Langkah 5: meringkas ----------
function summarize() {
  if (!notesBox) return;
  var sentences = getSentences(notesBox.value);
  if (sentences.length < 2) {
    if (summaryText) summaryText.textContent = "Tempel minimal dua kalimat dulu ya.";
    return;
  }

  var counts = {};
  var words = notesBox.value.toLowerCase().match(/[a-z]{4,}/g) || [];
  words.forEach(function (word) {
    counts[word] = (counts[word] || 0) + 1;
  });

  var scored = sentences.map(function (sentence, position) {
    var score = 0;
    var sentenceWords = sentence.toLowerCase().match(/[a-z]{4,}/g) || [];
    sentenceWords.forEach(function (word) {
      score = score + counts[word];
    });
    return { text: sentence, score: score, position: position };
  });

  scored.sort(function (a, b) { return b.score - a.score; });
  var best = scored.slice(0, 3);
  best.sort(function (a, b) { return a.position - b.position; });

  if (summaryText) {
    summaryText.textContent = best.map(function (s) { return s.text; }).join(" ");
  }
}

// ---------- Langkah 6: buat flashcard dari catatan ----------
function makeCards() {
  if (!notesBox) return;
  var sentences = getSentences(notesBox.value);
  var added = 0;

  sentences.forEach(function (sentence) {
    var parts = sentence.split(" adalah ");
    var question = "Apa itu ";
    if (parts.length !== 2) {
      parts = sentence.split(" is ");
      question = "What is ";
    }
    if (parts.length === 2) {
      cards.push({
        question: question + parts[0] + "?",
        answer: parts[1],
        known: false
      });
      added = added + 1;
    }
  });

  if (summaryText) summaryText.textContent = added + " flashcard ditambahkan.";
  if (added > 0) {
    current = cards.length - 1;
    showingAnswer = false;
    save();
    showCard();
  }
}

// ---------- Langkah 7: progress belajar ----------
function updateProgress() {
  var total = cards.length;
  var knownCount = cards.filter(function (card) {
    return card.known;
  }).length;

  var percent = 0;
  if (total > 0) {
    percent = Math.round((knownCount / total) * 100);
  }

  if (progressText) progressText.textContent = knownCount + " dari " + total + " kartu hafal";
  if (progressPercent) progressPercent.textContent = percent + "%";
  if (progressBar) progressBar.style.width = percent + "%";
}

// ---------- Langkah 8: tampilkan kartu ----------
function showCard() {
  updateProgress();
  if (!cardBox) return;

  if (cards.length === 0) {
    cardBox.textContent = "Belum ada kartu";
    cardBox.className = "";
    if (counter) counter.textContent = "";
    return;
  }

  var card = cards[current];
  var classes = "";

  if (showingAnswer) {
    cardBox.textContent = card.answer;
    classes = "answer";
  } else {
    cardBox.textContent = card.question;
  }
  if (card.known) {
    classes = classes + " known";
  }
  cardBox.className = classes;

  if (counter) {
    counter.textContent = "Kartu " + (current + 1) + " dari " + cards.length + " (klik kartu untuk membalik)";
  }
}

function flip() {
  if (cards.length === 0) return;
  showingAnswer = !showingAnswer;
  showCard();
}

function next() {
  if (cards.length === 0) return;
  current = (current + 1) % cards.length;
  showingAnswer = false;
  showCard();
}

function previous() {
  if (cards.length === 0) return;
  current = (current - 1 + cards.length) % cards.length;
  showingAnswer = false;
  showCard();
}

// ---------- Langkah 9: tandai hafal / belum hafal ----------
function mark(isKnown) {
  if (cards.length === 0) return;
  cards[current].known = isKnown;
  save();
  recordStudy();
  next();
}

function resetProgress() {
  cards.forEach(function (card) {
    card.known = false;
  });
  showingAnswer = false;
  save();
  showCard();
}

// ---------- Langkah 10: tambah & hapus kartu ----------
function addCard() {
  var q = document.getElementById("question");
  var a = document.getElementById("answer");
  if (!q || !a || q.value === "" || a.value === "") return;

  cards.push({ question: q.value, answer: a.value, known: false });
  q.value = "";
  a.value = "";
  current = cards.length - 1;
  showingAnswer = false;
  save();
  showCard();
}

function deleteCard() {
  if (cards.length === 0) return;
  cards.splice(current, 1);
  if (current >= cards.length) {
    current = 0;
  }
  showingAnswer = false;
  save();
  showCard();
}

// ---------- Langkah 11: sambungkan tombol ke fungsi utama ----------
var summarizeBtn = document.getElementById("summarizeBtn");
if (summarizeBtn) summarizeBtn.onclick = summarize;

var makeCardsBtn = document.getElementById("makeCardsBtn");
if (makeCardsBtn) makeCardsBtn.onclick = makeCards;

var flipBtn = document.getElementById("flipBtn");
if (flipBtn) flipBtn.onclick = flip;

var nextBtn = document.getElementById("nextBtn");
if (nextBtn) nextBtn.onclick = next;

var prevBtn = document.getElementById("prevBtn");
if (prevBtn) prevBtn.onclick = previous;

var knownBtn = document.getElementById("knownBtn");
if (knownBtn) knownBtn.onclick = function () { mark(true); };

var unknownBtn = document.getElementById("unknownBtn");
if (unknownBtn) unknownBtn.onclick = function () { mark(false); };

var addBtn = document.getElementById("addBtn");
if (addBtn) addBtn.onclick = addCard;

var deleteBtn = document.getElementById("deleteBtn");
if (deleteBtn) deleteBtn.onclick = deleteCard;

var resetBtn = document.getElementById("resetBtn");
if (resetBtn) resetBtn.onclick = resetProgress;

if (cardBox) cardBox.onclick = flip;

load();
showCard();


// =====================================================
// FITUR: LOG PROGRESS MINGGUAN
// =====================================================
var logs = {};
var totalWeeks = 8;

var weekNo = document.getElementById("weekNo");
var weekTotal = document.getElementById("weekTotal");
var logDone = document.getElementById("logDone");
var logProblem = document.getElementById("logProblem");

function saveLog() {
  try {
    localStorage.setItem("studydesk-log", JSON.stringify({ logs: logs, total: totalWeeks }));
  } catch (e) {}
}

function loadLog() {
  try {
    var saved = localStorage.getItem("studydesk-log");
    if (saved) {
      var data = JSON.parse(saved);
      logs = data.logs || {};
      totalWeeks = data.total || 8;
    }
  } catch (e) {
    logs = {};
  }
}

function safeText(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderLog() {
  var tableElem = document.getElementById("logTable");
  if (!tableElem) return; // Pengaman agar tidak error jika tabel belum ada

  var html = "<tr><th>Minggu</th><th>Dikerjakan</th><th>Kendala</th><th></th></tr>";
  var filled = 0;

  for (var w = 1; w <= totalWeeks; w++) {
    var entry = logs[w];
    if (entry) {
      filled = filled + 1;
      html += "<tr>" +
        "<td class='wk'>" + w + "</td>" +
        "<td class='filled'>" + safeText(entry.done) + "</td>" +
        "<td class='filled'>" + safeText(entry.problem) + "</td>" +
        "<td class='filled'>" +
          "<button class='soft tiny' onclick='editWeek(" + w + ")'>Edit</button> " +
          "<button class='soft tiny' onclick='deleteWeek(" + w + ")'>Hapus</button>" +
        "</td></tr>";
    } else {
      html += "<tr>" +
        "<td class='wk'>" + w + "</td>" +
        "<td class='empty' colspan='2'>Belum diisi</td>" +
        "<td class='empty'><button class='soft tiny' onclick='editWeek(" + w + ")'>Isi</button></td>" +
        "</tr>";
    }
  }

  tableElem.innerHTML = html;

  var percent = Math.round((filled / totalWeeks) * 100);
  var logTextElem = document.getElementById("logText");
  var logPercentElem = document.getElementById("logPercent");
  var logBarElem = document.getElementById("logBar");

  if (logTextElem) logTextElem.textContent = filled + " dari " + totalWeeks + " minggu terisi";
  if (logPercentElem) logPercentElem.textContent = percent + "%";
  if (logBarElem) logBarElem.style.width = percent + "%";
  if (weekTotal) weekTotal.value = totalWeeks;
}

function saveWeek() {
  if (!weekNo || !logDone || !logProblem) return;
  var week = parseInt(weekNo.value);
  if (isNaN(week) || week < 1) return;

  // Tetap simpan meskipun salah satu kolom dikosongkan
  logs[week] = { 
    done: logDone.value.trim() || "-", 
    problem: logProblem.value.trim() || "-" 
  };

  logDone.value = "";
  logProblem.value = "";
  weekNo.value = week + 1;  // otomatis lanjut ke minggu berikutnya
  saveLog();
  renderLog();
}

window.editWeek = function(week) {
  if (!weekNo || !logDone || !logProblem) return;
  weekNo.value = week;
  var entry = logs[week];
  logDone.value = entry ? entry.done : "";
  logProblem.value = entry ? entry.problem : "";
  logDone.focus();
};

window.deleteWeek = function(week) {
  delete logs[week];
  saveLog();
  renderLog();
};

function copyLog() {
  var lines = ["Minggu\tDikerjakan\tKendala"];
  for (var w = 1; w <= totalWeeks; w++) {
    var entry = logs[w];
    var done = entry ? entry.done.replace(/\s+/g, " ") : "";
    var problem = entry ? entry.problem.replace(/\s+/g, " ") : "";
    lines.push(w + "\t" + done + "\t" + problem);
  }

  var button = document.getElementById("copyLogBtn");
  if (!navigator.clipboard) {
    alert("Browser belum mengizinkan salin otomatis.");
    return;
  }
  navigator.clipboard.writeText(lines.join("\n")).then(function () {
    if (button) {
      button.textContent = "Tersalin!";
      setTimeout(function () { button.textContent = "Salin untuk spreadsheet"; }, 1500);
    }
  });
}

var saveWeekBtn = document.getElementById("saveWeekBtn");
if (saveWeekBtn) saveWeekBtn.onclick = saveWeek;

var copyLogBtn = document.getElementById("copyLogBtn");
if (copyLogBtn) copyLogBtn.onclick = copyLog;

if (weekTotal) {
  weekTotal.onchange = function () {
    var n = parseInt(weekTotal.value);
    if (isNaN(n) || n < 1) n = 1;
    totalWeeks = n;
    saveLog();
    renderLog();
  };
}

loadLog();
renderLog();


// =====================================================
// FITUR: MODE KUIS & HARI BELAJAR
// =====================================================
var quizList = [];
var quizIndex = 0;
var quizScore = 0;

var quizStart = document.getElementById("quizStart");
var quizPlay = document.getElementById("quizPlay");
var quizEnd = document.getElementById("quizEnd");
var quizInput = document.getElementById("quizInput");
var quizFeedback = document.getElementById("quizFeedback");
var checkBtn = document.getElementById("checkBtn");
var nextQuizBtn = document.getElementById("nextQuizBtn");

function shuffle(list) {
  var copy = list.slice();
  for (var i = copy.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

function getWords(text) {
  return text.toLowerCase().match(/[a-z0-9]+/g) || [];
}

var SKIP_WORDS = ["yang", "atau", "dan", "dari", "untuk", "dengan", "pada", "adalah", "itu", "ini", "dalam", "the", "and", "for", "with", "that", "are", "was"];

function isCorrect(typed, answer) {
  var keyWords = getWords(answer).filter(function (word) {
    return word.length >= 3 && SKIP_WORDS.indexOf(word) === -1;
  });

  if (keyWords.length === 0) {
    return typed.trim().toLowerCase() === answer.trim().toLowerCase();
  }

  var typedWords = getWords(typed);
  var hits = keyWords.filter(function (word) {
    return typedWords.indexOf(word) !== -1;
  }).length;

  return hits / keyWords.length >= 0.6;
}

function startQuiz() {
  var message = document.getElementById("quizMessage");
  if (cards.length === 0) {
    if (message) message.textContent = "Belum ada kartu. Buat kartu dulu di bagian 2.";
    return;
  }
  if (message) message.textContent = "";
  quizList = shuffle(cards).slice(0, 10);
  quizIndex = 0;
  quizScore = 0;
  if (quizStart) quizStart.hidden = true;
  if (quizEnd) quizEnd.hidden = true;
  if (quizPlay) quizPlay.hidden = false;
  showQuestion();
}

function showQuestion() {
  var quizCountElem = document.getElementById("quizCount");
  var quizScoreElem = document.getElementById("quizScoreText");
  var quizBarElem = document.getElementById("quizBar");
  var quizQuesElem = document.getElementById("quizQuestion");

  if (quizCountElem) quizCountElem.textContent = "Soal " + (quizIndex + 1) + " dari " + quizList.length;
  if (quizScoreElem) quizScoreElem.textContent = "Benar: " + quizScore;
  if (quizBarElem) quizBarElem.style.width = Math.round((quizIndex / quizList.length) * 100) + "%";
  if (quizQuesElem) quizQuesElem.textContent = quizList[quizIndex].question;

  if (quizInput) {
    quizInput.value = "";
    quizInput.disabled = false;
    quizInput.focus();
  }
  if (quizFeedback) {
    quizFeedback.textContent = "";
    quizFeedback.className = "result";
  }
  if (checkBtn) checkBtn.hidden = false;
  if (nextQuizBtn) nextQuizBtn.hidden = true;
}

function checkAnswer() {
  if (!quizInput) return;
  var typed = quizInput.value;
  if (typed.trim() === "") return;

  var card = quizList[quizIndex];
  if (isCorrect(typed, card.answer)) {
    quizScore = quizScore + 1;
    if (quizFeedback) {
      quizFeedback.textContent = "Benar! Jawabannya: " + card.answer;
      quizFeedback.className = "result good";
    }
  } else {
    if (quizFeedback) {
      quizFeedback.textContent = "Kurang tepat. Jawabannya: " + card.answer;
      quizFeedback.className = "result bad";
    }
  }

  recordStudy();
  var quizScoreElem = document.getElementById("quizScoreText");
  if (quizScoreElem) quizScoreElem.textContent = "Benar: " + quizScore;
  
  quizInput.disabled = true;
  if (checkBtn) checkBtn.hidden = true;
  if (nextQuizBtn) {
    nextQuizBtn.hidden = false;
    nextQuizBtn.textContent = (quizIndex === quizList.length - 1) ? "Lihat hasil" : "Soal berikutnya";
  }
}

function nextQuestion() {
  quizIndex = quizIndex + 1;
  if (quizIndex >= quizList.length) {
    finishQuiz();
  } else {
    showQuestion();
  }
}

function finishQuiz() {
  var percent = Math.round((quizScore / quizList.length) * 100);
  var text = "Terus semangat, coba ulangi lagi ya.";
  if (percent >= 80) {
    text = "Hebat! Kamu sudah menguasai materi ini.";
  } else if (percent >= 50) {
    text = "Lumayan! Sedikit lagi.";
  }

  if (quizPlay) quizPlay.hidden = true;
  if (quizEnd) quizEnd.hidden = false;
  var finalScoreElem = document.getElementById("quizFinalScore");
  var finalTextElem = document.getElementById("quizFinalText");
  if (finalScoreElem) finalScoreElem.textContent = quizScore + " dari " + quizList.length + " (" + percent + "%)";
  if (finalTextElem) finalTextElem.textContent = text;
}

var startQuizBtn = document.getElementById("startQuizBtn");
if (startQuizBtn) startQuizBtn.onclick = startQuiz;

var againQuizBtn = document.getElementById("againQuizBtn");
if (againQuizBtn) againQuizBtn.onclick = startQuiz;

if (checkBtn) checkBtn.onclick = checkAnswer;
if (nextQuizBtn) nextQuizBtn.onclick = nextQuestion;

if (quizInput) {
  quizInput.onkeydown = function (event) {
    if (event.key === "Enter") {
      if (checkBtn && !checkBtn.hidden) {
        checkAnswer();
      } else {
        nextQuestion();
      }
    }
  };
}

// --- Hari Belajar ---
var studyDays = [];

function pad(n) {
  return n < 10 ? "0" + n : "" + n;
}

function dayString(offset) {
  var d = new Date();
  d.setDate(d.getDate() - offset);
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

function loadDays() {
  try {
    var saved = localStorage.getItem("studydesk-days");
    if (saved) {
      studyDays = JSON.parse(saved);
    }
  } catch (e) {
    studyDays = [];
  }
}

function recordStudy() {
  var today = dayString(0);
  if (studyDays.indexOf(today) === -1) {
    studyDays.push(today);
    try {
      localStorage.setItem("studydesk-days", JSON.stringify(studyDays));
    } catch (e) {}
  }
  renderStreak();
}

function renderStreak() {
  var studiedToday = studyDays.indexOf(dayString(0)) !== -1;
  var start = studiedToday ? 0 : 1;
  var streak = 0;
  while (studyDays.indexOf(dayString(start + streak)) !== -1) {
    streak = streak + 1;
  }

  var streakNum = document.getElementById("streakNum");
  var totalDays = document.getElementById("totalDays");
  var todayStatus = document.getElementById("todayStatus");

  if (streakNum) streakNum.textContent = streak;
  if (totalDays) totalDays.textContent = studyDays.length;
  if (todayStatus) todayStatus.textContent = studiedToday ? "Sudah" : "Belum";
}

loadDays();
renderStreak();


// =====================================================
// FITUR: MODE GELAP
// =====================================================
var themeBtn = document.getElementById("themeBtn");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (themeBtn) {
    themeBtn.textContent = (theme === "dark") ? "Mode terang" : "Mode gelap";
  }
  try {
    localStorage.setItem("studydesk-theme", theme);
  } catch (e) {}
}

if (themeBtn) {
  themeBtn.onclick = function () {
    var isDark = document.documentElement.getAttribute("data-theme") === "dark";
    applyTheme(isDark ? "light" : "dark");
  };
}

var savedTheme = "light";
try {
  savedTheme = localStorage.getItem("studydesk-theme") || "light";
} catch (e) {}
applyTheme(savedTheme);


// =====================================================
// FITUR: UNGGAH FILE MATERI
// =====================================================
var MAX_TEXT_SIZE = 1000000; 
var MAX_FILE_SIZE = 50000000; 
var MAX_PAGES = 100;
var PDF_WORKER_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

var fileInput = document.getElementById("fileInput");
var fileName = document.getElementById("fileName");

function setStatus(message) {
  if (!fileName) return;
  fileName.textContent = message;
  var isProblem = /^(Gagal|Format|File terlalu|Tidak ada)/.test(message);
  fileName.className = isProblem ? "file-name error" : "file-name";
}

function needJSZip() {
  if (typeof JSZip === "undefined") {
    throw new Error("Library JSZip belum termuat.");
  }
}

function addPeriods(lines) {
  return lines
    .map(function (line) { return line.trim(); })
    .filter(function (line) { return line !== ""; })
    .map(function (line) {
      if (/[.!?]$/.test(line)) return line;
      return line.replace(/[:;,]+$/, "") + ".";
    })
    .join("\n");
}

function decodeXml(text) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

async function readDocx(file) {
  needJSZip();
  var zip = await JSZip.loadAsync(await file.arrayBuffer());
  var xml = await zip.file("word/document.xml").async("string");
  xml = xml
    .replace(/<w:tab\s*\/>/g, " ")
    .replace(/<w:br[^>]*\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "");
  return addPeriods(decodeXml(xml).split("\n"));
}

function slideNumber(name) {
  var match = name.match(/(\d+)\.xml$/);
  return match ? parseInt(match[1]) : 0;
}

async function readPptx(file) {
  needJSZip();
  var zip = await JSZip.loadAsync(await file.arrayBuffer());

  var slideNames = Object.keys(zip.files).filter(function (name) {
    return /^ppt\/slides\/slide\d+\.xml$/.test(name);
  });
  slideNames.sort(function (a, b) { return slideNumber(a) - slideNumber(b); });
  if (slideNames.length === 0) {
    throw new Error("Tidak ada slide di file ini.");
  }

  var lines = [];
  for (var i = 0; i < slideNames.length; i++) {
    var xml = await zip.file(slideNames[i]).async("string");
    xml = xml
      .replace(/<a:br\s*\/>/g, "\n")
      .replace(/<\/a:p>/g, "\n")
      .replace(/<[^>]+>/g, "");
    lines = lines.concat(decodeXml(xml).split("\n"));
  }
  return addPeriods(lines);
}

async function readPdf(file) {
  if (typeof pdfjsLib === "undefined") {
    throw new Error("Library PDF belum termuat.");
  }
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;

  var pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  var pages = Math.min(pdf.numPages, MAX_PAGES);
  var lines = [];

  for (var p = 1; p <= pages; p++) {
    var page = await pdf.getPage(p);
    var content = await page.getTextContent();

    var line = "";
    var lastY = null;
    content.items.forEach(function (item) {
      var y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        lines.push(line);
        line = "";
      }
      line = line + item.str;
      lastY = y;
    });
    lines.push(line);
  }
  return addPeriods(joinWrappedLines(lines));
}

function joinWrappedLines(lines) {
  var paragraphs = [];
  lines.forEach(function (raw) {
    var line = raw.trim();
    if (line === "") return;

    var last = paragraphs.length - 1;
    var isContinuation = last >= 0 &&
      !/[.!?:;]$/.test(paragraphs[last]) &&
      /^[a-z]/.test(line);

    if (isContinuation) {
      paragraphs[last] = paragraphs[last] + " " + line;
    } else {
      paragraphs.push(line);
    }
  });
  return paragraphs;
}

if (fileInput) {
  fileInput.onchange = async function () {
    var file = fileInput.files[0];
    if (!file) return;

    var name = file.name.toLowerCase();
    var ext = name.slice(name.lastIndexOf(".") + 1);
    var isText = ["txt", "md", "markdown", "csv"].indexOf(ext) !== -1;
    var isOffice = ["pdf", "docx", "pptx"].indexOf(ext) !== -1;

    if (ext === "doc" || ext === "ppt") {
      setStatus("Format lama (.doc / .ppt) belum didukung.");
      fileInput.value = "";
      return;
    }
    if (!isText && !isOffice) {
      setStatus("Format belum didukung.");
      fileInput.value = "";
      return;
    }
    if (file.size > (isText ? MAX_TEXT_SIZE : MAX_FILE_SIZE)) {
      setStatus("File terlalu besar.");
      fileInput.value = "";
      return;
    }

    setStatus("Membaca " + file.name + "...");
    try {
      var text;
      if (isText) {
        text = await file.text();
      } else if (ext === "pdf") {
        text = await readPdf(file);
      } else if (ext === "docx") {
        text = await readDocx(file);
      } else {
        text = await readPptx(file);
      }

      if (!text || text.trim() === "") {
        setStatus("Tidak ada teks yang bisa dibaca.");
      } else {
        if (notesBox) notesBox.value = text;
        if (summaryText) summaryText.textContent = "";
        setStatus(file.name + " berhasil dimuat!");
      }
    } catch (e) {
      setStatus("Gagal membaca file: " + e.message);
    }
    fileInput.value = "";
  };
}