import test from "node:test";
import assert from "node:assert/strict";
import { isSwipe } from "../app/js/reader-chrome.js";

test("a tap with a little jitter is not a swipe", () => {
  assert.equal(isSwipe({ x: 10, y: 10 }, { x: 14, y: 16 }), false);
});

test("a finger that travels is a swipe, in any direction", () => {
  assert.equal(isSwipe({ x: 10, y: 10 }, { x: 10, y: 40 }), true);
  assert.equal(isSwipe({ x: 50, y: 10 }, { x: 20, y: 12 }), true);
});

test("no starting point, no swipe", () => {
  assert.equal(isSwipe(null, { x: 0, y: 0 }), false);
});
