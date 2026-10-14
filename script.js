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
// localStorage = "lemari kecil" di browser. Kartu tidak hilang saat halaman di-refresh.
function save() {
  try {
    localStorage.setItem("studydesk-cards", JSON.stringify(cards));
  } catch (e) {
    // kalau gagal menyimpan, abaikan saja
  }
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
  var sentences = text.match(/[^.!?]+[.!?]/g);
  if (sentences === null) {
    return [];
  }
  return sentences.map(function (s) {
    return s.trim();
  });
}

// ---------- Langkah 5: meringkas ----------
// Ide: kata yang sering muncul itu penting.
// Kalimat yang banyak berisi kata penting juga penting.
function summarize() {
  var sentences = getSentences(notesBox.value);
  if (sentences.length < 2) {
    summaryText.textContent = "Tempel minimal dua kalimat dulu ya.";
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

  summaryText.textContent = best.map(function (s) { return s.text; }).join(" ");
}

// ---------- Langkah 6: buat flashcard dari catatan ----------
function makeCards() {
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

  summaryText.textContent = added + " flashcard ditambahkan.";
  if (added > 0) {
    current = cards.length - 1;
    showingAnswer = false;
    save();
    showCard();
  }
}

// ---------- Langkah 7: progress belajar ----------
// persen = kartu yang hafal / semua kartu x 100
function updateProgress() {
  var total = cards.length;
  var knownCount = cards.filter(function (card) {
    return card.known;
  }).length;

  var percent = 0;
  if (total > 0) {
    percent = Math.round((knownCount / total) * 100);
  }

  progressText.textContent = knownCount + " dari " + total + " kartu hafal";
  progressPercent.textContent = percent + "%";
  progressBar.style.width = percent + "%";
}

// ---------- Langkah 8: tampilkan kartu ----------
function showCard() {
  updateProgress();

  if (cards.length === 0) {
    cardBox.textContent = "Belum ada kartu";
    cardBox.className = "";
    counter.textContent = "";
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

  counter.textContent = "Kartu " + (current + 1) + " dari " + cards.length + " (klik kartu untuk membalik)";
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
  recordStudy();   // hari ini dihitung sebagai hari belajar
  next(); // langsung pindah ke kartu berikutnya
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
  if (q.value === "" || a.value === "") return;

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
  cards.splice(current, 1);   // buang 1 kartu di posisi current
  if (current >= cards.length) {
    current = 0;
  }
  showingAnswer = false;
  save();
  showCard();
}

// ---------- Langkah 11: sambungkan tombol ke fungsi ----------
document.getElementById("summarizeBtn").onclick = summarize;
document.getElementById("makeCardsBtn").onclick = makeCards;
document.getElementById("flipBtn").onclick = flip;
document.getElementById("nextBtn").onclick = next;
document.getElementById("prevBtn").onclick = previous;
document.getElementById("knownBtn").onclick = function () { mark(true); };
document.getElementById("unknownBtn").onclick = function () { mark(false); };
document.getElementById("addBtn").onclick = addCard;
document.getElementById("deleteBtn").onclick = deleteCard;
document.getElementById("resetBtn").onclick = resetProgress;
cardBox.onclick = flip;

// ---------- Langkah 12: jalankan saat halaman dibuka ----------
load();
showCard();


// =====================================================
//  FITUR BARU: LOG PROGRESS MINGGUAN
//  Seperti tabel di spreadsheet: tiap minggu ada "Dikerjakan" dan "Kendala"
// =====================================================

// ---------- Langkah 13: data log ----------
var logs = {};        // contoh: { "1": { done: "...", problem: "..." } }
var totalWeeks = 8;   // jumlah baris minggu di tabel

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

// mengubah tanda < > & supaya teks aman ditampilkan di HTML
function safeText(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---------- Langkah 14: gambar tabel ----------
function renderLog() {
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

  document.getElementById("logTable").innerHTML = html;

  var percent = Math.round((filled / totalWeeks) * 100);
  document.getElementById("logText").textContent = filled + " dari " + totalWeeks + " minggu terisi";
  document.getElementById("logPercent").textContent = percent + "%";
  document.getElementById("logBar").style.width = percent + "%";
  weekTotal.value = totalWeeks;
}

// ---------- Langkah 15: simpan, edit, hapus ----------
function saveWeek() {
  var week = parseInt(weekNo.value);
  if (isNaN(week) || week < 1) return;
  if (logDone.value.trim() === "" && logProblem.value.trim() === "") return;

  if (week > totalWeeks) {
    totalWeeks = week;   // tabel otomatis bertambah
  }
  logs[week] = { done: logDone.value.trim(), problem: logProblem.value.trim() };

  logDone.value = "";
  logProblem.value = "";
  weekNo.value = week + 1;   // langsung siap isi minggu berikutnya
  saveLog();
  renderLog();
}

function editWeek(week) {
  weekNo.value = week;
  var entry = logs[week];
  logDone.value = entry ? entry.done : "";
  logProblem.value = entry ? entry.problem : "";
  logDone.focus();
}

function deleteWeek(week) {
  delete logs[week];
  saveLog();
  renderLog();
}

// ---------- Langkah 16: salin untuk spreadsheet ----------
// Hasilnya dipisah tab, jadi bisa langsung di-paste ke Google Sheets / Excel
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
    alert("Browser belum mengizinkan salin otomatis. Coba buka lewat Live Server.");
    return;
  }
  navigator.clipboard.writeText(lines.join("\n")).then(function () {
    button.textContent = "Tersalin!";
    setTimeout(function () { button.textContent = "Salin untuk spreadsheet"; }, 1500);
  });
}

// ---------- Langkah 17: sambungkan tombol & jalankan ----------
document.getElementById("saveWeekBtn").onclick = saveWeek;
document.getElementById("copyLogBtn").onclick = copyLog;
weekTotal.onchange = function () {
  var n = parseInt(weekTotal.value);
  if (isNaN(n) || n < 1) n = 1;
  totalWeeks = n;
  saveLog();
  renderLog();
};

loadLog();
renderLog();


// =====================================================
//  FITUR BARU: MODE KUIS, HARI BELAJAR, MODE GELAP
// =====================================================

// ---------- Langkah 18: mode kuis ----------
var quizList = [];     // soal yang dipakai (kartu acak)
var quizIndex = 0;     // soal ke berapa
var quizScore = 0;     // jumlah jawaban benar

var quizStart = document.getElementById("quizStart");
var quizPlay = document.getElementById("quizPlay");
var quizEnd = document.getElementById("quizEnd");
var quizInput = document.getElementById("quizInput");
var quizFeedback = document.getElementById("quizFeedback");
var checkBtn = document.getElementById("checkBtn");
var nextQuizBtn = document.getElementById("nextQuizBtn");

// mengacak urutan (supaya soal tidak selalu sama)
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

// memecah teks jadi kata-kata kecil
function getWords(text) {
  return text.toLowerCase().match(/[a-z0-9]+/g) || [];
}

// Jawaban dianggap benar kalau minimal 60% kata kunci jawaban ada di ketikanmu.
// Kata sambung (yang, atau, dan, ...) tidak dihitung.
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
    message.textContent = "Belum ada kartu. Buat kartu dulu di bagian 2.";
    return;
  }
  message.textContent = "";
  quizList = shuffle(cards).slice(0, 10);
  quizIndex = 0;
  quizScore = 0;
  quizStart.hidden = true;
  quizEnd.hidden = true;
  quizPlay.hidden = false;
  showQuestion();
}

function showQuestion() {
  document.getElementById("quizCount").textContent = "Soal " + (quizIndex + 1) + " dari " + quizList.length;
  document.getElementById("quizScoreText").textContent = "Benar: " + quizScore;
  document.getElementById("quizBar").style.width = Math.round((quizIndex / quizList.length) * 100) + "%";
  document.getElementById("quizQuestion").textContent = quizList[quizIndex].question;

  quizInput.value = "";
  quizInput.disabled = false;
  quizFeedback.textContent = "";
  quizFeedback.className = "result";
  checkBtn.hidden = false;
  nextQuizBtn.hidden = true;
  quizInput.focus();
}

function checkAnswer() {
  var typed = quizInput.value;
  if (typed.trim() === "") return;   // belum mengetik apa-apa

  var card = quizList[quizIndex];
  if (isCorrect(typed, card.answer)) {
    quizScore = quizScore + 1;
    quizFeedback.textContent = "Benar! Jawabannya: " + card.answer;
    quizFeedback.className = "result good";
  } else {
    quizFeedback.textContent = "Kurang tepat. Jawabannya: " + card.answer;
    quizFeedback.className = "result bad";
  }

  recordStudy();   // menjawab soal dihitung sebagai belajar
  document.getElementById("quizScoreText").textContent = "Benar: " + quizScore;
  quizInput.disabled = true;
  checkBtn.hidden = true;
  nextQuizBtn.hidden = false;
  nextQuizBtn.textContent = (quizIndex === quizList.length - 1) ? "Lihat hasil" : "Soal berikutnya";
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

  quizPlay.hidden = true;
  quizEnd.hidden = false;
  document.getElementById("quizFinalScore").textContent = quizScore + " dari " + quizList.length + " (" + percent + "%)";
  document.getElementById("quizFinalText").textContent = text;
}

document.getElementById("startQuizBtn").onclick = startQuiz;
document.getElementById("againQuizBtn").onclick = startQuiz;
checkBtn.onclick = checkAnswer;
nextQuizBtn.onclick = nextQuestion;
quizInput.onkeydown = function (event) {
  if (event.key === "Enter") {
    if (!checkBtn.hidden) {
      checkAnswer();
    } else {
      nextQuestion();
    }
  }
};

// ---------- Langkah 19: hitungan hari belajar ----------
// Hari dihitung "belajar" kalau kamu menandai kartu (hafal / belum hafal)
// atau menjawab soal kuis. Tanggal disimpan seperti "2026-10-10".
var studyDays = [];

function pad(n) {
  return n < 10 ? "0" + n : "" + n;
}

// offset 0 = hari ini, 1 = kemarin, 2 = dua hari lalu, dst.
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

  // Kalau hari ini belum belajar, hitungan masih "hidup" dari kemarin.
  var start = studiedToday ? 0 : 1;
  var streak = 0;
  while (studyDays.indexOf(dayString(start + streak)) !== -1) {
    streak = streak + 1;
  }

  document.getElementById("streakNum").textContent = streak;
  document.getElementById("totalDays").textContent = studyDays.length;
  document.getElementById("todayStatus").textContent = studiedToday ? "Sudah" : "Belum";
}

// ---------- Langkah 20: mode gelap ----------
var themeBtn = document.getElementById("themeBtn");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeBtn.textContent = (theme === "dark") ? "Mode terang" : "Mode gelap";
  try {
    localStorage.setItem("studydesk-theme", theme);
  } catch (e) {}
}

themeBtn.onclick = function () {
  var isDark = document.documentElement.getAttribute("data-theme") === "dark";
  applyTheme(isDark ? "light" : "dark");
};

// ---------- Langkah 21: jalankan saat halaman dibuka ----------
var savedTheme = "light";
try {
  savedTheme = localStorage.getItem("studydesk-theme") || "light";
} catch (e) {}
applyTheme(savedTheme);

loadDays();
renderStreak();


// =====================================================
//  FITUR BARU: UNGGAH FILE MATERI
//  Mendukung: .txt .md .pdf .docx .pptx
// =====================================================

// ---------- Langkah 22: pengaturan & elemen ----------
var MAX_TEXT_SIZE = 1000000;    // file teks: maksimal 1 MB
var MAX_FILE_SIZE = 50000000;   // PDF / Word / PowerPoint: maksimal 50 MB (PPT berisi gambar biasanya besar)
var MAX_PAGES = 100;            // PDF: baca 100 halaman pertama saja
var PDF_WORKER_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

var fileInput = document.getElementById("fileInput");
var fileName = document.getElementById("fileName");

function setStatus(message) {
  fileName.textContent = message;
  // pesan masalah diberi warna merah supaya mudah terlihat
  var isProblem = /^(Gagal|Format|File terlalu|Tidak ada)/.test(message);
  fileName.className = isProblem ? "file-name error" : "file-name";
}

// JSZip dipakai untuk .docx dan .pptx. Cek dulu apakah sudah termuat.
function needJSZip() {
  if (typeof JSZip === "undefined") {
    throw new Error("library JSZip belum termuat. Pastikan terhubung ke internet lalu refresh halaman (Ctrl+Shift+R).");
  }
}

// ---------- Langkah 23: alat bantu membersihkan teks ----------
// Ringkasan & flashcard bekerja per kalimat (diakhiri titik).
// Poin-poin di slide biasanya tidak ada titiknya, jadi kita tambahkan.
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

// File Word & PowerPoint menyimpan teks dalam XML. Beberapa tanda XML
// ditulis dengan kode (misalnya &amp;), kita kembalikan ke bentuk aslinya.
function decodeXml(text) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

// ---------- Langkah 24: membaca Word (.docx) ----------
// .docx sebenarnya file ZIP. Teksnya ada di word/document.xml.
// Satu paragraf diakhiri </w:p>, jadi kita ganti jadi baris baru lalu buang semua tag.
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

// ---------- Langkah 25: membaca PowerPoint (.pptx) ----------
// .pptx juga ZIP. Tiap slide ada di ppt/slides/slideN.xml, paragrafnya diakhiri </a:p>.
function slideNumber(name) {
  return parseInt(name.match(/(\d+)\.xml$/)[1]);
}

async function readPptx(file) {
  needJSZip();
  var zip = await JSZip.loadAsync(await file.arrayBuffer());

  var slideNames = Object.keys(zip.files).filter(function (name) {
    return /^ppt\/slides\/slide\d+\.xml$/.test(name);
  });
  slideNames.sort(function (a, b) { return slideNumber(a) - slideNumber(b); });
  if (slideNames.length === 0) {
    throw new Error("tidak ada slide di file ini. Pastikan ini file .pptx asli (bukan hasil ganti nama).");
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

// ---------- Langkah 26: membaca PDF ----------
// Library pdf.js memberi potongan-potongan teks beserta posisinya.
// Potongan yang posisi vertikalnya (y) sama kita gabung jadi satu baris.
async function readPdf(file) {
  if (typeof pdfjsLib === "undefined") {
    throw new Error("library PDF belum termuat. Pastikan terhubung ke internet lalu refresh halaman.");
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

  if (pdf.numPages > MAX_PAGES) {
    setStatus("PDF punya " + pdf.numPages + " halaman, hanya " + MAX_PAGES + " halaman pertama yang dibaca.");
  }
  return addPeriods(joinWrappedLines(lines));
}

// Di PDF, satu kalimat sering terpotong ke baris berikutnya.
// Aturan sederhana: kalau baris sebelumnya belum selesai (tanpa titik)
// dan baris ini diawali huruf kecil, anggap itu lanjutan kalimat.
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

// ---------- Langkah 27: saat file dipilih ----------
fileInput.onchange = async function () {
  var file = fileInput.files[0];
  if (!file) return;

  var name = file.name.toLowerCase();
  var ext = name.slice(name.lastIndexOf(".") + 1);
  var isText = ["txt", "md", "markdown", "csv"].indexOf(ext) !== -1;
  var isOffice = ["pdf", "docx", "pptx"].indexOf(ext) !== -1;

  if (ext === "doc" || ext === "ppt") {
    setStatus("Format lama (.doc / .ppt) belum didukung. Simpan ulang sebagai .docx / .pptx.");
    fileInput.value = "";
    return;
  }
  if (!isText && !isOffice) {
    setStatus("Format belum didukung. Pakai .txt, .md, .pdf, .docx, atau .pptx.");
    fileInput.value = "";
    return;
  }
  if (file.size > (isText ? MAX_TEXT_SIZE : MAX_FILE_SIZE)) {
    setStatus("File terlalu besar (maksimal " + (isText ? "1" : "50") + " MB).");
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

    if (text.trim() === "") {
      setStatus("Tidak ada teks yang bisa dibaca di file ini (kalau PDF, mungkin hasil scan berupa gambar).");
    } else {
      notesBox.value = text;          // isi kotak catatan
      summaryText.textContent = "";   // bersihkan hasil lama
      setStatus(file.name + " berhasil dimuat. Klik Ringkas atau Buat flashcard.");
    }
  } catch (e) {
    setStatus("Gagal membaca file: " + e.message);
  }
  fileInput.value = "";   // supaya file yang sama bisa dipilih lagi nanti
};