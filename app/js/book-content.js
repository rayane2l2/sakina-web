const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function nativeBookText(text) {
  return String(text)
    .split(/([\u0600-\u06ff][\u0600-\u06ff\s\u200c\u200d]*)/g)
    .map((part, i) =>
      i % 2
        ? `<bdi class="qa-inline-ar" lang="ar" dir="rtl">${escape(part.trim())}</bdi>${part.endsWith(" ") ? " " : ""}`
        : escape(part),
    )
    .join("");
}
export function bookContentHTML(items, audioRenderer) {
  return items
    .map((block, index) => {
      if (block.type === "text")
        return `<p class="qa-text ${block.language === "ar" ? "qa-arabic" : ""} ${items[index + 1]?.type === "hadith-audio" && block.language === "ar" ? "qa-hadith-citation" : ""}" ${block.language === "ar" ? 'lang="ar" dir="rtl"' : ""}>${block.language === "ar" ? escape(block.text) : nativeBookText(block.text)}</p>`;
      if (block.type === "quran")
        return `<figure class="qa-quran" lang="ar" dir="rtl">${block.svg?.length ? block.svg.map((src) => `<img src="${escape(src)}" alt="${escape(block.text)}" class="qa-quran-svg" loading="lazy">`).join("") : `<p class="qa-arabic">${escape(block.text)}</p>`}</figure>`;
      if (block.type === "quran-audio" || block.type === "hadith-audio")
        return audioRenderer(block);
      throw Error("Ce livre doit être préparé en texte avant son utilisation.");
    })
    .join("");
}
