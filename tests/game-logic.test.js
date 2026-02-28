"use strict";

/**
 * Unit tests for js/game-logic.js
 *
 * Why: Pure logic functions must be verified in isolation to catch regressions
 *      without launching a browser.
 * How: Uses Node.js built-in test runner (node:test) and strict assertions.
 *      Requires game-logic.js via CommonJS (the UMD wrapper exports module.exports
 *      when running under Node.js).
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { getResult, pick, pickDifferent } = require("../js/game-logic.js");

// ---------------------------------------------------------------------------
// getResult — all 9 hand combinations
// ---------------------------------------------------------------------------
describe("getResult", () => {
  describe("rock", () => {
    it("rock vs scissors → win", () => {
      assert.equal(getResult("rock", "scissors"), "win");
    });

    it("rock vs paper → lose", () => {
      assert.equal(getResult("rock", "paper"), "lose");
    });

    it("rock vs rock → draw", () => {
      assert.equal(getResult("rock", "rock"), "draw");
    });
  });

  describe("scissors", () => {
    it("scissors vs paper → win", () => {
      assert.equal(getResult("scissors", "paper"), "win");
    });

    it("scissors vs rock → lose", () => {
      assert.equal(getResult("scissors", "rock"), "lose");
    });

    it("scissors vs scissors → draw", () => {
      assert.equal(getResult("scissors", "scissors"), "draw");
    });
  });

  describe("paper", () => {
    it("paper vs rock → win", () => {
      assert.equal(getResult("paper", "rock"), "win");
    });

    it("paper vs scissors → lose", () => {
      assert.equal(getResult("paper", "scissors"), "lose");
    });

    it("paper vs paper → draw", () => {
      assert.equal(getResult("paper", "paper"), "draw");
    });
  });
});

// ---------------------------------------------------------------------------
// pick — random selection from an array
// ---------------------------------------------------------------------------
describe("pick", () => {
  it("single-element array always returns that element", () => {
    assert.equal(pick(["rock"]), "rock");
  });

  it("empty array returns undefined", () => {
    // Math.floor(NaN) → NaN; array[NaN] → undefined
    assert.equal(pick([]), undefined);
  });

  it("multi-element array returns a value contained in the array", () => {
    const list = ["rock", "scissors", "paper"];
    for (let i = 0; i < 50; i++) {
      assert.ok(list.includes(pick(list)), "pick() returned a value not in the list");
    }
  });
});

// ---------------------------------------------------------------------------
// pickDifferent — random selection that avoids repeating prev
// ---------------------------------------------------------------------------
describe("pickDifferent", () => {
  it("empty array returns prev unchanged", () => {
    assert.equal(pickDifferent([], "rock"), "rock");
  });

  it("single-element array returns that element even if it equals prev", () => {
    assert.equal(pickDifferent(["rock"], "rock"), "rock");
  });

  it("multi-element array never returns prev (100 iterations)", () => {
    const list = ["rock", "scissors", "paper"];
    for (let i = 0; i < 100; i++) {
      const result = pickDifferent(list, "rock");
      assert.notEqual(result, "rock", "pickDifferent() returned the same value as prev");
    }
  });

  it("multi-element result is always contained in the list", () => {
    const list = ["rock", "scissors", "paper"];
    for (let i = 0; i < 50; i++) {
      assert.ok(
        list.includes(pickDifferent(list, "scissors")),
        "pickDifferent() returned a value not in the list",
      );
    }
  });
});
