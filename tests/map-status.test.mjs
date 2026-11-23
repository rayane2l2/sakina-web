import test from "node:test";
import assert from "node:assert/strict";
import { memoStatus, bookCardStatus, mapSections, juzSections } from "../app/js/gamification.js";

test("a matn verse follows its spacing: new, anchoring, linking, then maintenance", () => {
  assert.equal(memoStatus(undefined), "new");
  assert.equal(memoStatus({ interval: 1, lapses: 0 }), "anchor");
  assert.equal(memoStatus({ interval: 8, lapses: 0 }), "link");
  assert.equal(memoStatus({ interval: 40, lapses: 2 }), "solid");
});

test("a matn verse just forgotten again needs repair", () => {
  assert.equal(memoStatus({ interval: 1, lapses: 1 }), "repair");
});

test("a book card maps its FSRS state to the same colours", () => {
  assert.equal(bookCardStatus(undefined), "new");
  assert.equal(bookCardStatus({ state: 1, stability: 0.5 }), "anchor");
  assert.equal(bookCardStatus({ state: 2, stability: 6 }), "link");
  assert.equal(bookCardStatus({ state: 2, stability: 30 }), "solid");
  assert.equal(bookCardStatus({ state: 3, stability: 4 }), "repair");
});

test("map sections follow the book order and start a new section when the chapter changes", () => {
  const cells = [
    { n: 1, chapter: "Purification", status: "solid" },
    { n: 2, chapter: "Purification", status: "new" },
    { n: 3, chapter: "Prayer", status: "repair" },
  ];
  const map = mapSections(cells, (c) => c.chapter);
  assert.deepEqual(map.sections.map((s) => [s.title, s.cells.length, s.known]), [["Purification", 2, 1], ["Prayer", 1, 1]]);
  assert.equal(map.known, 2);
  assert.equal(map.total, 3);
});

test("the whole Quran is shown juz by juz, a long surah appearing in every juz it covers", () => {
  const map = {
    juz: [{ n: 1, known: 5, total: 10 }, { n: 2, known: 0, total: 10 }, { n: 3, known: 1, total: 10 }],
    surahs: [{ id: "1", juz: [1] }, { id: "2", juz: [1, 2, 3] }, { id: "3", juz: [3] }],
  };
  assert.deepEqual(juzSections(map).map((p) => [p.n, p.surahs.map((s) => s.id), p.known, p.total]), [
    [1, ["1", "2"], 5, 10],
    [2, ["2"], 0, 10],
    [3, ["2", "3"], 1, 10],
  ]);
});
