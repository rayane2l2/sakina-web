import { wordVoice } from "./quran-audio-sync.js";
import { quranReadingMode, quranTextSize } from "./quran-reading.js";
import { validateBookStudy } from "./books-core.js";
import { supportedCorpus } from "./matn-corpus.js";
import { normalizeModel } from "./model-choice.js";
import { normalizeSpeed } from "./playback-speed.js";
import { validDeadline } from "./deadline-plan.js";
const KEY = "sakina-recite.v1";
const empty = () => ({
  version: 1,
  programs: [],
  bookmarks: [],
  settings: {
    reciter: "minshawi",
    appearance: "system",
    wordVoice: "quran-com",
    quranReadingMode: "mushaf",
    quranTextSize: 40,
    repeat: 1,
    freeRepeatDefaultV2: true,
    playbackRate: 1,
    recognitionModel: "v3.1",
  },
  last: null,
});
export function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (
      !s ||
      s.version !== 1 ||
      !Array.isArray(s.programs) ||
      !Array.isArray(s.bookmarks)
    )
      return empty();
    const previous = s.settings || {};
    s.settings = {
      ...empty().settings,
      ...s.settings,
      wordVoice: wordVoice(s.settings?.wordVoice),
      recognitionModel: normalizeModel(s.settings?.recognitionModel),
      playbackRate: normalizeSpeed(s.settings?.playbackRate),
      quranReadingMode: quranReadingMode(s.settings?.quranReadingMode),
      quranTextSize: quranTextSize(s.settings?.quranTextSize),
    };
    if (!previous.freeRepeatDefaultV2 && previous.repeat === 3)
      s.settings.repeat = 1;
    s.settings.freeRepeatDefaultV2 = true;
    return s;
  } catch {
    return empty();
  }
}
export function save(state) {
  const { bookStudy, ...base } = state;
  localStorage.setItem(KEY, JSON.stringify(base));
}
export function validateBackup(s) {
  if (
    !s ||
    s.version !== 1 ||
    !Array.isArray(s.programs) ||
    !Array.isArray(s.bookmarks) ||
    s.programs.length > 200
  )
    throw Error("Sauvegarde incompatible");
  for (const p of s.programs)
    if (
      typeof p.id !== "string" ||
      typeof p.name !== "string" ||
      !supportedCorpus(p.corpus) ||
      (p.goal !== undefined && !validDeadline(p.goal)) ||
      !p.memo ||
      !Array.isArray(p.memo.units) ||
      !p.memo.items ||
      !Array.isArray(p.memo.queue)
    )
      throw Error("Programme invalide dans la sauvegarde");
  if (s.bookStudy !== undefined) validateBookStudy(s.bookStudy);
  return s;
}
export const day = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
