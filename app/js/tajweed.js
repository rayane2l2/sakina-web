// Rule names and durations follow Quran.com; colors are Sakina's readable palette.
export const TAJWEED_GROUPS = [
  {
    id: "liaison",
    color: "#707070",
    label: "Liaison et lettres muettes",
    description: "Hamzat al-wasl, lettres muettes et lam solaire.",
  },
  {
    id: "madd-normal",
    color: "#ffb300",
    label: "Madd normal · 2 temps",
    description: "Allongement normal : 2 temps.",
  },
  {
    id: "madd-permitted",
    color: "#ff6600",
    label: "Madd permis · 2, 4 ou 6 temps",
    description: "Allongement permis : 2, 4 ou 6 temps.",
  },
  {
    id: "madd-connected",
    color: "#ff0000",
    label: "Madd obligatoire · 4 ou 5 temps",
    description: "Allongement obligatoire : 4 ou 5 temps.",
  },
  {
    id: "madd-necessary",
    color: "#ff00ff",
    label: "Madd nécessaire · 6 temps",
    description: "Allongement nécessaire : 6 temps.",
  },
  {
    id: "nasal",
    color: "#00ff00",
    label: "Nasalisation",
    description: "Ghounna, ikhfa, iqlab et idgham avec ghounna.",
  },
  {
    id: "qalqalah",
    color: "#0000ff",
    label: "Qalqala · résonance",
    description: "Lettres portant le repère de qalqala.",
  },
  {
    id: "assimilation",
    color: "#8000ff",
    label: "Assimilation",
    description: "Idgham sans ghounna, mutajanisayn et mutaqaribayn.",
  },
];
const groups = {
  ham_wasl: 0,
  slnt: 0,
  laam_shamsiyah: 0,
  madda_normal: 1,
  madda_permissible: 2,
  madda_obligatory: 3,
  madda_necessary: 4,
  ghunnah: 5,
  ikhafa: 5,
  ikhafa_shafawi: 5,
  idgham_ghunnah: 5,
  idgham_shafawi: 5,
  iqlab: 5,
  qalaqah: 6,
  idgham_wo_ghunnah: 7,
  idgham_mutajanisayn: 7,
  idgham_mutaqaribayn: 7,
};
export function tajweedWord(text, id, position, coordinate, data, escape) {
  const verse = data?.verses?.[id],
    ranges = (coordinate === "printed" ? verse?.p || verse?.c : verse?.c)?.[
      position - 1
    ];
  if (!ranges?.length) return escape(text);
  let result = "",
    at = 0;
  for (const [start, end, index] of ranges) {
    const rule = data.ruleKeys?.[index],
      group = TAJWEED_GROUPS[groups[rule]];
    if (
      !group ||
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < at ||
      end <= start ||
      end > text.length
    )
      continue;
    result +=
      escape(text.slice(at, start)) +
      `<span class="tajweed-segment tj-${group.id}" data-tajweed="${rule}" title="${escape(group.label)}">${escape(text.slice(start, end))}</span>`;
    at = end;
  }
  return result + escape(text.slice(at));
}
export function tajweedLegend(escape) {
  return `<dl class="tajweed-key">${TAJWEED_GROUPS.map((group) =>
    `<div><dt><i class="tajweed-swatch tj-${group.id}" aria-hidden="true"></i>${escape(group.label)}</dt><dd>${escape(group.description)}</dd></div>`,
  ).join("")}</dl>`;
}
