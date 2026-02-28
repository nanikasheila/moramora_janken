(() => {
  // Why: Pure logic lives in game-logic.js to allow unit testing.
  // How: Falls back to empty object so destructuring still works if the script
  //      is somehow loaded without game-logic.js (fails gracefully).
  const { getResult, pick, pickDifferent } = window.GameLogic || {};

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

  /**
   * Return a random result message for the given game outcome.
   *
   * Why: Message pools are configurable via config.js so site owners can
   *      customise dialogue without editing game logic.
   * How: Prefers the config-supplied pool when it is a non-empty array;
   *      falls back to hardcoded defaults. Delegates random selection to pick().
   *
   * @param {"win" | "lose" | "draw"} outcome - The match result.
   * @returns {string} A randomly chosen message string.
   */
  const getMessage = (outcome) => {
    const pool = Array.isArray(messageConfig[outcome]) && messageConfig[outcome].length
      ? messageConfig[outcome]
      : defaultMessages[outcome];
    return pick(pool);
  };

  /**
   * Enable or disable all hand-selection buttons simultaneously.
   *
   * Why: Buttons must be locked while the NPC hand is being revealed to prevent
   *      the user from changing their choice mid-animation.
   * How: Iterates over the pre-collected handButtons NodeList and sets the
   *      disabled property directly.
   *
   * @param {boolean} isDisabled - true to disable, false to enable.
   * @returns {void}
   */
  const setButtonsDisabled = (isDisabled) => {
    handButtons.forEach((btn) => {
      btn.disabled = isDisabled;
    });
  };

  /**
   * Update the NPC hand emoji display.
   *
   * Why: The emoji area gives players instant visual feedback of the NPC's
   *      current hand during shuffle and after reveal.
   * How: Guards against a missing DOM element, then maps the hand key to an
   *      emoji via handEmojis. Falls back to "？" for unknown keys.
   *
   * @param {string} hand - Hand key ("rock" | "scissors" | "paper").
   * @returns {void}
   */
  const setNpcHandEmoji = (hand) => {
    if (npcHandEmoji) {
      npcHandEmoji.textContent = handEmojis[hand] || "？";
    }
  };

  /**
   * Highlight the button corresponding to the user's chosen hand.
   *
   * Why: Visual confirmation of the user's selection improves game clarity,
   *      especially during the reveal delay.
   * How: Toggles the "is-selected" CSS class on each button based on whether
   *      its data-hand attribute matches the supplied hand. Passing null clears
   *      all highlights.
   *
   * @param {string | null} hand - Hand key to highlight, or null to clear all.
   * @returns {void}
   */
  const highlightUserHand = (hand) => {
    handButtons.forEach((btn) => {
      const isTarget = btn.dataset.hand === hand;
      btn.classList.toggle("is-selected", isTarget);
    });
  };

  /**
   * Set the character expression image to the given asset path.
   *
   * Why: Swapping the expression layer src causes a browser repaint; skipping
   *      the write when the value is unchanged avoids unnecessary repaints.
   * How: Compares the current src attribute before calling setAttribute.
   *
   * @param {string} path - Relative path to the expression image asset.
   * @returns {void}
   */
  const setExpression = (path) => {
    if (expressionLayer.getAttribute("src") !== path) {
      expressionLayer.setAttribute("src", path);
    }
  };

  /**
   * Update the hand illustration layer and NPC emoji for the given hand.
   *
   * Why: The rock hand has no separate image (the base illustration already
   *      shows a fist), so it uses a different rendering path.
   * How: For rock, hides the overlay hand-layer image. For other hands, shows
   *      the layer and sets its src from the handImages map. Also updates the
   *      currentHand state variable and the NPC emoji.
   *
   * @param {string} hand - Hand key ("rock" | "scissors" | "paper").
   * @returns {void}
   */
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

  /**
   * Advance the NPC hand to a randomly chosen different hand.
   *
   * Why: Each shuffle tick must show a different hand to make the animation
   *      look like a real shuffle.
   * How: Delegates to pickDifferent() to guarantee a change, then calls
   *      setHandVisual() to update the DOM.
   *
   * @returns {void}
   */
  const randomizeFrame = () => {
    const nextHand = pickDifferent(hands, currentHand);
    setHandVisual(nextHand);
  };

  /**
   * Cancel any pending result-reveal timer.
   *
   * Why: If the user somehow triggers a restart before the reveal timer fires,
   *      the stale callback must be cancelled to prevent incorrect state.
   * How: Calls clearTimeout and nulls the reference so the guard in later code
   *      can reliably detect whether a timer is pending.
   *
   * @returns {void}
   */
  const clearReveal = () => {
    if (revealTimer) {
      clearTimeout(revealTimer);
      revealTimer = null;
    }
  };

  /**
   * Stop the running shuffle interval.
   *
   * Why: The shuffle interval must be stopped before announcing results and
   *      on restart to prevent memory leaks and conflicting state updates.
   * How: Calls clearInterval and nulls the reference for reliable guard checks.
   *
   * @returns {void}
   */
  const clearShuffle = () => {
    if (shuffleTimer) {
      clearInterval(shuffleTimer);
      shuffleTimer = null;
    }
  };

  /**
   * Hide the VS overlay element.
   *
   * Why: The VS overlay is shown briefly during the decision shake animation
   *      and must be dismissed after the result is displayed.
   * How: Guards against a missing element, then removes the "is-active" class
   *      whose CSS transition handles the fade-out.
   *
   * @returns {void}
   */
  const hideVsOverlay = () => {
    if (!vsOverlay) return;
    vsOverlay.classList.remove("is-active");
  };

  /**
   * Reset all game state and restart the hand-shuffle animation loop.
   *
   * Why: Called on initial load and on the restart button click. All UI state
   *      (results, highlights, status text) must be fully reset so each round
   *      starts from a clean slate.
   * How: Cancels existing timers, clears all result classes and labels, resets
   *      buttons and expression to initial values, then starts a new setInterval
   *      that calls randomizeFrame() every shuffleIntervalMs.
   *
   * @returns {void}
   */
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

  /**
   * Display the final result of a round and update all result UI elements.
   *
   * Why: After the reveal delay, all UI sections (expression, labels, status
   *      pill, result bar, button highlights) must update simultaneously to
   *      present a coherent result screen.
   * How: Calls getResult() for the outcome, then applies outcome-specific CSS
   *      classes, updates text content, and calls setHandVisual() / setExpression()
   *      for the visual layers. Clears the reveal timer reference at the end.
   *
   * @param {string} userHand - The user's chosen hand key.
   * @param {string} npcHand  - The NPC's chosen hand key.
   * @returns {void}
   */
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

  /**
   * Trigger a CSS shake animation on the page element.
   *
   * Why: A brief shake effect gives physical feedback when the user commits to
   *      their hand choice, making the reveal feel more exciting.
   * How: Removes then re-adds the "shake" class. The intermediate offsetHeight
   *      read forces a style recalculation so the animation restarts even if the
   *      class was already present. A timeout removes the class after the
   *      animation completes (shakeDurationMs).
   *
   * @returns {void}
   */
  const triggerShake = () => {
    if (!page) return;
    page.classList.remove("shake");
    void page.offsetHeight;
    page.classList.add("shake");
    setTimeout(() => page.classList.remove("shake"), shakeDurationMs);
  };

  /**
   * Show the VS overlay element.
   *
   * Why: Displaying the VS overlay during the decision pause creates a dramatic
   *      pause before the result is revealed.
   * How: Guards against a missing element, then adds the "is-active" class
   *      whose CSS handles the fade-in animation.
   *
   * @returns {void}
   */
  const showVsOverlay = () => {
    if (!vsOverlay) return;
    vsOverlay.classList.add("is-active");
  };

  /**
   * Handle the user selecting a hand button.
   *
   * Why: This is the primary game interaction entry point. Multiple guards are
   *      needed because rapid clicks could otherwise corrupt the animation state.
   * How: Sets isLocked to prevent re-entry, stops the shuffle, shows the VS
   *      overlay, triggers a shake animation, then schedules announceResult()
   *      after revealDelayMs. The NPC hand is frozen at this moment via
   *      pickDifferent() to ensure a fair outcome.
   *
   * @param {string} hand - The hand key chosen by the user.
   * @returns {void}
   */
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

  // Why: restartBtn may be absent in test/embed contexts; guard prevents a
  //      runtime TypeError that would silently break the entire IIFE.
  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      startShuffle();
    });
  }

  startShuffle();
})();
