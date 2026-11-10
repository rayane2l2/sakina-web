export const RECITER_AUDIO_FOLDERS = Object.freeze({
  minshawi: "Minshawy_Murattal_128kbps",
  husary: "Husary_64kbps",
  alafasy: "Alafasy_128kbps",
});
export const wordVoice = (value) =>
  value === "minshawi" ? "minshawi" : "quran-com";
export function wordAtTime(ranges, time) {
  if (!Array.isArray(ranges) || !Number.isFinite(time)) return null;
  const ms = time * 1000;
  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i];
    if (r && ms >= r[0] && ms < r[1]) return i + 1;
  }
  return null;
}
export function printedPositions(data, id, position) {
  return data.wordMappings?.[id]?.[position - 1] ?? [position];
}
export function canonicalPositions(data, id, position) {
  const mapping = data.wordMappings?.[id];
  return mapping
    ? mapping.flatMap((values, i) => (values.includes(position) ? [i + 1] : []))
    : [position];
}
export function playbackWord(data, id, time) {
  const canonical = wordAtTime(data?.verses?.[id], time);
  if (!canonical) return { canonical: null, printed: null };
  const mapped = printedPositions(data, id, canonical);
  return { canonical, printed: mapped.length === 1 ? mapped[0] : null };
}
export function dedicatedWordURL(s, a, w) {
  if (
    ![s, a, w].every(Number.isInteger) ||
    s < 1 ||
    s > 114 ||
    a < 1 ||
    a > 286 ||
    w < 1 ||
    w > 200
  )
    return null;
  return `https://audio.qurancdn.com/wbw/${[s, a, w].map((n) => String(n).padStart(3, "0")).join("_")}.mp3`;
}
export function wordRecordings(data, id, position, coordinate = "canonical") {
  const [s, a] = id.split(":").map(Number),
    count = data.verses?.[id]?.length;
  if (!count || !Number.isInteger(position) || position < 1) return [];
  let refs = [];
  if (coordinate === "printed") {
    const max = data.printedCounts?.[id] || count;
    if (position > max) return [];
    refs = [[s, a, position]];
  } else {
    if (position > count) return [];
    const prefix = data.basmalaPrefixes?.[id] || 0;
    refs =
      position <= prefix
        ? [[1, 1, position]]
        : printedPositions(data, id, position).map((w) => [s, a, w]);
  }
  return refs
    .map(([surah, ayah, w]) => ({
      url: dedicatedWordURL(surah, ayah, w),
      printedKey: surah === s && ayah === a ? `${id}:${w}` : null,
    }))
    .filter((r) => r.url);
}
