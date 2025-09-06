
let idols = [];
let currentGenre = "";
let currentDifficulty = "EASY";
let currentMode = "10";
let currentIdol = null;
let recentQuestions = [];
let questionCount = 0;
let correctCount = 0;
let maxQuestions = Infinity;
let gameOver = false;  // M@STERモードのゲームオーバーフラグ

// CSV読み込み
fetch("idols.csv")
  .then(res => res.text())
  .then(text => parseCSV(text));

function parseCSV(text) {
  const lines = text.trim().split("\n");
  
  let rawIdols = lines.slice(1).map(line => {
    const cols = line.split(",");
    return {
      nameKanji: cols[0]?.trim(),
      nameKana: cols[1]?.trim(),
      color: cols[2]?.trim(),
      genre: cols[3]?.trim()
    };
  }).filter(i => i.nameKanji && i.color); // ← nameKanji と color があるものだけ残す
  
  // 特例: 双海亜美・真美を統合
  const futami = rawIdols.filter(i => i.nameKanji === "双海亜美" || i.nameKanji === "双海真美");
  if (futami.length === 2) {
    const merged = {
      nameKanji: "双海亜美,双海真美",
      nameKana: "ふたみあみ,ふたみまみ",
      color: futami[0].color,
      genre: futami[0].genre
    };
    rawIdols = rawIdols.filter(i => !(i.nameKanji === "双海亜美" || i.nameKanji === "双海真美"));
    rawIdols.push(merged);
  }

  idols = rawIdols;
  
  console.log("CSVロード完了:", idols);
}

// 設定開始
document.getElementById("startButton").addEventListener("click", () => {
  currentGenre = document.getElementById("genreSelect").value;
  currentDifficulty = document.getElementById("difficultySelect").value;
  currentMode = document.getElementById("modeSelect").value;

  correctCount = 0;
  questionCount = 0;
  recentQuestions = [];
  maxQuestions = currentMode === "10" ? 10 : Infinity;

  document.getElementById("settingsModal").style.display = "none";
  document.getElementById("gameUI").style.display = "block";

  pickRandomIdol();
});

// 設定に戻る
document.getElementById("backButton").addEventListener("click", () => {
  document.getElementById("confirmModal").classList.remove("hidden");
});

document.getElementById("confirmYes").addEventListener("click", () => {
  document.getElementById("confirmModal").classList.add("hidden");
  document.getElementById("settingsModal").classList.remove("hidden");
  
  questionCount = 0;
  maxQuestions = Infinity;
  
  openSettings();
});

document.getElementById("confirmNo").addEventListener("click", () => {
  document.getElementById("confirmModal").classList.add("hidden");
});

document.getElementById("backSettings").addEventListener("click", () => {
  document.getElementById("endModal").classList.add("hidden");
  document.getElementById("settingsModal").classList.remove("hidden");
  
  questionCount = 0;
  maxQuestions = Infinity;
  
  openSettings();
});

document.getElementById("oneMoreChallenge").addEventListener("click", () => {
  
  document.getElementById("endModal").classList.add("hidden");
  
  currentGenre = document.getElementById("genreSelect").value;
  currentDifficulty = document.getElementById("difficultySelect").value;
  currentMode = document.getElementById("modeSelect").value;
  
  correctCount = 0;
  questionCount = 0;
  recentQuestions = [];
  maxQuestions = currentMode === "10" ? 10 : Infinity;
  gameOver = false;

  document.getElementById("nextButton").textContent = "次の問題";
  document.getElementById("settingsModal").style.display = "none";
  document.getElementById("gameUI").style.display = "block";

  pickRandomIdol();
});

const difficultyDescriptions = {
  EASY: "４択問題です。選択したブランドからランダムで候補が選ばれます。",
  NORMAL: "４択問題です。選択したブランドから似た色のアイドルが候補になります。",
  HARD: "記述問題です。アイドルの名前を直接入力してください。"
};

document.getElementById("difficultySelect").addEventListener("change", (e) => {
  const desc = difficultyDescriptions[e.target.value];
  document.getElementById("difficultyDescription").textContent = desc;
});

function openSettings() {
  document.getElementById("gameUI").style.display = "none";
  document.getElementById("settingsModal").style.display = "flex";
}

const policyModal = document.getElementById("policyModal");
const policyButton = document.getElementById("policyButton");
const closePolicy = document.getElementById("closePolicy");

policyButton.addEventListener("click", () => {
  policyModal.style.display = "flex";
});

closePolicy.addEventListener("click", () => {
  policyModal.style.display = "none";
});

// 問題選択
function pickRandomIdol() {
  
  if (currentMode === "master" && gameOver) return; 
  
  let candidates = (currentGenre === "All") ? idols : idols.filter(i => i.genre === currentGenre);
  if (candidates.length === 0) {
    alert("このジャンルにはアイドルがいません！");
    return;
  }
  candidates = candidates.filter(i => !recentQuestions.includes(i.nameKanji));
  if (candidates.length === 0) {
    recentQuestions = [];
    candidates = (currentGenre === "All") ? idols : idols.filter(i => i.genre === currentGenre);
  }
  currentIdol = candidates[Math.floor(Math.random() * candidates.length)];
  recentQuestions.push(currentIdol.nameKanji);
  if (recentQuestions.length > 10) recentQuestions.shift();

  questionCount++;
  document.getElementById("questionCounter").textContent =
    (currentMode === "10") ? `第${questionCount}問 / ${maxQuestions}問` : `第${questionCount}問`;

  document.getElementById("colorBox").style.background = "#" + currentIdol.color;
  document.getElementById("result").textContent = "";
  document.getElementById("similarIdols").innerHTML = "";
  document.getElementById("nextButton").style.display = "none";

  renderAnswerArea();
}

// 難易度別の回答UI
function renderAnswerArea() {
  const area = document.getElementById("answerArea");
  area.innerHTML = "";

  if (currentDifficulty === "HARD") {
    area.style.display = "flex";
    area.style.justifyContent = "center";
    area.style.alignItems = "center";

    // 既存のフォームを再利用
    const input = document.createElement("input");
    input.type = "text";
    input.id = "answerInput";
    input.placeholder = "アイドル名を入力";
    input.className = "hard-input"; // ← CSSでデザイン統一
    area.appendChild(input);

    const btn = document.createElement("button");
    btn.textContent = "答える";
    btn.id = "submitAnswerBtn";
    btn.className = "answer-button"; // ← CSSでデザイン統一
    btn.onclick = checkAnswer;
    area.appendChild(btn);

  } else {
    area.style.display = "grid";
    const choices = generateChoices();
    choices.forEach(c => {
      if (!c || !c.nameKanji) return; // ← 念のため防御
      const btn = document.createElement("button");
      btn.textContent = displayName(c);
      btn.className = "choice-button";
      btn.onclick = () => checkChoice(c);
      area.appendChild(btn);
    });
  }
}

// EASY/NORMAL用の選択肢生成
function generateChoices() {
  let pool = (currentGenre === "All")
    ? idols.filter(i => i.nameKanji && i.nameKanji !== currentIdol.nameKanji)
    : idols.filter(i => i.genre === currentGenre && i.nameKanji !== currentIdol.nameKanji);
  let choices = [currentIdol];
  
  //console.log(currentGenre);


  if (currentDifficulty === "EASY") {
    while (choices.length < 4 && pool.length > 0) {
      const rand = Math.floor(Math.random() * pool.length);
      choices.push(pool.splice(rand, 1)[0]);
    }
  } else if (currentDifficulty === "NORMAL") {
    pool.sort((a,b) => colorDistance(currentIdol.color, a.color) - colorDistance(currentIdol.color, b.color));
    choices = choices.concat(pool.slice(1,4));
  }
  
  currentChoices = choices;
  
  console.log(currentChoices);
  return shuffleArray(choices.filter(c => c && c.nameKanji)); // ← null除去
}

function showMessage(text, type) {
  const area = document.getElementById("result");
  area.innerHTML = `<div class="message-box message-${type}">${text}</div>`;
}

// HARDモード用回答チェック
function checkAnswer() {
  const inputEl = document.getElementById("answerInput");
  if (!inputEl) return;
  const answer = inputEl.value.trim();
  inputEl.disabled = true;

  const area = document.getElementById("result");

  // 1. 未入力チェック
  if (answer === "") {
    showMessage("名前を入力してください！", "warning");
    inputEl.disabled = false; // 再入力できるようにする
    return;
  }

  // 2. 入力された名前に一致するアイドルを検索
	const matchedIdol = idols.find(i => {
	  const kanjiList = i.nameKanji.split(",");
	  const kanaList  = i.nameKana.split(",");
	  return kanjiList.includes(answer) || kanaList.includes(answer);
	});

  console.log(matchedIdol);

  if (!matchedIdol) {
    showMessage("その名前のアイドルはいません！", "error");
    inputEl.disabled = false;
    return;
  }

  // 3. ブランドチェック（全て以外）
  if (currentGenre !== "All" && matchedIdol.genre !== currentGenre) {
  	showMessage("別ブランドのアイドルです！", "warning");
    inputEl.disabled = false;
    return;
  }

  if (isCorrectAnswer(answer, currentIdol)) {
    area.textContent = `正解！ ${displayName(currentIdol)} (#${currentIdol.color})`;
    correctCount++;
  } else {
    area.textContent = `不正解！ 正解は ${displayName(currentIdol)} (#${currentIdol.color})`;
    showSimilarIdols();
    if (currentMode === "master") {
    	gameOver = true;
	}
  }
  
  if(currentMode === "master" || questionCount >= maxQuestions){
  	document.getElementById("nextButton").textContent = "結果発表";
  }
  document.getElementById("nextButton").style.display = "block";
}

// EASY/NORMAL用回答チェック
function checkChoice(choice) {
  const area = document.getElementById("result");
  
  const correctNames = currentIdol.nameKanji.split(",");
  if (correctNames.includes(choice.nameKanji) || choice.nameKanji === currentIdol.nameKanji) {
    area.textContent = `正解！ ${displayName(currentIdol)} (#${currentIdol.color})`;
    correctCount++;
  } else {
    area.textContent = `不正解！ 正解は ${displayName(currentIdol)} (#${currentIdol.color})`;
    showChoicesIdols();
    if (currentMode === "master") {
    	gameOver = true;
	}
  }
  
  if(currentMode === "master" || questionCount >= maxQuestions){
  	document.getElementById("nextButton").textContent = "結果発表";
  }
  
  document.getElementById("nextButton").style.display = "block";
  document.getElementById("answerArea").innerHTML = "";
}

// 次の問題へ
document.getElementById("nextButton").addEventListener("click", () => {
  if (currentMode === "10" && questionCount >= maxQuestions) {
    finishChallenge();
    //document.getElementById("gameUI").style.display = "none";
    //document.getElementById("settingsModal").style.display = "flex";
    return;
  }
  
  if (currentMode === "master" && gameOver){
  	finishChallenge();
  	return;
  }
  
  pickRandomIdol();
});

// 近い色を表示
function showSimilarIdols() {
  //if (!filteredIdols || filteredIdols.length < 20) return;
  let pool = (currentGenre === "All")
    ? idols.filter(i => i.nameKanji && i.nameKanji !== currentIdol.nameKanji)
    : idols.filter(i => i.genre === currentGenre && i.nameKanji !== currentIdol.nameKanji);

  // 20人以下なら表示しない
  if ((currentGenre === "All" ? idols.length : idols.filter(i => i.genre === currentGenre).length) <= 20) {
    document.getElementById("similarIdols").innerHTML = "";
    return;
  }

  pool.sort((a,b) => colorDistance(currentIdol.color,a.color)-colorDistance(currentIdol.color,b.color));
  const similar = pool.slice(1,6);

  const container = document.getElementById("similarIdols");
  container.innerHTML = "";
  similar.forEach(idol => {
    if (!idol || !idol.nameKanji) return;
    const card = document.createElement("div");
    card.className = "idolCard";
    card.innerHTML = `
      <div class="idolColor" style="background:#${idol.color};"></div>
      <div class="idolInfo">
        <div>${idol.nameKanji}</div>
        <div>#${idol.color}</div>
      </div>
    `;
    container.appendChild(card);
  });
}

function showChoicesIdols() {
  //if (!filteredIdols || filteredIdols.length < 20) return;
  let pool = (currentGenre === "All")
    ? idols.filter(i => i.nameKanji && i.nameKanji !== currentIdol.nameKanji)
    : idols.filter(i => i.genre === currentGenre && i.nameKanji !== currentIdol.nameKanji);

  // 20人以下なら表示しない
  if ((currentGenre === "All" ? idols.length : idols.filter(i => i.genre === currentGenre).length) <= 20) {
    document.getElementById("similarIdols").innerHTML = "";
    return;
  }
  
  const choices = currentChoices;

  const container = document.getElementById("similarIdols");
  container.innerHTML = "";
  choices.filter(i => i.nameKanji !== currentIdol.nameKanji) // 正解以外
  	.forEach(idol => {
    if (!idol || !idol.nameKanji) return;
    const card = document.createElement("div");
    card.className = "idolCard";
    card.innerHTML = `
      <div class="idolColor" style="background:#${idol.color};"></div>
      <div class="idolInfo">
        <div>${idol.nameKanji}</div>
        <div>#${idol.color}</div>
      </div>
    `;
    container.appendChild(card);
  });
}

function isCorrectAnswer(input, idol) {
  const kanjiList = idol.nameKanji.split(",");
  const kanaList  = idol.nameKana.split(",");
  return [...kanjiList, ...kanaList].includes(input);
}

function displayName(idol) {
  if (idol.nameKanji.includes(",")) {
    return idol.nameKanji.replace(",", "・");
  }
  return idol.nameKanji;
}


function finishChallenge() {
  const score = correctCount; // 正解数
  const total = 10;
  
  if (currentMode === "master" && gameOver) {
    document.getElementById("endScore").textContent = `連続正解数: ${score}問`;
  } else if(currentMode === "10" && score >= 8) {
  	document.getElementById("endScore").textContent = `あなたのスコア: ${score} / ${total} お見事！`;
  } else {
  	document.getElementById("endScore").textContent = `あなたのスコア: ${score} / ${total}`;
  }
  // 設定情報
  const genre = currentGenre === "all" ? "全て" : currentGenre;
  const difficulty = currentDifficulty;

  document.getElementById("endSettings").textContent =
    `ジャンル: ${genre} ／ 難易度: ${difficulty}`;
    
  document.getElementById("endModal").classList.remove("hidden");
}

function closeEndModal() {
  document.getElementById("endModal").style.display = "none";
  startGame(); // ← もう一度挑戦ボタンで再スタート
}

// ユーティリティ
function shuffleArray(arr) {
  return arr.sort(() => Math.random() - 0.5);
}
function colorDistance(c1,c2){
  const r1=parseInt(c1.substr(0,2),16), g1=parseInt(c1.substr(2,2),16), b1=parseInt(c1.substr(4,2),16);
  const r2=parseInt(c2.substr(0,2),16), g2=parseInt(c2.substr(2,2),16), b2=parseInt(c2.substr(4,2),16);
  return Math.sqrt((r1-r2)**2+(g1-g2)**2+(b1-b2)**2);
}

