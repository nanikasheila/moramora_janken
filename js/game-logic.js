/**
 * game-logic.js — Pure game logic functions for Moramora Janken.
 *
 * Why: app.js bundles all logic inside an IIFE, making unit testing impossible.
 *      Extracting pure functions into this module enables isolated testing
 *      without a browser environment.
 * How: UMD-like pattern exposes functions to both Node.js (CommonJS require)
 *      and the browser (window.GameLogic). No side effects or DOM access here.
 */

// Why: ブラウザの <script> タグと Node.js テスト環境の両方で動作させるため
// How: UMD-like パターン。exports が存在すれば module.exports に、
//      なければ root.GameLogic に公開する
(function (root, factory) {
  const exports = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = exports;
  } else {
    root.GameLogic = exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  /**
   * Determine the outcome of a janken (rock-scissors-paper) match.
   *
   * Why: The win/lose/draw logic must be shareable between the UI layer and
   *      unit tests without pulling in any DOM or browser dependencies.
   * How: Equality check handles draw. An explicit lookup of the three winning
   *      combinations covers win; anything else is lose.
   *
   * @param {string} user - The user's hand ("rock" | "scissors" | "paper").
   * @param {string} npc  - The NPC's hand  ("rock" | "scissors" | "paper").
   * @returns {"win" | "lose" | "draw"} The result from the user's perspective.
   */
  function getResult(user, npc) {
    if (user === npc) return "draw";
    const isWin =
      (user === "rock" && npc === "scissors") ||
      (user === "scissors" && npc === "paper") ||
      (user === "paper" && npc === "rock");
    return isWin ? "win" : "lose";
  }

  /**
   * Pick a random element from an array.
   *
   * Why: Random selection is needed in multiple places (NPC hand, expression,
   *      messages). Centralising avoids duplicated Math.random() patterns.
   * How: Multiplies Math.random() by list.length and floors to get a valid index.
   *      Returns undefined for an empty array (Math.floor(NaN) → NaN → undefined).
   *
   * @template T
   * @param {T[]} list - The source array.
   * @returns {T | undefined} A randomly selected element, or undefined if empty.
   */
  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  /**
   * Pick a random element that differs from the previous value.
   *
   * Why: The NPC hand shuffle must always visually change each tick so the
   *      animation looks dynamic. A plain pick() would sometimes repeat.
   * How: Falls back to pick() first; if the result equals prev and the list has
   *      more than one element, keeps re-picking until a different element is found.
   *      For a single-element list it returns that element unconditionally to avoid
   *      an infinite loop. For an empty list it returns prev unchanged.
   *
   * @template T
   * @param {T[]}      list - The source array.
   * @param {T | null} prev - The value to avoid repeating.
   * @returns {T} A randomly selected element different from prev (best effort).
   */
  function pickDifferent(list, prev) {
    if (!list.length) return prev;
    let candidate = pick(list);
    if (list.length === 1) return candidate;
    while (candidate === prev) {
      candidate = pick(list);
    }
    return candidate;
  }

  return { getResult, pick, pickDifferent };
});
