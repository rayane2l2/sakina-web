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
    color: "#956800",
    label: "Madd normal · 2 temps",
    description: "Allongement normal : 2 temps.",
  },
  {
    id: "madd-permitted",
    color: "#b45000",
    label: "Madd permis · 2, 4 ou 6 temps",
    description: "Allongement permis : 2, 4 ou 6 temps.",
  },
  {
    id: "madd-connected",
    color: "#c72535",
    label: "Madd obligatoire · 4 ou 5 temps",
    description: "Allongement obligatoire : 4 ou 5 temps.",
  },
  {
    id: "madd-necessary",
    color: "#8c1538",
    label: "Madd nécessaire · 6 temps",
    description: "Allongement nécessaire : 6 temps.",
  },
  {
    id: "nasal",
    color: "#087754",
    label: "Nasalisation",
    description: "Ghounna, ikhfa, iqlab et idgham avec ghounna.",
  },
  {
    id: "qalqalah",
    color: "#1467ac",
    label: "Qalqala · résonance",
    description: "Lettres portant le repère de qalqala.",
  },
  {
    id: "assimilation",
    color: "#6943a6",
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
  return `<details class="tajweed-legend"><summary>Couleurs du tajwid</summary><div class="tajweed-legend-rules">${TAJWEED_GROUPS.map((g) => `<details><summary><i class="tajweed-swatch tj-${g.id}" aria-hidden="true"></i>${escape(g.label)}</summary><p>${escape(g.description)}</p></details>`).join("")}</div></details>`;
}
