# Relecture — Mukhtaṣar ʿAbd Allāh al-Hararī (paire 1)

Identifiant : `mukhtasar-al-harari` · statut : **needs_review** (non validé).

## Fichiers utilisés

| Paire | Fichier d'origine (Téléchargements) | Copie dans ce dossier | Contrôle |
|---|---|---|---|
| 1 | `moukhtasar 1.pdf` (53 pages) | `sources/1.pdf` | SHA-256 identique (1352765c…) |
| 1 | `moukhtasar 1.mp3` (74 min 06 s) | `audio/1.mp3` | SHA-256 identique (787de082…) |

Paire complète : un PDF et un MP3 portant le même nom de base `moukhtasar 1`.

Titre et auteur relevés dans le PDF, sans supposition : couverture (p. 1) « مَتنُ مُخْتَصر الشَّيْخِ عَبْد اللّه الْهَرَرِيّ الْكَافِلِ بِعِلْمِ الدِّينِ الضَّرُورِيِّ » ; préface (p. 2) « أَسْمَيْنَاهُ مُخْتَصَرَ عَبْدِ اللَّهِ الْهَرَرِىِّ الْكَافِلَ بِعِلْمِ الدِّينِ الضَّرُورِىِّ ». La préface précise que l'original (« الأَصْلُ ») est de « عَبْدُ اللَّهِ بنُ حُسَيْنِ بنِ طَاهِرٍ », augmenté et remanié : le champ `author` reprend le nom porté par le titre (عبد الله الهرري).

## Pages couvertes et méthode d'extraction

- PDF entièrement consacré au matn (pas de commentaire). Pages couvertes : **p. 2 à 53** (p. 1 = couverture, non transcrite).
- La couche texte du PDF est inutilisable (police à glyphes réencodés) : tout le texte a été **lu sur les images des pages** (rendu 150 dpi, zooms au besoin), vocalisation comprise, sans compléter ni corriger.
- Le corps à mémoriser commence à la basmala de la p. 2 (incluse, car elle ouvre le texte de l'auteur) et finit par le chapitre du repentir p. 53.
- Titres éditoriaux (« ضَرُورِيَّاتُ الِاعْتِقَادِ », « الطَّهَارَةُ وَالصَّلاةُ », « كِتَابُ … », « فَصْلٌ ») : placés dans `chapters[].title`, jamais dans `text`. Quand plusieurs titres se suivent, ils sont joints par « / » dans le même titre de chapitre.
- Le découpage en chapitres suit les « فَصْلٌ » et « كِتَابُ … » de la source : 39 chapitres (le chapitre 1 = basmala + préface, sans titre dans la source → `title: null`).
- **Depuis le 07/11 : l'audio fait foi.** Le texte du PDF sert de base vocalisée, puis il est corrigé partout où le récitant lit autre chose : gloses ajoutées, passages non lus retirés, formulations remplacées. Toutes les modifications sont listées plus bas.

## Méthode de découpage

- **Découpage fin pour la mémorisation quotidienne** (demande du 06/11) : portions courtes de **~25 mots visés (10 à 45)**, soit 1 à 3 lignes de la source. Chaque chapitre reste un groupe ; les portions ne franchissent jamais un titre.
- Coupe prioritaire **à la ponctuation de la source** (، . : ؛) ; les phrases très courtes d'une suite sont regroupées jusqu'à ~25 mots ; jamais de coupe à l'intérieur d'une citation coranique ﴿ … ﴾.
- Quand une phrase dépasse ~45 mots sans ponctuation, la coupe se place **avant un mot qui ouvre une nouvelle proposition** (« قَالَ », « فَهُوَ », « وَمِنْهَا », « وَأَمَّا », « وَيَجِبُ »…), sinon avant un « وَ » de liste, jamais après une préposition ou au milieu d'un couple « لا … وَلا », « إِمَّا … وَإِمَّا ». Ces coupes sans ponctuation sont marquées ⚠ : à valider.
- Pour un rythme plus lent ou plus rapide, l'app peut regrouper plusieurs portions consécutives d'un même chapitre (les ids se suivent : 2:1, 2:2…).

**237 unités** réparties en **39 chapitres**. Audio vérifié pour **237** unités ; 0 unités ont `audio: null` (raisons ci-dessous). 1 frontières sont des propositions à valider (marquées ⚠).

### Chapitres : conservés entiers ou divisés

| Chapitre | Titre (source) | Mots | Unités | Décision |
|---|---|---:|---:|---|
| 1 | — | 108 | 4 | divisé en 4 : voir raisons par unité |
| 2 | ضَرُورِيَّاتُ الِاعْتِقَادِ / فَصْلٌ | 500 | 17 | divisé en 17 : voir raisons par unité |
| 3 | فَصْلٌ | 897 | 28 | divisé en 28 : voir raisons par unité |
| 4 | فَصْلٌ | 117 | 5 | divisé en 5 : voir raisons par unité |
| 5 | فَصْلٌ | 101 | 4 | divisé en 4 : voir raisons par unité |
| 6 | الطَّهَارَةُ وَالصَّلاةُ / فَصْلٌ | 128 | 5 | divisé en 5 : voir raisons par unité |
| 7 | فَصْلٌ | 63 | 3 | divisé en 3 : voir raisons par unité |
| 8 | فَصْلٌ | 86 | 3 | divisé en 3 : voir raisons par unité |
| 9 | فَصْلٌ | 30 | 1 | entier : phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 10 | فَصْلٌ | 56 | 2 | divisé en 2 : voir raisons par unité |
| 11 | فَصْلٌ | 41 | 2 | divisé en 2 : voir raisons par unité |
| 12 | فَصْلٌ | 137 | 5 | divisé en 5 : voir raisons par unité |
| 13 | فَصْلٌ | 47 | 2 | divisé en 2 : voir raisons par unité |
| 14 | فَصْلٌ | 83 | 3 | divisé en 3 : voir raisons par unité |
| 15 | فَصْلٌ | 56 | 2 | divisé en 2 : voir raisons par unité |
| 16 | فَصْلٌ | 66 | 3 | divisé en 3 : voir raisons par unité |
| 17 | فَصْلٌ | 36 | 1 | entier : phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 18 | فَصْلٌ | 293 | 12 | divisé en 12 : voir raisons par unité |
| 19 | فَصْلٌ | 139 | 5 | divisé en 5 : voir raisons par unité |
| 20 | فَصْلٌ | 260 | 10 | divisé en 10 : voir raisons par unité |
| 21 | فَصْلٌ | 154 | 6 | divisé en 6 : voir raisons par unité |
| 22 | كِتَابُ الزَّكَاةِ / فَصْلٌ | 368 | 13 | divisé en 13 : voir raisons par unité |
| 23 | كِتَابُ الصِّيَامِ | 160 | 6 | divisé en 6 : voir raisons par unité |
| 24 | كِتَابُ الْحَجِّ | 306 | 11 | divisé en 11 : voir raisons par unité |
| 25 | كِتَابُ الْمُعَامَلاتِ / فَصْلٌ | 182 | 7 | divisé en 7 : voir raisons par unité |
| 26 | فَصْلٌ | 108 | 3 | divisé en 3 : voir raisons par unité |
| 27 | فَصْلٌ | 334 | 12 | divisé en 12 : voir raisons par unité |
| 28 | فَصْلٌ | 89 | 3 | divisé en 3 : voir raisons par unité |
| 29 | فَصْلٌ | 80 | 3 | divisé en 3 : voir raisons par unité |
| 30 | فَصْلٌ | 133 | 5 | divisé en 5 : voir raisons par unité |
| 31 | فَصْلٌ | 49 | 2 | divisé en 2 : voir raisons par unité |
| 32 | فَصْلٌ | 67 | 3 | divisé en 3 : voir raisons par unité |
| 33 | فَصْلٌ | 294 | 11 | divisé en 11 : voir raisons par unité |
| 34 | فَصْلٌ | 36 | 1 | entier : phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 35 | فَصْلٌ | 181 | 6 | divisé en 6 : voir raisons par unité |
| 36 | فَصْلٌ | 157 | 6 | divisé en 6 : voir raisons par unité |
| 37 | فَصْلٌ | 79 | 3 | divisé en 3 : voir raisons par unité |
| 38 | فَصْلٌ | 477 | 18 | divisé en 18 : voir raisons par unité |
| 39 | فَصْلٌ | 29 | 1 | entier : phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |

### Tableau des unités

| Id | Pages PDF | Début | Fin | Mots | Audio (s) | Raison du regroupement |
|---|---|---|---|---:|---|---|
| 1:1 | 2 | بِسْمِ اللَّهِ الرَّحْمٰنِ الرَّحِيمِ … | … مُكَلَّفٍ جَهْلُهَا مِنَ الِاعْتِقَادِ | 27 | 27.28–47.55 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 1:2 | 2 | وَمَسَائِلَ فِقْهِيَّةٍ مِنَ الطَّهَارَةِ … | … الْقَلْبِ وَالْجَوَارِحِ كَاللِّسَانِ وَغَيْرِهِ. | 21 | 47.57–62.69 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 1:3 | 2 | الأَصْلُ لِبَعْضِ الْفُقَهَاءِ الْحَضْرَمِيِّينَ … | … يُؤَدِّي إِلَى خِلافِ الْمَوْضُوعِ. | 33 | 62.71–83.97 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 1:4 | 2 | وَقَدْ نَذْكُرُ مَا رَجَّحَهُ … | … الْكَافِلَ بِعِلْمِ الدِّينِ الضَّرُورِيِّ. | 27 | 83.99–103.24 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 2:1 | 3 | يَجِبُ عَلَى كَافَةِ الْمُكَلَّفِينَ … | … يَجِبُ عِلْمُهُ وَاعْتِقَادُهُ مُطْلَقًا | 23 | 106.16–121.09 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 2:2 | 3 | وَالنُّطْقُ بِهِ فِى الْحَالِ … | … مُحَمَّدًا رَسُولُ اللَّهِ ﷺ. | 24 | 121.11–135.5 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 2:3 | 3 | وَمَعْنَى أَشْهَدُ أَنْ لا … | … شَىْءٌ وَهُوَ السَّمِيعُ الْبَصِيرُ﴾ | 63 | 137.73–177.63 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 2:4 | 3 | فَهُوَ الْقَدِيمُ وَمَا سِوَاهُ … | … مِنَ الذَّرَّةِ إِلَى الْعَرْشِ | 22 | 177.65–191.41 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 2:5 | 3, 4 | وَمِنْ كُلِّ حَرَكَةٍ لِلْعِبَادِ … | … فِى الْوُجُودِ بِمَشِيئَةِ اللَّهِ | 25 | 191.43–207.43 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 2:6 | 4 | وَقُدْرَتِهِ بِتَقْدِيرِهِ وَعِلْمِهِ الأَزَلِيِّ … | … مِنْ خَالِقٍ غَيْرُ اللَّهِ﴾. | 30 | 207.45–226.25 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 2:7 | 4 | قَالَ النَّسَفِىُّ فَإِذَا ضَرَبَ … | … كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ﴾. | 33 | 226.27–249.52 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 2:8 | 4 | وَكَلامُهُ قَدِيمٌ كَسَائِرِ صِفَاتِهِ … | … لَفْظًا وَإِمَّا مَعْنًى كَثِيرًا | 40 | 249.54–279.33 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 2:9 | 4 | وَهِىَ الْوُجُودُ وَالْوَحْدَانِيَّةُ وَالْقِدَمُ … | … وَتَنَزُّهُهُ عَنِ الْمُشَابَهَةِ لِلْحَادِثِ. | 20 | 279.35–297.19 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 2:10 | 5 | فَلَمَّا كَانَتْ هَذِهِ الصِّفَاتُ … | … الصِّفَةِ يَسْتَلْزِمُ حُدُوثَ الذَّاتِ | 31 | 297.21–319.49 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 2:11 | 5 | وَمَعْنَى أَشْهَدُ أَنَّ مُحَمَّدًا … | … الْقُرَشِىَّ ﷺ عَبْدُ اللَّهِ | 26 | 319.51–335.85 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 2:12 | 5 | وَرَسُولُهُ إِلَى جَمِيعِ الْخَلْقِ … | … بِهِ وَبَلَّغَهُ عَنِ اللَّهِ | 29 | 335.87–355.99 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 2:13 | 5 | فَمِنْ ذَلِكَ عَذَابُ الْقَبْرِ … | … يُرَى الْمَخْلُوقُ وَالْخُلُودُ فِيهِمَا. | 40 | 356.01–387.51 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 2:14 | 5 | وَالإِيمَانُ بِمَلائِكَةِ اللَّهِ وَرُسُلِهِ … | … وَسَيِّدُ وَلَدِ ءَادَمَ أَجْمَعِينَ. | 16 | 387.53–401.97 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 2:15 | 6 | وَيَجِبُ اعْتِقَادُ أَنَّ كُلَّ … | … وَالْخِيَانَةُ وَالرَّذَالَةُ وَالسَّفَاهَةُ وَالْبَلادَةُ | 22 | 402.07–418.45 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 2:16 | 6 | وَتَجِبُ لَهُمُ الْعِصْمَةُ مِنَ … | … يَقْتَدِىَ بِهِمْ فِيهَا غَيْرُهُمْ. | 28 | 418.47–436.81 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 2:17 | 6 | فَمِنْ هُنَا يُعْلَمُ أَنَّ … | … مَنْ نُبِّئَ مِنْ ذُرِّيَّتِهِمْ. | 28 | 436.83–454.66 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 3:1 | 7 | يَجِبُ عَلَى كُلِّ مُسْلِمٍ … | … أَلْفَاظٌ تُخْرِجُهُمْ عَنِ الإِسْلامِ | 43 | 455.44–483.57 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 3:2 | 7 | وَلا يَرَوْنَ ذَلِكَ ذَنْبًا … | … جَهَنَّمَ وَهُوَ خَاصٌّ بِالْكُفَّارِ. | 38 | 483.59–510.07 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 3:3 | 7 | وَالْحَدِيثُ رَوَاهُ التِّرْمِذِىُّ وَحَسَّنَهُ … | … يَقُولُ كِتَابُ فِقْهِ السُّنَّةِ. | 35 | 510.09–531.67 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 3:4 | 7 | وَكَذَلِكَ لا يُشْتَرَطُ فِى … | … فَقَالَ لا مُتَعَمِّدًا كَفَرَ» | 34 | 531.69–552.91 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 3:5 | 7 | وَمَعْنَى مُتَعَمِّدًا أَىْ قَالَهَا … | … غَيْرُهُ مِنْ حَنَفِيَّةٍ وَغَيْرِهِمْ. | 14 | 552.93–562.15 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 3:6 | 8 | وَالرِّدَّةُ ثَلاثَةُ أَقْسَامٍ كَمَا … | … وَكُلٌّ يَتَشَعَّبُ شُعَبًا كَثِيرَةً. | 18 | 562.17–577.29 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 3:7 | 8 | فَمِنَ الأَوَّلِ الشَّكُّ فِى … | … أَوِ اعْتِقَادُ قِدَمِ الْعَالَمِ | 32 | 577.31–594.41 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 3:8 | 8 | وَأَزَلِيَّتِهِ بِجِنْسِهِ وَتَرْكِيبِهِ أَوْ … | … لا يَخْفَى عَلَيْهِ كَالزِّنَى | 38 | 594.43–618.91 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 3:9 | 8 | وَاللِّوَاطِ وَالْقَتْلِ وَالسَّرِقَةِ وَالْغَصْبِ … | … سَجْدَةٍ مِنْهَا وَالزَّكَاةِ وَالصَّوْمِ | 24 | 619.01–635.8 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 3:10 | 8 | وَالْحَجِّ وَالْوُضُوءِ أَوْ إِيجَابُ … | … اللَّهُ عَنْهُ أَوْ رِسَالَةَ | 47 | 635.82–660.88 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 3:11 | 8, 9 | وَاحِدٍ مِنَ الرُّسُلِ الْمُجْمَعِ … | … بَعْدَ نَبِيِّنَا مُحَمَّدٍ ﷺ. | 42 | 660.9–688.62 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 3:12 | 9 | وَالْقِسْمُ الثَّانِى الأَفْعَالُ كَسُجُودٍ … | … فَإِنَّهُ يَحْرُمُ فِى شَرْعِنَا | 24 | 688.67–705.17 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 3:13 | 9 | وَكَانَ جَائِزًا فِى شَرْعِ … | … السِّحْرَ لِلشَّيْطَانِ كُفْرٌ مُطْلَقٌ. | 34 | 705.19–726.79 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 3:14 | 9 | وَالْقِسْمُ الثَّالِثُ الأَقْوَالُ وَهِىَ … | … لا عَلَى قَصْدِ التَّشْبِيهِ | 44 | 726.81–751.49 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 3:15 | 9 | وَكَالسُّخْرِيَةِ بِاسْمٍ مِنْ أَسْمَائِهِ … | … نِسْبَةُ ذَلِكَ إِلَيْهِ سُبْحَانَهُ | 17 | 751.51–761.65 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 3:16 | 9, 10 | وَكَأَنْ يَقُولَ لَوْ أَمَرَنِى … | … مُظْهِرًا لِلْعِنَادِ فِى الْكُلِّ | 31 | 761.67–778.9 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 3:17 | 10 | وَكَأَنْ يَقُولَ لَوْ ءَاخَذَنِى … | … قَالَ لا أَفْعَلُ كَذَا | 40 | 778.92–800.41 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 3:18 | 10 | وَإِنْ كَانَ سُنَّةً بِقَصْدِ … | … عَالِمٍ مُرِيدًا الِاسْتِغْرَاقَ الشَّامِلَ | 35 | 800.43–820.41 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 3:19 | 10 | فَالَّذِى يَقُولُ لَعْنَةُ اللَّهِ … | … هَذَا الصِّنْفِ فَلا يَكْفُرُ | 41 | 820.51–842.33 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 3:20 | 10 | وَأَمَّا إِذَا قَالَ هَذِهِ … | … أَرَادَ لَعْنَ عُلَمَاءَ زَمَانِهِ | 38 | 842.67–864.27 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 3:21 | 10 | وَكَانَتْ هُنَاكَ قَرِينَةٌ تَدُلُّ … | … لا يَخْلُو مِنَ الْمَعْصِيَةِ | 22 | 864.29–876.7 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 3:22 | 10 | أَوْ قَالَ أَنَا بَرِىءٌ … | … بِحُكْمِ اللَّهِ أَوْ قَالَ | 28 | 876.72–889.6 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 3:23 | 10, 11 | وَقَدْ مَلأَ وِعَاءً ﴿وَكَأْسًا … | … الْكُلِّ بِمَعْنَى هَذِهِ الآيَاتِ | 37 | 889.62–914.91 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 3:24 | 11 | وَكَذَا كُلُّ مَوْضِعٍ اسْتُعْمِلَ … | … حَجَرٍ لا تَبْعُدُ حُرْمَتُهُ | 24 | 914.93–928.37 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 3:25 | 11 | وَكَذَا يَكْفُرُ مَنْ شَتَمَ … | … قَالَ لِمُسْلِمٍ أَنَا عَدُوُّكَ | 31 | 928.39–945.85 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 3:26 | 11 | وَعَدُوُّ نَبِيِّكَ أَوْ لِشَرِيفٍ … | … كَالْفَقِيهِ الْحَنَفِىِّ بَدْرِ الرَّشِيدِ | 29 | 945.87–964.37 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 3:27 | 11 | وَالْقَاضِى عِيَاضٍ الْمَالِكِىِّ رَحِمَهُمَا … | … يَعْرِفِ الشَّرَّ يَقَعُ فِيهِ. | 17 | 964.39–975.79 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 3:28 | 11 | وَالْقَاعِدَةُ أَنَّ كُلَّ عَقْدٍ … | … جَهْدَهُ عَلَى أَىِّ حَالٍ. | 40 | 975.81–999.74 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 4:1 | 12 | يَجِبُ عَلَى مَنْ وَقَعَتْ … | … أَنْ لا يَعُودَ لِمِثْلِهِ | 30 | 1001.46–1018.29 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 4:2 | 12 | فَإِنْ لَمْ يَرْجِعْ عَنْ … | … عَلَيْهِ الرُّجُوعَ إِلَى الإِسْلامِ. | 26 | 1018.31–1033.23 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 4:3 | 12 | وَيَعْتَمِدُ الْخَلِيفَةُ فِى ذَلِكَ … | … «مَنْ بَدَّلَ دِينَهُ فَاقْتُلُوهُ». | 18 | 1033.25–1045.57 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 4:4 | 12 | وَيَبْطُلُ بِهَا صَوْمُهُ وَتَيَمُّمُهُ … | … مُسْلِمَةٍ وَغَيْرِهَا وَتَحْرُمُ ذَبِيحَتُهُ | 25 | 1045.59–1062.13 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 4:5 | 12 | وَلا يَرِثُ وَلا يُورَثُ … | … مَقَابِرِ الْمُسْلِمِينَ وَمَالُهُ فَىْءٌ. | 18 | 1062.15–1073.5 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 5:1 | 13 | يَجِبُ عَلَى كُلِّ مُكَلَّفٍ … | … بِأَرْكَانِهِ وَشُرُوطِهِ وَيَجْتَنِبَ مُبْطِلاتِهِ | 25 | 1074.51–1090.21 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 5:2 | 13 | وَيَجِبُ عَلَيْهِ أَمْرُ مَنْ … | … بِالإِتْيَانِ بِهَا عَلَى وَجْهِهَا | 18 | 1090.23–1099.73 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 5:3 | 13 | وَيَجِبُ عَلَيْهِ قَهْرُهُ عَلَى … | … يَلْزَمُ الإِنْسَانَ عِنْدَ الْعَجْزِ. | 28 | 1099.75–1115.55 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 5:4 | 13 | وَيَجِبُ تَرْكُ جَمِيعِ الْمُحَرَّمَاتِ … | … تَارِكَهُ بِالثَّوَابِ وَعَكْسُهُ الْوَاجِبُ. | 30 | 1115.57–1137.64 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 6:1 | 14 | فَمِنَ الْوَاجِبِ خَمْسُ صَلَوَاتٍ … | … إِلَى مَغِيبِ الشَّمْسِ وَالْمَغْرِبُ | 31 | 1141.0–1160.81 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 6:2 | 14 | وَوَقْتُهَا مِنْ بَعْدِ مَغِيبِ … | … الْعِشَاءِ إِلَى طُلُوعِ الشَّمْسِ. | 28 | 1160.83–1176.69 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 6:3 | 14 | فَتَجِبُ هَذِهِ الْفُرُوضُ فِى … | … وَتَأْخِيرُهَا عَنْهُ لِغَيْرِ عُذْرٍ | 19 | 1176.71–1189.13 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 6:4 | 14 | فَإِنْ طَرَأَ مَانِعٌ كَحَيْضٍ … | … الْوَقْتِ قَدْرُ تَكْبِيرَةٍ لَزِمَتْهُ | 25 | 1189.15–1204.69 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 6:5 | 14 | وَكَذَا مَا قَبْلَهَا إِنْ … | … قَدْرِ تَكْبِيرَةٍ قَبْلَ الْفَجْرِ. | 25 | 1204.71–1220.02 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 7:1 | 15 | يَجِبُ عَلَى وَلِىِّ الصَّبِىِّ … | … عَشْرِ سِنِينَ كَصَوْمٍ أَطَاقَاهُ | 22 | 1220.87–1236.61 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 7:2 | 15 | وَيَجِبُ عَلَيْهِ أَيْضًا تَعْلِيمُهُمَا … | … يَتُبْ وَحُكْمُهُ أَنَّهُ مُسْلِمٌ. | 28 | 1236.63–1255.41 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 7:3 | 15 | وَيَجِبُ عَلَى كُلِّ مُسْلِمٍ … | … قَدَرَ عَلَيْهِ مِنْ غَيْرِهِمْ. | 13 | 1255.43–1263.14 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 8:1 | 16 | وَمِنْ شُرُوطِ الصَّلاةِ الْوُضُوءُ … | … الْوَجْهِ بِقَلِيلٍ عِنْدَ مَالِكٍ. | 33 | 1264.59–1285.29 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 8:2 | 16 | الثَّانِى غَسْلُ الْوَجْهِ جَمِيعِهِ … | … الرَّجُلِ وَعَارِضَيْهِ إِذَا كَثُفَا. | 23 | 1285.31–1300.07 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 8:3 | 16 | الثَّالِثُ غَسْلُ الْيَدَيْنِ مَعَ … | … شُرُوطُهُ. السَّادِسُ التَّرْتِيبُ هَكَذَا. | 30 | 1300.09–1322.0 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 9:1 | 17 | وَيَنْقُضُ الْوُضُوءَ مَا خَرَجَ … | … نَوْمُ قَاعِدٍ مُمَكِّنٍ مَقْعَدَتَهُ. | 30 | 1323.07–1343.3 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 10:1 | 18 | يَجِبُ الِاسْتِنْجَاءُ مِنْ كُلِّ … | … إِلَى أَنْ يَنْقَى الْمَحَلُّ | 25 | 1344.23–1359.11 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 10:2 | 18 | وَإِنْ بَقِىَ الأَثَرُ بِقَالِعٍ … | … أَوْ جَفَّ وَجَبَ الْمَاءُ. | 31 | 1359.13–1378.26 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 11:1 | 18 | وَمِنْ شُرُوطِ الصَّلاةِ الطَّهَارَةُ … | … وَالْجِمَاعُ وَالْحَيْضُ وَالنِّفَاسُ وَالْوِلادَةُ. | 24 | 1379.27–1394.59 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 11:2 | 18 | وَفُرُوضُ الْغُسْلِ اثْنَانِ نِيَّةُ … | … وَشَعَرًا وَإِنْ كَثُفَ بِالْمَاءِ. | 17 | 1394.61–1405.74 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 12:1 | 19 | شُرُوطُ الطَّهَارَةِ الإِسْلامُ وَالتَّمْيِيزُ … | … امْتِزَاجِ شَىْءٍ طَاهِرٍ كَالْحَلِيبِ | 30 | 1406.81–1426.64 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 12:2 | 19 | وَالْحِبْرِ وَشِبْهِ ذَلِكَ فَلَوْ … | … يَشُقُّ صَوْنُ الْمَاءِ عَنْهُ | 36 | 1426.66–1446.33 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 12:3 | 19 | فَلا يَضُرُّ فَيَبْقَى مُطَهِّرًا … | … بِنَجِسٍ وَلَوْ تَغَيُّرًا يَسِيرًا. | 11 | 1446.43–1454.29 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 12:4 | 19 | وَإِنْ كَانَ الْمَاءُ دُونَ … | … حَدَثٍ أَوْ إِزَالَةِ نَجِسٍ. | 23 | 1454.31–1466.83 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 12:5 | 19 | وَمَنْ لَمْ يَجِدِ الْمَاءَ … | … النَّقْلِ وَمَسْحِ أَوَّلِ الْوَجْهِ. | 37 | 1466.85–1490.2 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 13:1 | 20 | وَمَنِ انْتَقَضَ وُضُوؤُهُ حَرُمَ … | … مِنْ ذَلِكَ الصَّبِىُّ لِلدِّرَاسَةِ | 15 | 1491.06–1501.87 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 13:2 | 20 | وَيَحْرُمُ عَلَى الْجُنُبِ هَذِهِ … | … لا يَحْرُمُ إِلَّا الْجِمَاعُ. | 32 | 1501.97–1522.74 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 14:1 | 20 | وَمِنْ شُرُوطِ الصَّلاةِ الطَّهَارَةُ … | … مَعْفُوًّا عَنْهُ كَدَمِ جُرْحِهِ. | 35 | 1523.47–1546.34 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 14:2 | 21 | وَيَجِبُ إِزَالَةُ نَجِسٍ لَمْ … | … وَلا طَعْمٌ وَلا رِيحٌ. | 30 | 1546.36–1564.05 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 14:3 | 21 | وَالْكَلْبِيَّةِ بِغَسْلِهَا سَبْعًا إِحْدَاهُنَّ … | … الْمَاءِ إِنْ كَانَ قَلِيلًا. | 18 | 1564.15–1579.1 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 15:1 | 21 | وَمِنْ شُرُوطِ الصَّلاةِ اسْتِقْبَالُ … | … وَيَرُدُّ الْجَوَابَ وَالْعِلْمُ بِفَرْضِيَّتِهَا | 25 | 1580.01–1596.74 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 15:2 | 21 | وَأَنْ لا يَعْتَقِدَ فَرْضًا … | … كُلِّ الْجَوَانِبِ لا الأَسْفَلِ. | 31 | 1596.76–1614.8 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 16:1 | 22 | وَتَبْطُلُ الصَّلاةُ بِالْكَلامِ وَلَوْ … | … قَدْرَ رَكْعَةٍ مِنَ الزَّمَنِ | 24 | 1616.31–1630.81 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 16:2 | 22 | وَقِيلَ ثَلاثُ حَرَكَاتٍ مُتَوَالِيَاتٍ … | … وَقَلَّ وَبِنِيَّةِ قَطْعِ الصَّلاةِ | 24 | 1630.83–1650.57 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 16:3 | 22 | وَبِتَعْلِيقِ قَطْعِهَا عَلَى شَىْءٍ … | … أَوْ يَطُولَ زَمَنُ الشَّكِّ. | 18 | 1650.59–1661.02 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 17:1 | 22 | وَشُرِطَ مَعَ مَا مَرَّ … | … صَحَّتْ صَلاتُهُ بِلا ثَوَابٍ. | 36 | 1662.31–1684.96 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 18:1 | 23 | أَرْكَانُ الصَّلاةِ الأَوَّلُ النِّيَّةُ … | … رُكْنٍ قَوْلِىٍّ اللَّهُ أَكْبَرُ. | 25 | 1685.87–1703.91 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 18:2 | 23 | الثَّالِثُ الْقِيَامُ فِى الْفَرْضِ … | … لَمْ يُخِلَّ وَلا يُبْطِلْ. | 31 | 1703.93–1727.35 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 18:3 | 23 | الْخَامِسُ الرُّكُوعُ بِأَنْ يَنْحَنِىَ … | … عَظْمٍ مَكَانَهُ دَفْعَةً وَاحِدَةً. | 21 | 1727.75–1743.17 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 18:4 | 23 | السَّابِعُ الِاعْتِدَالُ بِأَنْ يَنْتَصِبَ … | … قَائِمًا الثَّامِنُ الطُّمَأْنِينَةُ فِيهِ. | 10 | 1743.19–1751.68 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 18:5 | 23, 24 | التَّاسِعُ السُّجُودُ مَرَّتَيْنِ بِأَنْ … | … وَيَضَعَ شَيْئًا مِنْ رُكْبَتَيْهِ | 25 | 1751.82–1769.35 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 18:6 | 24 | وَمِنْ بُطُونِ كَفَّيْهِ وَمِنْ … | … دُبُرِهِ صَحَّتِ الصَّلاةُ عِنْدَهُمْ. | 26 | 1769.37–1784.59 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 18:7 | 24 | الْعَاشِرُ الطُّمَأْنِينَةُ فِيهِ الْحَادِى … | … الثَّانِى عَشَرَ الطُّمَأْنِينَةُ فِيهِ. | 12 | 1784.61–1795.94 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 18:8 | 24 | الثَّالِثَ عَشَرَ الْجُلُوسُ لِلتَّشَهُّدِ … | … السَّلامُ عَلَيْكَ أَيُّهَا النَّبِىُّ | 26 | 1795.96–1816.03 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 18:9 | 24 | وَرَحْمَةُ اللَّهُ وَبَرَكَاتُهُ السَّلامُ … | … رَسُولُ اللَّهِ أَوْ أَقَلَّهُ | 22 | 1816.05–1831.41 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 18:10 | 24 | وَهُوَ التَّحِيَّاتُ لِلَّهِ سَلامٌ … | … وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ. | 26 | 1831.51–1848.71 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 18:11 | 24, 25 | الْخَامِسَ عَشَرَ الصَّلاةُ عَلَى … | … عَلَيْكُمْ. السَّابِعَ عَشَرَ التَّرْتِيبُ. | 20 | 1848.73–1867.61 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 18:12 | 25 | فَإِنْ تَعَمَّدَ تَرْكَهُ كَأَنْ … | … مَا فَعَلَهُ بَيْنَ ذَلِكَ. | 49 | 1867.63–1893.98 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 19:1 | 25 | الْجَمَاعَةُ عَلَى الذُّكُورِ الأَحْرَارِ … | … تَجِبُ عَلَى أَهْلِ الْخِيَامِ. | 31 | 1895.07–1914.47 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 19:2 | 25 | وَتَجِبُ عَلَى مَنْ نَوَى … | … طَرَفٍ يَلِيهِ مِنْ بَلَدِهَا. | 24 | 1914.49–1928.43 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 19:3 | 25, 26 | وَشَرْطُهَا وَقْتُ الظُّهْرِ وَخُطْبَتَانِ … | … ذَلِكَ صَحَّتِ السَّابِقَةُ وَالْمَسْبُوقَةُ. | 41 | 1928.45–1958.19 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 19:4 | 26 | وَأَرْكَانُ الْخُطْبَتَيْنِ حَمْدُ اللَّهِ … | … وَالدُّعَاءُ لِلْمُؤْمِنِينَ فِى الثَّانِيَةِ. | 19 | 1958.21–1974.35 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 19:5 | 26 | وَشُرُوطُهُمَا الطَّهَارَةُ عَنِ الْحَدَثَيْنِ … | … الصَّلاةِ وَأَنْ تَكُونَا بِالْعَرَبِيَّةِ. | 24 | 1974.37–1994.22 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 20:1 | 27 | وَيَجِبُ عَلَى كُلِّ مَنْ … | … فِى غَيْرِهِ إِلَّا التَّأْمِينَ. | 28 | 1994.93–2009.73 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 20:2 | 27 | وَيَحْرُمُ تَقَدُّمُهُ بِرُكْنٍ فِعْلِىٍّ … | … طَوِيلٍ وَقَصِيرٍ بِلا عُذْرٍ | 18 | 2009.75–2023.73 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 20:3 | 27 | وَكَذَا التَّأَخُّرُ عَنْهُ بِهِمَا … | … فَجَلَسَ لِلتَّشَهُّدِ أَوْ قَامَ | 27 | 2023.75–2041.33 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 20:4 | 27 | تَرَكَ إِتْمَامَ الْفَاتِحَةِ وَوَافَقَ … | … مَشَى عَلَى تَرْتِيبِ نَفْسِهِ. | 21 | 2041.35–2054.01 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 20:5 | 27 | وَأَنْ يَعْلَمَ بِانْتِقَالاتِ إِمَامِهِ … | … وَأَنْ يَتَوَافَقَ نَظْمُ صَلاتَيْهِمَا | 25 | 2054.03–2071.97 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 20:6 | 27, 28 | فَلا تَصِحُّ قُدْوَةُ مُصَلِّى … | … الأَوَّلِ أَىْ جُلُوسِهِ فِعْلًا | 22 | 2071.99–2085.62 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 20:7 | 27, 28 | وَتَرْكًا أَىْ إِنْ جَلَسَ … | … وَطُولِ الِانْتِظَارِ فِى غَيْرِهَا. | 24 | 2085.64–2099.81 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 20:8 | 27, 28 | أَىْ قَبْلَ أَنْ يُتَابِعَهُ … | … قَصْدٍ لَمْ تَبْطُلْ صَلاتُهُ | 27 | 2099.83–2117.21 | ⚠ phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; coupe sans ponctuation, avant un « و » de liste ; contient du texte repris de l'audio |
| 20:9 | 27, 28 | وَحَاصِلُ الْمَسْأَلَةِ أَنَّهُ إِذَا … | … فِى الأَفْعَالِ فَلا تَفْسُدُ | 23 | 2117.23–2130.85 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 20:10 | 28 | وَيَجِبُ عَلَى الإِمَامِ نِيَّةُ … | … لا تَفُوتَهُ فَضِيلَةُ الْجَمَاعَةِ | 45 | 2130.87–2160.28 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 21:1 | 28 | غَسْلُ الْمَيِّتِ وَتَكْفِينُهُ وَالصَّلاةُ … | … وَدَفْنٌ وَلا يُصَلَّى عَلَيْهِمَا. | 25 | 2161.41–2179.85 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 21:2 | 28 | وَمَنْ مَاتَ فِى قِتَالِ … | … يُغَسَّلُ وَلا يُصَلَّى عَلَيْهِ. | 20 | 2179.87–2191.92 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 21:3 | 28, 29 | وَأَقَلُّ الْغُسْلِ إِزَالَةُ النَّجَاسَةِ … | … دَيْنِهِ وَلَمْ يُوصِ بِتَرْكِهَا. | 29 | 2191.94–2212.39 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 21:4 | 29 | وَأَقَلُّ الصَّلاةِ عَلَيْهِ أَنْ … | … قَدَرَ ثُمَّ يَقْرَأَ الْفَاتِحَةَ | 24 | 2212.49–2228.87 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 21:5 | 29 | ثُمَّ يَقُولَ اللَّهُ أَكْبَر … | … اللَّهُ أَكْبَر السَّلامُ عَلَيْكُمْ. | 24 | 2228.89–2245.73 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 21:6 | 29 | وَلا بُدَّ فِيهَا مِنْ … | … يَجُوزُ الدَّفْنُ فِى الْفِسْقِيَّةِ. | 32 | 2246.09–2268.32 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 22:1 | 30 | وَتَجِبُ الزَّكَاةُ فِى الإِبِلِ … | … مِنْهُمَا وَأَمْوَالِ التِّجَارَةِ وَالْفِطْرِ. | 20 | 2270.63–2287.31 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 22:2 | 30 | وَأَوَّلُ نِصَابِ الإِبِلِ خَمْسٌ … | … مِنَ الْحَولِ بَعْدَ ذَلِكَ | 18 | 2287.33–2299.17 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 22:3 | 30 | وَلا بُدَّ مِنَ السَّوْمِ … | … الْحَرْثِ لا زَكَاةَ فِيهَا. | 34 | 2299.19–2316.47 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 22:4 | 30 | فَيَجِبُ فِى كُلِّ خَمْسٍ … | … ذَلِكَ فَفِى ذَلِكَ الزَّائِدِ. | 33 | 2316.49–2335.67 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 22:5 | 30 | وَيَجِبُ عَلَيْهِ أَنْ يَتَعَلَّمَ … | … اللَّهُ تَعَالَى عَلَيْهِ فِيهَا. | 10 | 2335.69–2341.55 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 22:6 | 31 | وَأَمَّا التَّمْرُ وَالزَّبِيبُ وَالزُّرُوعُ … | … بِجِنْسٍ كَالشَّعِيرِ مَعَ الْحِنْطَةِ. | 34 | 2341.57–2366.11 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 22:7 | 31 | وَتَجِبُ الزَّكَاةُ بِبُدُوِّ الصَّلاحِ … | … النِّصَابِ إِلَّا أَنْ يَتَطَوَّعَ. | 43 | 2366.13–2393.0 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 22:8 | 31 | وَأَمَّا الذَّهَبُ فَنِصَابُهُ عِشْرُونَ … | … حَالًا وَفِى الرِّكَازِ الْخُمُسُ. | 32 | 2393.02–2413.74 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 22:9 | 31 | وَأَمَّا زَكَاةُ التِّجَارَةِ فَنِصَابُهَا … | … فِيهَا رُبْعُ عُشْرِ الْقِيمَةِ. | 24 | 2413.76–2429.44 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 22:10 | 31 | وَمَالُ الْخَلِيطَيْنِ أَوِ الْخُلَطَاءِ … | … إِذَا كَمَلَتْ شُرُوطُ الْخُلْطَةِ. | 13 | 2429.46–2438.14 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 22:11 | 32 | وَزَكَاةُ الْفِطْرِ تَجِبُ بِإِدْرَاكِ … | … نَفَقَتُهُمْ يَوْمَ الْعِيدِ وَلَيْلَتَهُ. | 43 | 2438.16–2464.1 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 22:12 | 32 | وَتَجِبُ النِّيَّةُ فِى جَمِيعِ … | … قُلُوبُهُمْ وَفِى الرِّقَابِ وَالْغَارِمِينَ | 31 | 2464.12–2485.92 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 22:13 | 32 | وَهُمُ الْمَدِينُونَ الْعَاجِزُونَ عَنِ … | … وَلا يُجْزِئُ صَرْفُهَا لِغَيْرِهِمْ. | 33 | 2485.94–2506.99 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 23:1 | 33 | يَجِبُ صَوْمُ شَهْرِ رَمَضَانَ … | … لَمْ يَشُقَّ عَلَيْهِ الصَّوْمُ. | 26 | 2509.18–2525.42 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 23:2 | 33 | وَلِمَرِيضٍ وَحَامِلٍ وَمُرْضِعٍ يَشُقُّ … | … الْفِطْرُ وَيَجِبُ عَلَيْهِمُ الْقَضَاءُ. | 12 | 2525.44–2534.22 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 23:3 | 33 | وَيَجِبُ التَّبْيِيتُ وَالتَّعْيِينُ فِى … | … يُغْمَى عَلَيْهِ كُلَّ الْيَوْمِ. | 40 | 2534.24–2558.92 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 23:4 | 33 | وَلا يَصِحُّ صَوْمُ الْعِيدَيْنِ … | … اعْتَادَ صَوْمَ الِاثْنَيْنِ وَالْخَمِيسِ | 29 | 2558.94–2576.38 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 23:5 | 33 | وَمَنْ أَفْسَدَ صَوْمَ يَوْمٍ … | … يَسْتَطِعْ فَصِيَامُ شَهْرَيْنِ مُتَتَابِعَيْنِ | 27 | 2576.4–2594.58 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 23:6 | 33 | فَإِنْ لَمْ يَسْتَطِعْ فَإِطْعَامُ … | … هُوَ مِلْءُ الْكَفَّيْنِ الْمُعْتَدِلَتَيْنِ. | 26 | 2594.6–2610.63 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 24:1 | 34 | يَجِبُ الْحَجُّ وَالْعُمْرَةُ فِى … | … مُؤْنَتُهُ مُدَّةَ ذَهَابِهِ وَإِيَّابِهِ. | 30 | 2613.4–2633.86 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 24:2 | 34 | وَأَرْكَانُ الْحَجِّ سِتَّةٌ الأَوَّلُ … | … إِلَى فَجْرِ لَيْلَةِ الْعِيدِ. | 27 | 2633.88–2650.68 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 24:3 | 34 | الثَّالِثُ الطَّوَافُ بِالْبَيْتِ. الرَّابِعُ … | … التَّرْتِيبُ فِى مُعْظَمِ الأَرْكَانِ. | 23 | 2650.7–2668.74 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 24:4 | 34, 35 | وَهِىَ إِلَّا الْوُقُوفَ أَرْكَانٌ … | … لا يَسْتَقْبِلُهَا وَلا يَسْتَدْبِرُهَا. | 40 | 2668.76–2695.14 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 24:5 | 35 | وَحَرُمَ عَلَى مَنْ أَحْرَمَ … | … وَصَيْدُ مَأْكُولٍ بَرِّىٍّ وَحْشِىٍّ. | 26 | 2695.16–2713.76 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 24:6 | 35 | وَعَلَى الرَّجُلِ سَتْرُ رَأْسِهِ … | … الْمُحْرِمَةِ سَتْرُ وَجْهِهَا وَقُفَّازٌ. | 16 | 2713.78–2724.8 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 24:7 | 35 | فَمَنْ فَعَلَ شَيْئًا مِنْ … | … يَقْضِى فِى السَّنَةِ الْقَابِلَةِ. | 30 | 2725.38–2745.26 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 24:8 | 35 | وَيَجِبُ أَنْ يُحْرِمَ مِنَ … | … الْمَدِينَةِ وَمَنْ يَمُرُّ بِطَرِيقِهِمْ. | 25 | 2745.28–2763.1 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 24:9 | 35 | وَفِى الْحَجِّ مَبِيتُ مُزْدَلِفَةَ … | … عَلَى قَوْلٍ فِى الْمَذْهَبِ. | 29 | 2763.12–2781.67 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 24:10 | 36 | وَهَذِهِ الأُمُورُ السِّتَّةُ مَنْ … | … دَمٌ أَىْ ذَبْحُ شَاةٍ. | 33 | 2781.69–2800.88 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 24:11 | 36 | وَيَحْرُمُ صَيْدُ الْحَرَمَيْنِ وَنَبَاتُهُمَا … | … جَبَلِ عَيْرٍ وَجَبَلِ ثَوْرٍ. | 27 | 2800.98–2820.59 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 25:1 | 37 | يَجِبُ عَلَى كُلِّ مُسْلِمٍ … | … مِنْ مُرَاعَاةِ مَا تَعَبَّدَنَا. | 32 | 2822.72–2840.66 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 25:2 | 37 | وَقَدْ أَحَلَّ الْبَيْعَ وَحَرَّمَ … | … فَلا بُدَّ مِنْ مُرَاعَاتِهَا. | 26 | 2840.68–2856.66 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 25:3 | 37 | فَعَلَى مَنْ أَرَادَ الْبَيْعَ … | … مَعَ النَّبِيِّينَ وَالصِّدِّيقِينَ وَالشُّهَدَاءِ» | 28 | 2856.68–2877.91 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 25:4 | 37 | وَمَا ذَاكَ إِلَّا لِأَجْلِ … | … اللَّهُ مَنْ تَعَدَّى الْحُدُودَ. | 26 | 2877.93–2893.88 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 25:5 | 38 | ثُمَّ إِنَّ بَقِيَّةَ الْعُقُودِ … | … مِنْ مُرَاعَاةِ شُرُوطِهَا وَأَرْكَانِهَا. | 20 | 2893.98–2909.84 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 25:6 | 38 | وَعَقْدُ النِّكَاحِ يَحْتَاجُ إِلَى … | … نَارًا وَقُودُهَا النَّاسُ وَالْحِجَارَةُ﴾ | 32 | 2909.86–2933.7 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 25:7 | 38 | قَالَ عَطَاءٌ رَضِىَ اللَّهُ … | … وَكَيْفَ تَنْكِحُ وَكَيْفَ تُطَلِّقُ». | 18 | 2933.72–2946.17 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 26:1 | 38 | يَحْرُمُ الرِّبَا فِعْلُهُ وَأَكْلُهُ … | … سِكَّةً أَمْ لا وَالْحُلِىُّ | 22 | 2948.26–2964.5 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 26:2 | 38 | وَالتِّبْرُ أَوْ بِغَيْرِ تَقَابُضٍ … | … الْجَانِبَيْنِ عَلَى الآخَرِ بِالْوَزْنِ. | 41 | 2964.52–2991.38 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 26:3 | 38, 39 | وَالْمَطْعُومَاتُ بَعْضُهَا بِبَعْضٍ كَذَلِكَ … | … الْحُلُولِ وَالتَّقَابُضِ قَبْلَ الِافْتِرَاقِ | 45 | 2991.4–3021.92 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 27:1 | 39 | وَيَحْرُمُ بَيْعُ مَا لَمْ … | … قَوْلٍ لِلشَّافِعِىِّ مَعَ الْوَصْفِ. | 41 | 3021.94–3047.08 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 27:2 | 39 | وَلا يَصِحُّ بَيْعُ غَيْرِ … | … فِى مَذْهَبِ الإِمَامِ أَحْمَدَ. | 20 | 3047.1–3058.52 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 27:3 | 39 | أَوْ لا قُدْرَةَ عَلَى … | … الْمِلْكِ كَالْحُرِّ وَالأَرْضِ الْمَوَاتِ. | 28 | 3058.54–3074.74 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 27:4 | 39, 40 | وَبَيْعُ الْمَجْهُولِ وَالنَّجِسِ كَالدَّمِ … | … الْمَعِيبِ بِلا إِظْهَارٍ لِعَيْبِهِ. | 44 | 3074.76–3103.62 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 27:5 | 40 | فَائِدَةٌ. لا تَصِحُّ قِسْمَةُ … | … وَوَصَايَاهُ وَتُخْرَجْ أُجْرَةُ حَجَّةٍ | 18 | 3103.64–3115.27 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 27:6 | 40 | وَعُمْرَةٍ إِنْ كَانَا عَلَيْهِ … | … يَأْذَنَ الْغَرِيمُ فِى بَيْعِهِ. | 31 | 3115.29–3135.6 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 27:7 | 40 | وَيَحْرُمُ أَنْ يُفَتِّرَ رَغْبَةَ … | … أَشَدُّ وَأَنْ يَشْتَرِىَ الطَّعَامَ | 24 | 3135.62–3151.35 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 27:8 | 40 | وَقْتَ الْغَلاءِ وَالْحَاجَةِ لِيَحْبِسَهُ … | … أَوْ يَخُونَ فِى الْكَيْلِ | 26 | 3151.37–3167.85 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 27:9 | 40 | وَالْوَزْنِ وَالذَّرْعِ وَالْعَدِّ أَوْ … | … تِلْكَ الْبِضَاعَةِ لِأَجْلِ الْقَرْضِ، | 23 | 3167.87–3182.12 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 27:10 | 40, 41 | وَأَنْ يُقْرِضَ الْحَائِكَ أَوْ … | … الْحَرَّاثِينَ إِلَى وَقْتِ الْحَصَادِ | 28 | 3182.22–3199.68 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 27:11 | 41 | ثُمَّ يَبِيعُونَ عَلَيْهِ طَعَامَهُمْ … | … خَارِجَةٌ عَنْ قَانُونِ الشَّرْعِ. | 23 | 3199.7–3215.3 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 27:12 | 41 | فَعَلَى مُرِيدِ رِضَا اللَّهِ … | … فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ. | 28 | 3215.32–3233.65 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 28:1 | 41 | يَجِبُ عَلَى الْمُوسِرِ نَفَقَةُ … | … مَرَضٍ مَانِعٍ مِنَ الْكَسْبِ. | 33 | 3234.6–3255.8 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 28:2 | 42 | وَيَجِبُ عَلَى الزَّوْجِ نَفَقَةُ … | … وَلا يَضْرِبَهُمْ بِغَيْرِ حَقٍّ. | 35 | 3255.82–3279.72 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 28:3 | 42 | وَيَجِبُ عَلَى الزَّوْجَةِ طَاعَتُهُ … | … مِنْ بَيْتِهِ إِلَّا بِإِذْنِهِ. | 21 | 3279.9–3292.19 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 29:1 | 42 | مِنَ الْوَاجِبَاتِ الْقَلْبِيَّةِ الإِيمَانُ … | … رَسُولِ اللَّهِ ﷺ وَالإِخْلاصُ | 19 | 3295.4–3307.64 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 29:2 | 42 | وَهُوَ الْعَمَلُ بِالطَّاعَةِ لِلَّهِ … | … الِاعْتِرَاضِ وَتَعْظِيمُ شَعَائِرِ اللَّهِ | 24 | 3307.66–3326.28 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 29:3 | 42 | وَالشُّكْرُ عَلَى نِعَمِ اللَّهِ … | … وَرَسُولِهِ وَالصَّحَابَةِ وَالآلِ وَالصَّالِحِينَ. | 37 | 3326.3–3353.73 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 30:1 | 43 | وَمِنْ مَعَاصِى الْقَلْبِ الرِّيَاءُ … | … ثَوَابَهَا وَالْعُجْبُ بِطَاعَةِ اللَّهِ | 17 | 3356.62–3368.44 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 30:2 | 43 | وَهُوَ شُهُودُ الْعِبَادَةِ صَادِرَةً … | … بِمُقْتَضَاهُ وَلَمْ يَكْرَهْهُ وَالْحَسَدُ | 40 | 3368.46–3396.46 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 30:3 | 43 | وَهُوَ كَرَاهِيَةُ النِّعْمَةِ لِلْمُسْلِمِ … | … أُعْطِكَ كَذَا يَوْمَ كَذَا | 21 | 3396.48–3412.2 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 30:4 | 43 | وَكَذَا وَالإِصْرَارُ عَلَى الذَّنْبِ … | … وَلَوْ بِكَافِرٍ كَأَنْ يُؤَمِّنَهُ | 22 | 3412.22–3428.8 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 30:5 | 43 | ثُمَّ يَقْتُلَهُ وَالْمَكْرُ وَبُغْضُ … | … أَوْ جَنَّةٍ أَوْ نَارٍ. | 33 | 3428.82–3452.03 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 31:1 | 44 | وَمِنْ مَعَاصِى الْبَطْنِ أَكْلُ … | … لِلرَّقِيقِ وَلِلإِمَامِ الزِّيَادَةُ تَعْزِيرًا | 25 | 3452.92–3474.3 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 31:2 | 44 | وَمِنْهَا أَكْلُ كُلِّ مُسْكِرٍ … | … بِغَيْرِ طِيبِ نَفْسٍ مِنْهُ. | 24 | 3474.32–3490.79 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 32:1 | 44 | وَمِنْ مَعَاصِى الْعَيْنِ النَّظَرُ … | … السُّرَّةِ وَالرُّكْبَةِ وَنَظَرُ الْعَوْرَاتِ. | 26 | 3491.42–3509.42 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 32:2 | 44 | وَيَحْرُمُ عَلَى الرَّجُلِ وَالْمَرْأَةِ … | … إِذَا كَانَ بِغَيْرِ شَهْوَةٍ. | 26 | 3509.44–3525.42 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 32:3 | 44 | وَيَحْرُمُ النَّظَرُ بِالِاسْتِحْقَارِ إِلَى … | … أَوْ شَىْءٍ أَخْفَاهُ كَذَلِكَ. | 15 | 3525.44–3536.27 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 33:1 | 45 | وَمِنْ مَعَاصِى اللِّسَانِ الْغِيبَةُ … | … وَلَوْ بَيْنَ الْبَهَائِمِ وَالْكَذِبُ | 28 | 3537.48–3557.16 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 33:2 | 45 | وَهُوَ الْكَلامُ بِخِلافِ الْوَاقِعِ … | … ثَمَانِينَ جَلْدَةً وَالرَّقِيقُ نِصْفَهَا | 39 | 3557.18–3586.92 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 33:3 | 45 | وَمِنْهَا سَبُّ الصَّحَابَةِ وَشَهَادَةُ … | … وَالدَّعْوَى الْبَاطِلَةُ وَالطَّلاقُ الْبِدْعِىُّ | 32 | 3586.94–3612.48 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 33:4 | 45 | وَهُوَ مَا كَانَ فِى … | … لَمْ يُطَلِّقْ بَعْدَهُ فَوْرًا | 30 | 3612.5–3631.28 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 33:5 | 45, 46 | وَهِىَ عِتْقُ رَقَبَةٍ مُؤْمِنَةٍ … | … سِتِّينَ مِسْكِينًا سِتِّينَ مُدًّا. | 17 | 3631.3–3643.86 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 33:6 | 46 | وَمِنْهَا اللَّحْنُ فِى الْقُرْءَانِ … | … وَالنَّذْرُ بِقَصْدِ حِرْمَانِ الْوَارِثِ | 22 | 3643.96–3659.49 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 33:7 | 46 | وَتَرْكُ الْوَصِيَّةِ بِدَيْنٍ أَوْ … | … وَالْفَتْوَى بِغَيْرِ عِلْمٍ وَتَعْلِيمُ | 36 | 3659.51–3684.3 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 33:8 | 46 | وَتَعَلُّمُ عِلْمٍ مُضِرٍّ لِغَيْرِ … | … أَوْ يُفَتِّرُ عَنْ وَاجِبٍ | 21 | 3684.32–3699.64 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 33:9 | 46 | وَكُلُّ كَلامٍ يَقْدَحُ فِى … | … شَىْءٍ مِنْ شَعَائِرِ اللَّهِ | 21 | 3699.66–3710.9 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 33:10 | 46 | وَمِنْهَا التَّزْمِيرُ وَالسُّكُوتُ عَنِ … | … عَلَى مُسْلِمٍ اسْتِحْقَارًا لَهُ | 25 | 3710.92–3728.76 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 33:11 | 46 | وَكَتْمُ الشَّهَادَةِ وَتَرْكُ رَدِّ … | … وَمَنْ لا تَحِلُّ قُبْلَتُهُ. | 23 | 3728.78–3746.85 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 34:1 | 47 | وَمِنْ مَعَاصِى الأُذُنِ الِاسْتِمَاعُ … | … وَلَزِمَهُ الإِنْكَارُ إِنْ قَدَرَ. | 36 | 3747.6–3774.33 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 35:1 | 47 | وَمِنْ مَعَاصِى الْيَدَيْنِ التَّطْفِيفُ … | … إِنْ عَادَ فَرِجْلُهُ الْيُسْرَى | 26 | 3775.3–3791.94 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 35:2 | 47 | ثُمَّ يَدُهُ الْيُسْرَى ثُمَّ … | … عَلَى الدِّيَةِ أَوْ مَجَّانًا، | 37 | 3791.96–3818.48 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 35:3 | 47, 48 | وَفِى الْخَطَإِ وَشِبْهِهِ الدِّيَةُ … | … صِفَاتُ الدِّيَةِ بِحَسَبِ الْقَتْلِ. | 22 | 3818.5–3833.62 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 35:4 | 48 | وَمِنْهَا الضَّرْبُ بِغَيْرِ حَقٍّ … | … حَتَّى لَعِبُ الصِّبْيَانِ بِالْجَوْزِ | 28 | 3833.64–3856.83 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 35:5 | 48 | وَالْكِعَابِ وَاللَّعِبُ بِآلاتِ اللَّهْوِ … | … بَعْضِهَا بَعْدَ الْوُجُوبِ وَالتَّمَكُّنِ، | 32 | 3856.85–3879.96 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 35:6 | 48 | وَإِخْرَاجُ مَا لا يُجْزِئُ … | … فتَشْمَلُ الأَفْعَالَ وَالأَقْوَالَ وَالأَحْوَالَ. | 36 | 3880.06–3906.07 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 36:1 | 49 | وَمِنْ مَعَاصِى الْفَرْجِ الزِّنَى … | … لِلْحُرِّ وَيُنَصَّفُ ذَلِكَ لِلرَّقِيقِ | 35 | 3906.88–3932.22 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 36:2 | 49 | وَمِنْهَا إِتْيَانُ الْبَهَائِمِ وَلَوْ … | … النِّفَاسِ أَوْ بَعْدَ انْقِطَاعِهِمَا | 22 | 3932.42–3948.85 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 36:3 | 49 | وَقَبْلَ الْغُسْلِ أَوْ بَعْدَ … | … فِى الْخَلْوَةِ لِغَيْرِ غَرَضٍ | 26 | 3948.87–3963.52 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 36:4 | 49 | وَاسْتِقْبَالُ الْقِبْلَةِ أَوِ اسْتِدْبَارُهَا … | … أَوْ كَانَ وُجِدَ الْحَائِلُ | 25 | 3963.62–3980.84 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 36:5 | 49 | وَلَكِنْ بَعُدَ عَنْهُ أَكْثَرَ … | … اسْتِقْبَالُ الْقِبْلَةِ وَاسْتِدْبَارُهَا فِيهِ | 32 | 3980.86–4000.86 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 36:6 | 49 | وَالتَّغَوُّطُ عَلَى الْقَبْرِ وَالْبَوْلُ … | … لِلْبَالِغِ وَيَجُوزُ عِنْدَ مَالِكٍ. | 17 | 4000.88–4012.61 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 37:1 | 50 | وَمِنْ مَعَاصِى الرِّجْلِ الْمَشْىُ … | … حَقٍّ وَإِبَاقُ الْعَبْدِ وَالزَّوْجَةِ | 32 | 4013.68–4032.9 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 37:2 | 50 | وَمَنْ عَلَيْهِ حَقٌّ عَمَّا … | … وَتَخَطِّى الرِّقَابِ إِلَّا لِفُرْجَةٍ | 24 | 4032.92–4048.63 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 37:3 | 50 | وَالْمُرُورُ بَيْنَ يَدَىِ الْمُصَلِّى … | … مُحَرَّمٍ وَتَخَلُّفٍ عَنْ وَاجِبٍ. | 23 | 4048.65–4064.09 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 38:1 | 50 | وَمِنْ مَعَاصِى الْبَدَنِ عُقُوقُ … | … وَقَطِيعَةُ الرَّحِمِ وَإِيذَاءُ الْجَارِ | 25 | 4064.83–4081.05 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 38:2 | 50, 51 | وَلَوْ كَافِرًا لَهُ أَمَانٌ … | … الْجِنْسَيْنِ فِى الْمَلْبَسِ وَغَيْرِهِ | 32 | 4081.07–4102.48 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 38:3 | 51 | وَإِسْبَالُ الثَّوْبِ لِلْخُيَلاءِ أَىْ … | … وَقَطْعُ نَفْلِ الْحَجِّ وَالْعُمْرَةِ | 23 | 4102.5–4118.6 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 38:4 | 51 | وَمُحَاكَاةُ الْمُؤْمِنِ اسْتِهْزَاءً بِهِ … | … لِلإِينَاسِ لَهُ عَلَى فِسْقِهِ | 24 | 4118.62–4137.9 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 38:5 | 51 | وَلُبْسُ الذَّهَبِ وَالْفِضَّةِ وَالْحَرِيرِ … | … مِنْ ذَكَرٍ أَوْ أُنْثَى | 26 | 4137.92–4156.26 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 38:6 | 51 | وَسَفَرُ الْمَرْأَةِ بِغَيْرِ نَحْوِ … | … أَوَانِى الذَّهَبِ وَالْفِضَّةِ وَاتِّخَاذُهَا | 20 | 4156.7–4174.33 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 38:7 | 51 | وَتَرْكُ الْفَرْضِ أَوْ فِعْلُهُ … | … عَلَيْهِ وَإِنْ صَلَّى الظُّهْرَ | 22 | 4174.35–4186.96 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 38:8 | 51 | وَتَرْكُ نَحْوِ أَهْلِ قَرْيَةٍ … | … وَتَرْكُ الإِحْدَادِ عَلَى الزَّوْجِ | 36 | 4187.04–4214.96 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 38:9 | 52 | وَتَنْجِيسُ الْمَسْجِدِ وَتَقْذِيرُهُ وَلَوْ … | … وَلَمْ يَعْلَمْ دَائِنُهُ بِذَلِكَ | 25 | 4215.16–4233.92 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 38:10 | 52 | وَعَدَمُ إِنْظَارِ الْمُعْسِرِ وَبَذْلُ … | … الْحَدِّ الْفَاصِلِ بَيْنَ مِلْكِهِ | 25 | 4233.94–4253.44 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 38:11 | 52 | وَمِلْكِ غَيْرِهِ وَالتَّصَرُّفُ فِى … | … فِيهَا أَوْ أَعَارَهُ لِغَيْرِهِ | 25 | 4253.46–4269.47 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 38:12 | 52 | وَتَحْجِيرُ الْمُبَاحِ كَالْمَرْعَى وَالاِحْتِطَابِ … | … وَالْمَاءِ لِلشُّرْبِ مِنَ الْمُسْتَخْلَفِ | 25 | 4269.49–4288.2 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio |
| 38:13 | 52 | وَهُوَ الَّذِى إِذَا أُخِذَ … | … يُعْذَرْ وَالتَّطَفُّلُ فِى الْوَلائِمِ | 23 | 4288.28–4305.56 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 38:14 | 52 | وَهُوَ الدُّخُولُ بِغَيْرِ إِذْنٍ … | … الأَجَانِبِ بِقَصْدِ التَّعَرُّضِ لَهُمْ | 33 | 4305.58–4329.3 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 38:15 | 52, 53 | وَالسِّحْرُ وَالْخُرُوجُ عَنْ طَاعَةِ … | … وَلَوْ كَانَ مِنَ الْكَبَائِرِ | 40 | 4329.32–4356.8 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 38:16 | 53 | وَالتَّوَلِّى عَلَى يَتِيمٍ أَوْ … | … يُرِيدُ أَخْذَ الْحَقِّ مِنْهُ | 25 | 4356.82–4373.56 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 38:17 | 53 | وَتَرْوِيعُ الْمُسْلِمِينَ وَقَطْعُ الطَّرِيقِ … | … وَصَلْبٍ أَىْ إِنْ قَتَلَ | 24 | 4373.58–4390.34 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 38:18 | 53 | وَمِنْهَا عَدَمُ الْوَفَاءِ بِالنَّذْرِ … | … الْمُؤْذِيَةُ أَوْ أَخْذُ نَوْبَتِهِ. | 24 | 4390.36–4407.57 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |
| 39:1 | 53 | تَجِبُ التَّوْبَةُ مِنَ الذُّنُوبِ … | … لِآدَمِىٍّ قَضَاهُ أَوِ اسْتَرْضَاهُ. | 29 | 4408.66–4426.61 | phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) |

### Portions très longues ou très courtes

- **2:3** (63 mots) : longue ; phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés)
- **3:10** (47 mots) : longue ; phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés)
- **18:12** (49 mots) : longue ; phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés)
- **12:3** (11 mots) : courte ; phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés) ; contient du texte repris de l'audio
- **18:4** (10 mots) : courte ; phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés)
- **22:5** (10 mots) : courte ; phrase(s) complète(s), coupée(s) à la ponctuation (portion courte, ~25 mots visés)

### Frontières discutables

Les coupes marquées ⚠ dans le tableau sont celles faites sans ponctuation dans la source ; toutes les autres tombent sur une virgule ou un point imprimés.

## Audio

- Récitation fournie : `audio/1.mp3`. **Le texte suit la récitation** (voir « Texte repris de l'audio »), sauf le préambule du récitant (« الحمد لله … حفظه الله ولطف به ») et sa formule de clôture (« انتهى ما قدر الله جمعه … ») : lus mais **exclus du texte à apprendre** (décision du 07/11), et hors des bornes audio.
- Le récitant lit aussi les titres (« فصل », etc.) : ils restent hors des bornes des portions et hors du texte.
- Les « ﷺ » imprimés sont gardés tels quels : le récitant les lit « صلى الله عليه وسلم ».
- Petites différences d'un ou deux mots : **texte du PDF gardé** (décision du 07/11) : « وما لم يشأ لم يكن », « ولا طعم ولا ريح », « ومنكسا أي », « التي تحل له », « صفة لله تعالى ».
- Méthode des bornes : transcription locale (faster-whisper large-v3-turbo, hors ligne) avec horodatage par mot, alignement mot à mot avec le texte, puis coupe placée dans le silence réel qui suit le dernier mot (énergie du signal) avec une marge de fin de 0,5 s, raccourcie si elle atteint le début de la portion suivante ; début 0,25 s avant le premier mot, sans empiéter sur le son précédent.
- Vérification des coupes : seconde écoute automatique de chaque extrait (début 5 s, fin 6 s retranscrits séparément) ; la portion n'a d'audio que si les premiers et derniers mots entendus correspondent à ceux du texte **et** si la portion n'a pas d'écart notable avec la récitation. Je n'ai pas d'oreille humaine : ces bornes sont vérifiées par machine, à confirmer à l'écoute dans l'app.
- **Seconde passe (08/11)** : les 33 portions restées sans repères ont été recalées. Les bords ont été pris sur l'horodatage des mots, même quand le premier ou le dernier mot était mal reconnu, puis ajustés à l'écoute par pas de 0,25 s, jusqu'à ce que le premier mot entendu soit le premier mot de la portion et le dernier le dernier. Les portions voisines dont un bord a bougé ont été réécoutées aussi. Aucun extrait ne chevauche le suivant. Coupes faites sans pause (« أو قال | وقد ملأ », « كأن يؤمنه | ثم يقتله », « فعلا | وتركا ») : fin confirmée par réécoute des 3 à 10 dernières secondes.

### Unités sans audio et pourquoi


## Incertitudes de lecture (texte relu sur image, à vérifier)

Chaque ligne cite la page PDF et l'extrait tel qu'il est transcrit dans le corpus. Aucune correction silencieuse n'a été faite.

- p. 2 : «الْمدَبِّرِ» — aucune voyelle visible sur le mīm (imprimé ainsi).
- p. 2 : «كَالْبُلْقِينِىِّ» — yāʾ final pointé ou non : peu lisible.
- p. 3 : «كَافَةِ» — imprimé sans shadda sur le fāʾ.
- p. 8 : «مُجمَعٍ» (deux fois) — pas de soukoun visible sur le jīm (contrairement à «مُجْمَعٌ» plus haut sur la page).
- p. 10 : «الْحُكْم» — pas de voyelle finale imprimée sur le mīm.
- p. 17 : «تُشْتَهى» — pas de fatḥa visible sur le hāʾ avant l'alif maqṣūra.
- p. 20 : «يَحمِلُهَا» et «مَحمُولَهُ» — soukoun du ḥāʾ non visible.
- p. 24 : «وَرَحْمَةُ اللَّهُ» (premier tashahhud) — ḍamma sur le hāʾ du nom divin ; erreur d'impression possible (la seconde occurrence porte «اللَّهِ»).
- p. 28 : «لِذِمِىٍّ» — présence d'une shadda sur le mīm incertaine (لِذِمِّىٍّ ?).
- p. 35 : «وَعَلى» — sans fatḥa sur le lām (contrairement à وَعَلَى ailleurs) ; transcrit tel quel.
- p. 40 : «يَعْتَدِىَ» — fatḥa sur le yāʾ (après لِمَنْ) ; transcrit tel quel.
- p. 42 : «وَالصَّبْرُ على أَدَاءِ ما أَوجَبَ اللَّهُ والصَّبرُ عَمَّا حَرّمَ» — passage partiellement vocalisé dans la source ; transcrit tel quel.
- p. 48 : «فتَشْمَلُ» — fāʾ sans fatḥa ; transcrit tel quel.
- p. 50 : «الْمَشْىُ / كَالْمَشْيِ / الْمَشْيِ / مَشْيٍ» — le premier avec ى non pointé, les autres avec ي pointé ; transcrit tel quel.
- p. 50 : «بِرٍّ» — tanwīn kasra + shadda devant «وَالِدَيْهِ» ; erreur d'impression possible pour «بِرِّ».

## Références de sourates retirées du texte à mémoriser

Ces renvois entre crochets sont imprimés après les citations coraniques ; ils sont éditoriaux (non récités dans l'audio). Ils sont retirés de `text` et listés ici. Décision à valider : si tu préfères les garder, il suffit de les réinsérer.

- chapitre 2, p. 4 : [سُورَةَ الْفُرْقَان/2]
- chapitre 2, p. 4 : [سُورَةَ فَاطِر/3]
- chapitre 2, p. 4 : [سُورَةَ الْبَقَرَةِ/286]
- chapitre 3, p. 10 : [سُورَةَ النَّبَإِ/34]
- chapitre 3, p. 10 : [سُورَةَ النَّبَإِ/20]
- chapitre 3, p. 10 : [سُورَةَ الْمُطَفِّفِينَ/3]
- chapitre 3, p. 10 : [سُورَةَ الْكَهْفِ/47]
- chapitre 25, p. 38 : [سُورَةَ التَّحْرِيم/6]

## Texte repris de l'audio (l'audio fait foi)

65 modifications ont été appliquées au texte du PDF pour suivre la récitation. Les mots ajoutés ont été **vocalisés par moi** d'après la transcription automatique (qui ne donne pas les voyelles) : vocalisation à vérifier à l'écoute.

| Portion d'origine | Texte du PDF | Texte retenu (audio) | Note |
|---|---|---|---|
| 2:7 | ∅ (ajout) | تَعَالَى |  |
| 2:9 | وَالْمُخَالَفَةُ لِلْحَوَادِثِ. | وَتَنَزُّهُهُ عَنِ الْمُشَابَهَةِ لِلْحَادِثِ |  |
| 2:10 | وَلَمَّا | فَلَمَّا |  |
| 2:15 | وَالْجُبْنُ وَكُلُّ مَا يُنَفِّرُ عَنْ قَبُولِ الدَّعْوَةِ مِنْهُمْ | ∅ (non lu, retiré) |  |
| 3:1 | ∅ (ajout) | يَعْنِى بِذَلِكَ الْقُبْحَ |  |
| 3:4 | ∅ (ajout) | وَمَعْنَى مُتَعَمِّدًا أَىْ قَالَهَا عَمْدًا لَيْسَ عَنْ سَبْقِ لِسَانٍ |  |
| 3:8 | وَقَتْلِ الْمُسْلِمِ | وَالْقَتْلِ |  |
| 3:11 | [إِنْ قَصَدَ عِبَادَتَهُمَا أَوْ لَمْ يَقْصِدْ] وَالسُّجُودِ لِإِنْسَانٍ إِنْ كَانَ عَلَى وَجْهِ الْعِبَادَةِ لَهُ كَسُجُودِ بَعْضِ الْجَهَلَةِ لِبَعْضِ الْمَشَايِخِ الْمُتَصَوِّفِينَ عَلَى وَجْهِ الْعِبَادَةِ لَهُمْ فَإِنَّهُ يَكُونُ عِنْدَئِذٍ كُفْرًا | أَوْ قَمَرٍ وَكَذَلِكَ السُّجُودُ لِمَخْلُوقٍ ءَاخَرَ عَلَى وَجْهِ عِبَادَتِهِ أَمَّا السُّجُودُ لِإِنْسَانٍ تَحِيَّةً فَإِنَّهُ يَحْرُمُ فِى شَرْعِنَا وَكَانَ جَائِزًا فِى شَرْعِ مَنْ سَبَقَ مِنَ الأَنْبِيَاءِ كَسُجُودِ الْمَلائِكَةِ لِءَادَمَ فَإِنَّهُ كَانَ عَلَى وَجْهِ التَّحِيَّةِ أَمَّا السُّجُودُ لِلصَّنَمِ وَالشَّمْسِ وَالْقَمَرِ فَهُوَ كُفْرٌ مُطْلَقًا وَكَذَلِكَ سُجُودُ بَعْضِ النَّاسِ الَّذِينَ يَتَعَلَّمُونَ السِّحْرَ لِلشَّيْطَانِ كُفْرٌ مُطْلَقٌ |  |
| 3:12 | وَإِنْ لَمْ يَكُنْ عَلَى وَجْهِ الْعِبَادَةِ لَهُمْ لا يَكُونُ كُفْرًا لَكِنَّهُ حَرَامٌ. | ∅ (non lu, retiré) |  |
| 3:17 | ∅ (ajout) | فَالَّذِى يَقُولُ لَعْنَةُ اللَّهِ عَلَى كُلِّ عَالِمٍ مَعَ وُجُودِ قَرِينَةٍ تَدُلُّ عَلَى أَنَّهُ مَا أَرَادَ الشُّمُولَ كَأَنْ كَانَ ذَكَرَ هُوَ أَوْ غَيْرُهُ عُلَمَاءَ فَاسِدِينَ فَقَالَ لَعْنَةُ اللَّهِ عَلَى كُلِّ عَالِمٍ فَيُحْمَلُ كَلامُهُ عَلَى كُلِّ عَالِمٍ يَكُونُ مِنْ هَذَا الصِّنْفِ فَلا يَكْفُرُ وَأَمَّا إِذَا قَالَ هَذِهِ الْكَلِمَةَ لَعْنَةُ اللَّهِ عَلَى كُلِّ عَالِمٍ مِنْ غَيْرِ سَبْقِ قَرِينَةٍ مَا فَإِنَّهُ يَكْفُرُ وَالْقَصْدُ وَحْدَهُ بِلا قَرِينَةٍ لا يَدْفَعُ عَنْهُ التَّكْفِيرَ |  |
| 3:17 | مَخْصُوصِينَ | زَمَانِهِ |  |
| 3:25 | ∅ (ajout) | أَىِ اعْتِقَادٍ |  |
| 4:1 | وَقَعَ فِى الرِّدَّةِ | وَقَعَتْ مِنْهُ رِدَّةٌ |  |
| 4:5 | أَىْ لِبَيْتِ الْمَالِ إِنْ كَانَ بَيْتُ مَالٍ مُسْتَقِيمٌ أَمَّا إِنْ لَمْ يَكُنْ فَإِنْ تَمَكَّنَ رَجُلٌ صَالِحٌ مِنْ أَخْذِهِ وَصَرْفِهِ فِى مَصَالِحِ الْمُسْلِمِينَ فَعَلَ ذَلِكَ. | ∅ (non lu, retiré) |  |
| 6:3 | أَىْ غَيْرِ الْحَائِضِ وَالنُّفَسَاءِ | ∅ (non lu, retiré) |  |
| 7:1 | قَمَرِيَّةٍ | ∅ (non lu, retiré) |  |
| 8:1 | عِنْدَ الإِمَامِ الشَّافِعِىِّ | عِنْدَ الشَّافِعِىِّ |  |
| 10:1 | مِنْ أَحَدِ السَّبِيلَيْنِ | مِنَ السَّبِيلَيْنِ |  |
| 10:2 | ∅ (ajout) | كَحَجَرٍ أَوْ وَرَقٍ |  |
| 12:1 | ∅ (ajout) | أَىِ امْتِزَاجِ شَىْءٍ طَاهِرٍ كَالْحَلِيبِ وَالْحِبْرِ وَشِبْهِ ذَلِكَ فَلَوْ تَغَيَّرَ الْمَاءُ بِهِ بِحَيْثُ لا يُسَمَّى مَاءً لَمْ يَصْلُحْ لِلطَّهَارَةِ وَأَمَّا تَغَيُّرُهُ بِمَا لا يَسْتَغْنِى الْمَاءُ عَنْهُ كَأَنْ يَتَغَيَّرَ بِمَا فِى مَقَرِّهِ أَوْ مَمَرِّهِ أَوْ نَحْوِ ذَلِكَ مِمَّا يَشُقُّ صَوْنُ الْمَاءِ عَنْهُ فَلا يَضُرُّ فَيَبْقَى مُطَهِّرًا |  |
| 14:1 | ∅ (ajout) | وَيَكُونَ جَامِدًا |  |
| 18:1 | سَبْعَةَ عَشَرَ | ∅ (non lu, retiré) |  |
| 18:1 | أَوِ الْوَقْتِ | وَالْوَقْتِ |  |
| 18:1 | وَيَقُولُ | الثَّانِى أَنْ يَقُولَ |  |
| 18:1 | وَهُوَ ثَانِى أَرْكَانِهَا. | ∅ (non lu, retiré) |  |
| 20:4 | وَافَقَ | تَرَكَ إِتْمَامَ الْفَاتِحَةِ وَوَافَقَ |  |
| 20:6 | خَلْفَ صَلاةِ الْجِنَازَةِ | خَلْفَ مُصَلِّى صَلاةِ الْجِنَازَةِ |  |
| 20:6 | وَأَنْ لا يُخَالِفَ الإِمَامَ | وَأَنْ لا يَتَخَالَفَا |  |
| 20:6 | فِعْلًا كَالتَّشَهُّدِ الأَوَّلِ أَىْ جُلُوسِهِ وَتَرْكًا كَسُجُودِ السَّهْوِ | كَالتَّشَهُّدِ الأَوَّلِ أَىْ جُلُوسِهِ فِعْلًا وَتَرْكًا أَىْ إِنْ جَلَسَ الإِمَامُ جَلَسَ الْمَأْمُومُ وَإِنْ تَرَكَهُ قَامَ مَعَهُ |  |
| 20:6 | ∅ (ajout) | أَىْ قَبْلَ أَنْ يُتَابِعَهُ قَصْدًا فَإِنْ تَابَعَهُ بِلا نِيَّةٍ فَسَدَتْ صَلاتُهُ وَكَذَلِكَ لَوِ انْتَظَرَهُ انْتِظَارًا طَوِيلًا مَعَ الْمُتَابَعَةِ أَمَّا لَوْ تَابَعَهُ اتِّفَاقًا بِلا قَصْدٍ لَمْ تَبْطُلْ صَلاتُهُ وَحَاصِلُ الْمَسْأَلَةِ أَنَّهُ إِذَا تَابَعَهُ قَصْدًا فَسَدَتْ سَوَاءٌ طَالَ الِانْتِظَارُ أَوْ لَمْ يَطُلْ أَمَّا إِنِ انْتَظَرَهُ طَوِيلًا وَلَمْ يُتَابِعْهُ فِى الأَفْعَالِ فَلا تَفْسُدُ |  |
| 20:7 | يُصَلِّيهَا جَمَاعَةً مَرَّةً | يُصَلِّيهَا مَرَّةً |  |
| 20:7 | ∅ (ajout) | إِذَا وَجَدَ رَجُلًا يُصَلِّى مَعَهُ جَمَاعَةً أَوْ صَلَّى جَمَاعَةً لَكِنَّهُ أَرَادَ أَنْ يُكْسِبَ رَجُلًا جَاءَ لِيُصَلِّىَ حَتَّى لا تَفُوتَهُ فَضِيلَةُ الْجَمَاعَةِ |  |
| 21:4 | وَيُعَيِّنَ | وَيُعَيِّنَ الْمَيِّتَ وَلَوْ بِالإِشَارَةِ الْقَلْبِيَّةِ |  |
| 22:7 | ∅ (ajout) | بِأَنْ يَبْلُغَ حَالَةً يُقْصَدُ لِلأَكْلِ فِيهَا فَلا زَكَاةَ فِى الْحِصْرِمِ وَالْبَلَحِ |  |
| 22:12 | وَتَكْفِى | وَتَجِبُ |  |
| 23:4 | ∅ (ajout) | كَمَنِ اعْتَادَ صَوْمَ الِاثْنَيْنِ وَالْخَمِيسِ |  |
| 23:5 | مُدًّا مِنْ غَالِبِ قُوتِ الْبَلَدِ. | مُدًّا مِنْ قَمْحٍ أَوْ غَيْرِهِ مِمَّا هُوَ غَالِبُ قُوتِ الْبَلَدِ وَالْمُدُّ هُوَ مِلْءُ الْكَفَّيْنِ الْمُعْتَدِلَتَيْنِ |  |
| 24:2 | ∅ (ajout) | أَوِ الْعُمْرَةِ |  |
| 26:1 | ∅ (ajout) | وَالنَّقْدَانِ هُمَا الذَّهَبُ وَالْفِضَّةُ مَضْرُوبَيْنِ سِكَّةً أَمْ لا وَالْحُلِىُّ وَالتِّبْرُ |  |
| 26:1 | ∅ (ajout) | أَىِ افْتِرَاقِ الْمُتَبَايِعَيْنِ قَبْلَ التَّقَابُضِ |  |
| 26:1 | ∅ (ajout) | أَىِ الذَّهَبِ بِالذَّهَبِ أَوِ الْفِضَّةِ بِالْفِضَّةِ |  |
| 26:1 | أَىْ مَعَ زِيَادَةٍ | أَىْ بَيْعُ الذَّهَبِ بِالذَّهَبِ أَوِ الْفِضَّةِ بِالْفِضَّةِ مَعَ زِيَادَةٍ |  |
| 26:2 | وَانْتِفَاءِ الِافْتِرَاقِ | وَالِافْتِرَاقِ |  |
| 26:2 | ∅ (ajout) | كَالْبُرِّ بِالْبُرِّ |  |
| 26:2 | ∅ (ajout) | فَلا يَحِلُّ بَيْعُ شَعِيرٍ بِشَعِيرٍ إِلَّا مِثْلًا بِمِثْلٍ كَيْلًا مَعَ الْحُلُولِ وَالتَّقَابُضِ قَبْلَ الِافْتِرَاقِ |  |
| 27:1 | ∅ (ajout) | كَأَنْ يَبِيعَ دَيْنًا لَهُ عَلَى زَيْدٍ لِعَمْرٍو بِثَمَنٍ مُؤَجَّلٍ إِلَى شَهْرٍ مَثَلًا |  |
| 27:11 | وَيَشْتَرِطَ أَنْ يَبِيعُوا | ثُمَّ يَبِيعُونَ |  |
| 28:2 | وَقَعَ الْفِرَاقُ بَيْنَهُمَا | طَلَّقَهَا وَالْمُتْعَةُ مَالٌ يُعْطَى لِلْمُطَلَّقَةِ |  |
| 30:1 | أَىِ الْحَسَنَاتِ | ∅ (non lu, retiré) |  |
| 30:1 | وَهُوَ مِنَ الْكَبَائِرِ | ∅ (non lu, retiré) |  |
| 30:5 | عَذَابِ | ∅ (non lu, retiré) |  |
| 32:2 | كَشْفُ الْعَوْرَةِ | كَشْفُ السَّوْأَتَيْنِ |  |
| 33:2 | الإِخْبَارُ | الْكَلامُ |  |
| 33:7 | ∅ (ajout) | أَىْ مَنْ أَعْتَقَهُ كَأَنْ يَقُولَ أَنَا أَعْتَقَنِى فُلانٌ يُسَمِّى غَيْرَ الَّذِى أَعْتَقَهُ |  |
| 33:11 | ∅ (ajout) | وَقِيلَ يُكْرَهُ |  |
| 36:1 | الزِّنَى | الزِّنَى وَهُوَ إِدْخَالُ الْحَشَفَةِ فِى الْقُبُلِ |  |
| 36:1 | ∅ (ajout) | وَهُوَ إِدْخَالُ الْحَشَفَةِ فِى الدُّبُرِ |  |
| 36:4 | ∅ (ajout) | وَالْحَائِلُ مَا يَكُونُ أَمَامَهُ مِنْ شَىْءٍ مُرْتَفِعٍ قَدْرَ ثُلُثَىْ ذِرَاعٍ فَأَكْثَرَ |  |
| 36:4 | أَوْ بَعُدَ عَنْهُ | أَوْ كَانَ وُجِدَ الْحَائِلُ وَلَكِنْ بَعُدَ عَنْهُ |  |
| 36:4 | إِلَّا فِى الْمَكَانِ الْمُعَدِّ | إِلَّا إِذَا كَانَ الْمَكَانُ مُهَيَّأً |  |
| 36:4 | ∅ (ajout) | كَالْمِرْحَاضِ فَإِنَّهُ يَجُوزُ اسْتِقْبَالُ الْقِبْلَةِ وَاسْتِدْبَارُهَا فِيهِ |  |
| 37:1 | ∅ (ajout) | أَىْ لِلإِضْرَارِ بِهِ عِنْدَ الْحَاكِمِ أَوْ نَحْوِهِ |  |
| 37:1 | ∅ (ajout) | أَىِ الْمَشْىُ لِقَتْلِ مُسْلِمٍ أَوْ لِلإِضْرَارِ بِهِ |  |
| 38:2 | ∅ (ajout) | وَأَجَازَهُ بَعْضُ الأَئِمَّةِ إِذَا لَمْ يَكُنْ يُؤَدِّى إِلَى الْغِشِّ وَالتَّلْبِيسِ |  |
| 38:11 | ∅ (ajout) | أَىْ أَنْ يَسْتَبِدَّ بِهَذِهِ الأَشْيَاءِ وَيَمْنَعَ النَّاسَ مِنْ رَعْىِ مَوَاشِيهِمْ |  |

## Vérification d'intégrité

- Concaténation des `units[].text` = corps du PDF + les 65 modifications audio listées ci-dessus ; comparée à la transcription de la récitation, il ne reste que les titres lus à voix haute et des différences de prononciation.
- `text-ar.txt` = une unité par ligne, dans l'ordre ; identique à la concaténation à l'espacement près.
- Identifiants uniques : oui (237).

## Statut de relecture

- **Texte** : base PDF lue sur image, puis alignée sur la récitation ; les ajouts tirés de l'audio sont vocalisés par moi et **à vérifier à l'écoute**.
- **Encore à vérifier par toi** : la vocalisation des ajouts, les petites différences listées dans « Audio », les frontières ⚠.
- `reviewStatus` reste `needs_review`.
