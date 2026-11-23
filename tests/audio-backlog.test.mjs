import test from "node:test";
import assert from "node:assert/strict";
import { AudioBacklog } from "../app/js/audio-backlog.js";

const chunk = (n, value = 1) => new Float32Array(n).fill(value);

test("chunks go straight to the recognizer while it keeps up", () => {
  const backlog = new AudioBacklog({ maxInFlight: 2 });
  assert.equal(backlog.push(chunk(4), 16000).samples.length, 4);
  assert.equal(backlog.push(chunk(4), 16000).samples.length, 4);
  assert.equal(backlog.inFlight, 2);
});

test("a busy recognizer gets the late audio merged into one chunk, in order", () => {
  const backlog = new AudioBacklog({ maxInFlight: 1 });
  backlog.push(chunk(2, 1), 16000);
  assert.equal(backlog.push(chunk(2, 2), 16000), null);
  assert.equal(backlog.push(chunk(3, 3), 16000), null);
  const next = backlog.done();
  assert.deepEqual(Array.from(next.samples), [2, 2, 3, 3, 3]);
  assert.equal(next.rate, 16000);
  assert.equal(backlog.inFlight, 1);
  assert.equal(backlog.done(), null);
  assert.equal(backlog.inFlight, 0);
});

test("only a backlog longer than the limit counts as too slow", () => {
  const backlog = new AudioBacklog({ maxInFlight: 1, maxSeconds: 1 });
  backlog.push(chunk(10), 10);
  backlog.push(chunk(9), 10);
  assert.equal(backlog.overflow, false);
  backlog.push(chunk(2), 10);
  assert.equal(backlog.overflow, true);
});

test("reset forgets queued audio and pending acknowledgements", () => {
  const backlog = new AudioBacklog({ maxInFlight: 1 });
  backlog.push(chunk(2), 16000);
  backlog.push(chunk(2), 16000);
  backlog.reset();
  assert.equal(backlog.inFlight, 0);
  assert.equal(backlog.done(), null);
  assert.equal(backlog.overflow, false);
});

test("flush hands over everything still queued when the recitation ends", () => {
  const backlog = new AudioBacklog({ maxInFlight: 1 });
  backlog.push(chunk(2, 1), 16000);
  backlog.push(chunk(2, 2), 16000);
  backlog.push(chunk(1, 3), 16000);
  assert.deepEqual(Array.from(backlog.flush().samples), [2, 2, 3]);
  assert.equal(backlog.flush(), null);
});
