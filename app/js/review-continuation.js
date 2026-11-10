const key = (w) => `${w.s}:${w.a}:${w.w}`;
export class ReviewPageCursor {
  constructor(refs, sheets, pages) {
    this.frontier = -1;
    this.sheetByWord = new Map();
    this.lastBySheet = new Map();
    sheets.forEach((sheet, index) => {
      const page = pages.find((p) => p.n === sheet.page);
      for (const line of page?.lines || [])
        for (const word of line.words) this.sheetByWord.set(key(word), index);
    });
    this.refs = refs;
    refs.forEach((word, index) => {
      const sheet = this.sheetByWord.get(key(word));
      if (sheet !== undefined) this.lastBySheet.set(sheet, index);
    });
  }
  startAt(sheet) {
    return this.refs.findIndex(
      (word) => this.sheetByWord.get(key(word)) === sheet,
    );
  }
  follow(words, currentSheet) {
    const at = words.findLastIndex(
      (w) => w.status === "heard" || w.status === "check",
    );
    if (at <= this.frontier) return currentSheet;
    this.frontier = at;
    let target = this.sheetByWord.get(key(this.refs[at] || {}));
    if (target === undefined) return currentSheet;
    if (
      words[at]?.status === "heard" &&
      this.lastBySheet.get(target) === at &&
      this.lastBySheet.has(target + 1)
    )
      target++;
    // Moving the printed page never rewinds the already running recognition stream.
    return Math.max(currentSheet, target);
  }
}
export function readingPlace(reader, corpus, now = Date.now()) {
  return {
    corpus,
    sid: String(reader.sid),
    index: Math.max(0, Number(reader.index) || 0),
    page: reader.page || null,
    anchorId: reader.anchorId || null,
    savedAt: now,
  };
}
