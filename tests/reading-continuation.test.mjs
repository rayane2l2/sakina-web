import test from "node:test";
import assert from "node:assert/strict";
import { readingReachedEnd, readingTrail } from "../app/js/reading-position.js";

const ref = (s, a, w) => ({ s, a, w });

test("the passage ends once its last word is heard, right or wrong", () => {
  assert.equal(readingReachedEnd([]), false);
  assert.equal(readingReachedEnd([{ status: "heard" }, { status: "waiting" }]), false);
  assert.equal(readingReachedEnd([{ status: "heard" }, { status: "heard" }]), true);
  assert.equal(readingReachedEnd([{ status: "waiting" }, { status: "check" }]), true);
});

test("the trail keeps recited words and leaves the old one untouched", () => {
  const old = new Map([["1:1:1", { status: "heard" }]]);
  const trail = readingTrail(old, [ref(1, 7, 8), ref(1, 7, 9)], [{ status: "check" }, { status: "waiting" }]);
  assert.deepEqual([...trail.keys()], ["1:1:1", "1:7:8"]);
  assert.equal(trail.get("1:7:8").status, "check");
  assert.equal(old.size, 1);
});
