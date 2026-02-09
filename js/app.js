(() => {
  const config = window.MORAMORA_CONFIG || {};

  const expressionLayer = document.getElementById("expression-layer");
  const handLayer = document.getElementById("hand-layer");
  const userHandLabel = document.getElementById("user-hand-label");
  const finalHandLabel = document.getElementById("final-hand-label");
  const statusPill = document.getElementById("status-pill");
  const resultText = document.getElementById("result-text");
  const resultBar = document.getElementById("result-bar");
  const restartBtn = document.getElementById("restart-btn");
  const handButtons = Array.from(document.querySelectorAll(".hand-btn"));
  const page = document.querySelector(".page");
  const frame = document.getElementById("character-frame");
  const vsOverlay = document.getElementById("vs-overlay");
  const npcHandEmoji = document.getElementById("npc-hand-emoji");

  // DOM要素が存在しない場合の安全性チェック
  if (!expressionLayer || !handLayer || !statusPill || !resultText || !resultBar) {
    console.error("必須のDOM要素が見つかりません。HTMLの構造を確認してください。");
  }

  const hands = ["rock", "scissors", "paper"];
  const handLabels = { rock: "グー", scissors: "チョキ", paper: "パー" };
  const handEmojis = { rock: "✊", scissors: "✌️", paper: "🖐️" };
  const handImages = {
    scissors: "assets/Scissors.png",
    paper: "assets/Paper.png",
  };
  const baseExpressionPath = "assets/base.png";
  const expressions =
    Array.isArray(config.expressions) && config.expressions.length > 0
      ? config.expressions
      : ["assets/expression_01.png", "assets/expression_02.png", "assets/expression_03.png"];

  const defaultMessages = {
    win: ["あなたの勝ち！やったね、モラモラはちょっとくやしそう。"],
    lose: ["あなたの負け…。モラモラがニコニコしています。"],
    draw: ["あいこ！もう一度勝負しよう。"],
  };
  const messageConfig = config.messages || {};

  const shuffleIntervalMs =
    typeof config.shuffleIntervalMs === "number" ? config.shuffleIntervalMs : 640;
  const revealDelayMs =
    typeof config.revealDelayMs === "number" ? config.revealDelayMs : 900;
  const shakeDurationMs =
    typeof config.shakeDurationMs === "number" ? config.shakeDurationMs : 420;
  const baseMessage = "「じゃーんけーん…ぽん！」のタイミングをねらってね。";

  let shuffleTimer = null;
  let revealTimer = null;
  let currentHand = "rock";
  let pendingNpcHand = null;
  let isLocked = false;

  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const pickDifferent = (list, prev) => {
    if (!list.length) return prev;
    let candidate = pick(list);
    if (list.length === 1) return candidate;
    while (candidate === prev) {
      candidate = pick(list);
    }
    return candidate;
  };

  const getMessage = (outcome) => {
    const pool = Array.isArray(messageConfig[outcome]) && messageConfig[outcome].length
      ? messageConfig[outcome]
      : defaultMessages[outcome];
    return pick(pool);
  };

  const setButtonsDisabled = (isDisabled) => {
    handButtons.forEach((btn) => {
      btn.disabled = isDisabled;
    });
  };

  const setNpcHandEmoji = (hand) => {
    if (npcHandEmoji) {
      npcHandEmoji.textContent = handEmojis[hand] || "？";
    }
  };

  const highlightUserHand = (hand) => {
    handButtons.forEach((btn) => {
      const isTarget = btn.dataset.hand === hand;
      btn.classList.toggle("is-selected", isTarget);
    });
  };

  const setExpression = (path) => {
    if (expressionLayer.getAttribute("src") !== path) {
      expressionLayer.setAttribute("src", path);
    }
  };

  const setHandVisual = (hand) => {
    currentHand = hand;
    setNpcHandEmoji(hand);

    if (hand === "rock") {
      handLayer.classList.add("is-hidden");
    } else {
      handLayer.classList.remove("is-hidden");
      handLayer.setAttribute("src", handImages[hand]);
    }
  };

  const randomizeFrame = () => {
    const nextHand = pickDifferent(hands, currentHand);
    setHandVisual(nextHand);
  };

  const clearReveal = () => {
    if (revealTimer) {
      clearTimeout(revealTimer);
      revealTimer = null;
    }
  };

  const clearShuffle = () => {
    if (shuffleTimer) {
      clearInterval(shuffleTimer);
      shuffleTimer = null;
    }
  };

  const hideVsOverlay = () => {
    if (!vsOverlay) return;
    vsOverlay.classList.remove("is-active");
  };

  const startShuffle = () => {
    clearShuffle();
    clearReveal();
    hideVsOverlay();
    pendingNpcHand = null;
    isLocked = false;
    resultBar.classList.remove("is-win", "is-lose", "is-draw");
    handButtons.forEach((btn) => btn.classList.remove("is-win", "is-lose", "is-draw"));
    resultText.textContent = baseMessage;
    userHandLabel.textContent = "未選択";
    finalHandLabel.textContent = "???";
    setNpcHandEmoji("rock");
    statusPill.textContent = "シャッフル中";
    statusPill.classList.remove("is-stopped");
    page?.classList.remove("shake");
    frame?.classList.remove("is-paused");
    setButtonsDisabled(false);
    highlightUserHand(null);
    setExpression(baseExpressionPath);
    randomizeFrame();
    shuffleTimer = setInterval(randomizeFrame, shuffleIntervalMs);
  };

  const getResult = (user, npc) => {
    if (user === npc) return "draw";
    const isWin =
      (user === "rock" && npc === "scissors") ||
      (user === "scissors" && npc === "paper") ||
      (user === "paper" && npc === "rock");
    return isWin ? "win" : "lose";
  };

  const announceResult = (userHand, npcHand) => {
    const outcome = getResult(userHand, npcHand);
    if (outcome === "lose") {
      setExpression(baseExpressionPath);
    } else {
      setExpression(pick(expressions));
    }
    setHandVisual(npcHand);
    const message = getMessage(outcome);

    frame?.classList.add("is-paused");
    userHandLabel.textContent = handLabels[userHand];
    finalHandLabel.textContent = handLabels[npcHand];
    highlightUserHand(userHand);
    resultText.textContent = message;

    statusPill.textContent = "結果発表";
    statusPill.classList.add("is-stopped");
    resultBar.classList.remove("is-win", "is-lose", "is-draw");
    resultBar.classList.add(`is-${outcome}`);
    handButtons.forEach((btn) => {
      btn.classList.remove("is-win", "is-lose", "is-draw");
      if (btn.dataset.hand === userHand) {
        btn.classList.add(`is-${outcome}`);
      }
    });
    hideVsOverlay();
    revealTimer = null;
  };

  const triggerShake = () => {
    if (!page) return;
    page.classList.remove("shake");
    void page.offsetHeight;
    page.classList.add("shake");
    setTimeout(() => page.classList.remove("shake"), shakeDurationMs);
  };

  const showVsOverlay = () => {
    if (!vsOverlay) return;
    vsOverlay.classList.add("is-active");
  };

  const handleUserChoice = (hand) => {
    if (isLocked) return;
    isLocked = true;
    clearShuffle();
    setButtonsDisabled(true);
    pendingNpcHand = pickDifferent(hands, currentHand);
    showVsOverlay();
    statusPill.textContent = "判定中...";
    resultText.textContent = "……判定中……";
    resultBar.classList.remove("is-win", "is-lose", "is-draw");
    handButtons.forEach((btn) => btn.classList.remove("is-win", "is-lose", "is-draw"));
    triggerShake();
    revealTimer = setTimeout(
      () => announceResult(hand, pendingNpcHand || currentHand),
      revealDelayMs
    );
  };

  handButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      handleUserChoice(btn.dataset.hand);
    });
  });

  restartBtn.addEventListener("click", () => {
    startShuffle();
  });

  startShuffle();
})();
