// ---------- Langkah 1: data yang perlu diingat ----------
var cards = [];            // tiap kartu: { question: "...", answer: "..." }
var current = 0;           // kartu yang sedang tampil
var showingAnswer = false; // sedang lihat jawaban atau tidak

// ---------- Langkah 2: cari elemen di halaman ----------
var notesBox = document.getElementById("notes");
var summaryText = document.getElementById("summary");
var cardBox = document.getElementById("card");
var counter = document.getElementById("counter");

// ---------- Langkah 3: memotong teks jadi kalimat ----------
function getSentences(text) {
  var sentences = text.match(/[^.!?]+[.!?]/g);
  if (sentences === null) {
    return [];
  }
  return sentences.map(function (s) {
    return s.trim();
  });
}

// ---------- Langkah 4: meringkas ----------
// Ide: kata yang sering muncul itu penting.
// Kalimat yang banyak berisi kata penting juga penting.
function summarize() {
  var sentences = getSentences(notesBox.value);
  if (sentences.length < 2) {
    summaryText.textContent = "Tempel minimal dua kalimat dulu ya.";
    return;
  }

  // hitung kemunculan tiap kata
  var counts = {};
  var words = notesBox.value.toLowerCase().match(/[a-z]{4,}/g) || [];
  words.forEach(function (word) {
    counts[word] = (counts[word] || 0) + 1;
  });

  // beri nilai tiap kalimat
  var scored = sentences.map(function (sentence, position) {
    var score = 0;
    var sentenceWords = sentence.toLowerCase().match(/[a-z]{4,}/g) || [];
    sentenceWords.forEach(function (word) {
      score = score + counts[word];
    });
    return { text: sentence, score: score, position: position };
  });

  // ambil 3 kalimat terbaik, lalu urutkan lagi sesuai posisi asli
  scored.sort(function (a, b) { return b.score - a.score; });
  var best = scored.slice(0, 3);
  best.sort(function (a, b) { return a.position - b.position; });

  summaryText.textContent = best.map(function (s) { return s.text; }).join(" ");
}

// ---------- Langkah 5: buat flashcard dari catatan ----------
// Mencari kalimat seperti "Gaya adalah dorongan atau tarikan."
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
        answer: parts[1]
      });
      added = added + 1;
    }
  });

  summaryText.textContent = added + " flashcard ditambahkan.";
  if (added > 0) {
    current = cards.length - 1;
    showingAnswer = false;
    showCard();
  }
}

// ---------- Langkah 6: tampilkan kartu ----------
function showCard() {
  if (cards.length === 0) {
    cardBox.textContent = "Belum ada kartu";
    cardBox.className = "";
    counter.textContent = "";
    return;
  }

  var card = cards[current];
  if (showingAnswer) {
    cardBox.textContent = card.answer;
    cardBox.className = "answer";
  } else {
    cardBox.textContent = card.question;
    cardBox.className = "";
  }
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

// ---------- Langkah 7: tambah kartu manual ----------
function addCard() {
  var q = document.getElementById("question");
  var a = document.getElementById("answer");
  if (q.value === "" || a.value === "") return;

  cards.push({ question: q.value, answer: a.value });
  q.value = "";
  a.value = "";
  current = cards.length - 1;
  showingAnswer = false;
  showCard();
}

// ---------- Langkah 8: sambungkan tombol ke fungsi ----------
document.getElementById("summarizeBtn").onclick = summarize;
document.getElementById("makeCardsBtn").onclick = makeCards;
document.getElementById("flipBtn").onclick = flip;
document.getElementById("nextBtn").onclick = next;
document.getElementById("prevBtn").onclick = previous;
document.getElementById("addBtn").onclick = addCard;
cardBox.onclick = flip;   // klik kartu juga bisa membalik

// contoh catatan supaya bisa langsung dicoba
notesBox.value = "Gaya adalah dorongan atau tarikan yang bisa mengubah gerak benda. Percepatan adalah perubahan kecepatan tiap satuan waktu. Massa adalah jumlah materi dalam suatu benda. Hukum Newton kedua menyatakan bahwa gaya sama dengan massa dikali percepatan.";