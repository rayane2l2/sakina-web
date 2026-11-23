import test from "node:test";
import assert from "node:assert/strict";
import { masteryRating } from "../app/js/page-review.js";

test("mastered on the first try alone is clean", () => {
  assert.equal(masteryRating({ retries: 0, audioUsed: false }), "clean");
  assert.equal(masteryRating(), "clean");
});

test("leaning on the audio is a hesitation", () => {
  assert.equal(masteryRating({ retries: 0, audioUsed: true }), "hesitant");
});

test("starting over is a mistake, three times or more is blocked", () => {
  assert.equal(masteryRating({ retries: 1 }), "mistake");
  assert.equal(masteryRating({ retries: 2, audioUsed: true }), "mistake");
  assert.equal(masteryRating({ retries: 3 }), "blocked");
  assert.equal(masteryRating({ retries: 9 }), "blocked");
});

test("odd retry values are read safely", () => {
  assert.equal(masteryRating({ retries: "2" }), "mistake");
  assert.equal(masteryRating({ retries: -4 }), "clean");
  assert.equal(masteryRating({ retries: "x" }), "clean");
});
