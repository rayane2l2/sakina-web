import test from "node:test";
import assert from "node:assert/strict";
import { isFinishedBookSession } from "../app/js/session-memory.js";

test("a book session saved after its last card is finished", () => {
  assert.equal(isFinishedBookSession({ programId: "b", questionId: null, savedDay: "x" }), true);
});

test("a book session with a card on screen or coming back soon is not finished", () => {
  assert.equal(isFinishedBookSession({ programId: "b", questionId: "q12" }), false);
  assert.equal(isFinishedBookSession({ programId: "b", questionId: null, waitingUntil: "2026-11-17T10:05:00Z" }), false);
});

test("practice, demo and missing checkpoints are never treated as finished", () => {
  assert.equal(isFinishedBookSession({ practice: { queue: [] }, questionId: null }), false);
  assert.equal(isFinishedBookSession({ demo: true, questionId: null }), false);
  assert.equal(isFinishedBookSession(null), false);
  assert.equal(isFinishedBookSession(undefined), false);
});
