# Sakina.me

Application gratuite de mémorisation : Coran, Matn Ibn Ashir et Moukhtassar al-Harari.
La reconnaissance du Coran s'exécute sur l'appareil ; aucun serveur de reconnaissance ni compte utilisateur.

## Publication gratuite avec GitHub Pages

1. Créer un dépôt dédié `sakina-web` sur le compte GitHub choisi. Le dépôt doit être public pour GitHub Free.
2. Pousser le contenu de ce dossier dans sa branche `main`.
3. Dans Settings → Pages → Build and deployment, choisir **GitHub Actions**.
4. Lancer le workflow **Publish Sakina.me** dans Actions si nécessaire.
5. Ouvrir l'adresse HTTPS affichée par le déploiement. Le sous-dossier du dépôt est pris en charge par les URL relatives de l'application.

Le site ne s'appelle pas automatiquement `sakina.me` : sans domaine personnel configuré, GitHub fournit une adresse `https://IDENTIFIANT.github.io/sakina-web/`.

## Installation

Sur Android, ouvrir le lien dans Chrome puis Installer/Ajouter à l'écran d'accueil.
Sur iPhone, ouvrir dans Safari puis Partager → Sur l'écran d'accueil.
L'installation de la PWA ne garantit pas la compatibilité du modèle vocal avec chaque iPhone : le modèle WebAssembly est volumineux et doit être testé sur les appareils concernés.
Préparer l'accès hors connexion dans Mon espace pour télécharger les ressources ; les audios coraniques souhaités se téléchargent depuis la lecture.

## Mise à jour et nouveaux textes

Chaque envoi sur `main` reconstruit et publie le site à la même adresse. La version du cache est calculée à partir du contenu, y compris les audios et modèles : aucune incrémentation manuelle n'est nécessaire.
Une mise à jour est reçue quand l'application retrouve le réseau ; elle n'est pas instantanée sur un appareil hors connexion. Fermer et rouvrir l'application permet d'utiliser le code nouvellement téléchargé.
Les programmes restent dans le stockage local de cette adresse. Sauvegarder par Exporter avant un changement d'adresse ; la progression de l'APK ne se transfère pas automatiquement à la PWA.

Pour ajouter un matn, intégrer son texte, ses sections, son manifeste et ses audios dans les adaptateurs du corpus, vérifier les références et publier les fichiers modifiés. Le site conserve le même lien.

## Développement

`python -m http.server 8000 --directory app` pour essayer sur localhost.
`python scripts/build-site.py` produit `_site/` pour l'hébergement statique. Utiliser une nouvelle destination pour chaque construction locale (`python scripts/build-site.py CHEMIN`).
La construction conserve le code source et les ressources sans modification ; seules les versions du cache et la liste des fichiers hors ligne sont générées.

## Ressources et conditions

Voir `app/THIRD_PARTY_NOTICES.txt` et les licences conservées dans `app/vendor/`. Le projet inclut des composants soumis à des conditions de gratuité et de non-commercialisation, qui continuent de s'appliquer. Les fichiers sources de travail, PDF personnels, APK, identifiants et données utilisateur ne sont pas inclus dans ce dépôt web.


## Version 1.17

Le compteur des écoutes restantes et +1 forment un seul bouton central sur deux lignes, séparé de Réciter.


## Version 1.18

Onglet Livres : 428 questions de La Réjouissance du Regard, choix des chapitres ou questions, cartes retournables, révisions FSRS-6 (ts-fsrs 5.2.3), historique local IndexedDB et sauvegarde. Les 88 citations coraniques disposent d’extraits audio Minshawi embarqués. La citation 25:58 a été corrigée à la demande de l’utilisateur pour correspondre à sa phonétique et sa référence.

## Version 1.19

Parcours quotidiens, reprises distinctes par programme, sélections par sourates et révision libre des livres. 70 audios de hadiths ajoutés, textes homogènes, révisions FSRS rapprochées (rétention par défaut 95 %). Balayage du mushaf : vers la droite pour avancer, vers la gauche pour revenir. Repère du verset en cours d’écoute.

Notifications locales uniquement dans l’APK Android. Aucun calendrier, serveur de rappels ou fausse notification web en arrière-plan. La PWA n’affiche pas ces réglages Android.

## Version 1.20 — web/PWA

Révisions consécutives regroupées : une seule récitation avec sourate et bornes exactes, y compris à la reprise d’une séance. Les passages disjoints restent distincts. Les mots des fragments imprimés sont alignés une seule fois ; les rotations de révision gardent leurs conditions de validation. Les pages suivent la récitation.

Lecture libre des matns : une écoute par défaut, lecture à la suite depuis le passage affiché et bouton pour écouter le texte entier. Vue de paroles synchronisées avec voisins atténués, sans numéros décoratifs ni petits play dans le texte ; palette bleue. Ibn Ashir possède 315 audios sur 317 vers : les passages sans enregistrement ne bloquent pas la lecture.

Livraisons uniquement web/PWA à partir de cette version, aucun nouvel APK.

### 1.20.1

Correction du rendu du Moukhtassar : un tableau d’hémistiches vide ne masque plus le texte en prose. Les hémistiches d’Ibn Ashir conservent leur présentation. Contrôle automatisé sur tous les passages réels du Moukhtassar sans hémistiches.

## Version 1.21 — Mushaf et verset par verset

Nouveau mode de lecture arabe agrandie, taille réglable, sans masquage. Le Mushaf conserve les positions imprimées et place Cacher/Afficher près du lecteur. Les commandes restent fixes et seuls les versets défilent. Un mot se touche pour écouter son extrait Minshawi ; un bouton distinct lit le verset entier. Les ayahs qui traversent une page restent complètes dans cette vue. Aucun texte traduit ou tafsir ajouté.

Les repères mot par mot proviennent des métadonnées Minshawi déjà utilisées par le projet (cpfair/quran-align, CC BY 4.0). 77 344 mots ont un découpage unique, 94 restent indisponibles et proposent l’ayah entière. Les ayahs téléchargées sont réutilisées hors connexion, sans fichiers MP3 par mot supplémentaires ni serveur. Les limites de mots sont issues de l’alignement et ne constituent pas une validation humaine de chaque découpe.


## Version 1.22 — lecture fluide et commandes discrètes

Accueil sans programme : Lire le Coran / Apprendre et réviser. Reprise de lecture avec sourate et page. En mode verset, une seule indication courte pour découvrir les mots cliquables ; taille du texte dans le menu, lecture du verset par une icône accessible. Aucun ajout de rangées de commandes explicatives.

Les mots utilisent par défaut les fichiers individuels publics Quran.com (audio.qurancdn.com/wbw), mis en cache à la demande. Téléchargement des mots du passage dans les options ; les extraits Minshawi restent disponibles dans les réglages. Aucun serveur ni secret API ajouté. La documentation officielle distingue ces fichiers de la récitation complète : https://api-docs.quran.com/docs/sdk/javascript/audio/ . Le nom du lecteur mot à mot n’est pas affirmé faute d’identification officielle vérifiée.

Le suivi audio ne surligne que le mot dans son intervalle réel ; les pauses et repères indisponibles restent neutres. Données propres à Minshawy_Murattal_128kbps, Alafasy_128kbps et Husary_64kbps : l’audio Husary utilise donc la version 64 kb/s correspondante. Les six différences de découpage du texte imprimé sont explicitement reliées, sans modifier le texte fourni. Aucun repère d’un récitateur n’est appliqué à un autre.

Révision du Coran : un changement de page conserve le micro et la référence complète de révision. Passage automatique après le dernier mot reconnu de la page. Après un arrêt volontaire, le micro reprend au début de la page affichée ; les mots précédents ne sont pas évalués comme des omissions. Livraison web uniquement.


## Version 1.23 — Le But des étudiants

Nouveau livre questions-réponses français : 233 questions et 13 chapitres, avec sélection complète, par chapitre, par plages ou par questions, quota quotidien et FSRS existant. Aucun changement de l’autre livre ni de son historique.

Les 69 MP3 Guillaume du lot validé par l’utilisateur le 10 novembre 2026 sont importés sans réencodage, après vérification intégrale des SHA-256, du format et des durées. Chaque citation est reliée à une question par son texte arabe et sa page ; les deux occurrences répétées sont distinguées par leur contexte. Les cartes affichent la vocalisation fournie avec le lot. Le texte du PDF est extrait en conservant l’ordre logique des ligatures arabes, sans captures du livre dans les cartes.

118 citations coraniques utilisent les glyphes canoniques déjà présents dans Sakina et des extraits Minshawi délimités selon les mots cités. Les références répétées sont désambiguïsées avec les références françaises du PDF. Aucun audio coranique synthétique. Le PDF source reste hors du site. Textes et médias du nouveau livre sont inclus dans les ressources hors connexion.


### Version 1.23.1

Retrait de la mention de la voix sous chaque lecteur de hadith, sur demande de l’utilisateur. Audios et métadonnées conservés ; références des citations coraniques inchangées.


## Version 1.24 — tajwid, révision cumulative et fichiers conservés

Le mode Verset par verset affiche les annotations de tajwid de Quran.com, regroupées dans une palette de huit couleurs. Une légende repliée, avec une explication par couleur, apparaît au-dessus du texte. Les 6 236 versets sont couverts. Le texte canonique existant reste inchangé : seules des annotations sont projetées sur ses caractères. Les mots cliquables, les audios et le suivi vocal conservent leurs identifiants. Source : https://api-docs.quran.com/docs/content_apis_versioned/4.0.0/quran-verses-uthmani-tajweed/ ; durées en temps, selon la légende arabe officielle Quran.com. Le texte brut externe n’est jamais injecté en HTML. Une fermeture de balise superflue dans la source 32:3 est ignorée ; aucun texte n’est reconstruit.

Sur demande explicite : pour les matans, tout l’acquis du programme revient chaque jour avant les nouvelles unités, sans appliquer l’ancien espacement individuel. Les chapitres consécutifs s’enchaînent, les trous réellement inconnus restent séparés. Après la fin de l’apprentissage, la récitation de tout le texte revient quotidiennement. Une validation du jour n’est pas redemandée le même jour ; le lendemain, elle revient. Exemple testé avec le moteur réel : après 30 jours à deux vers, révision 1–60 puis apprentissage 61–62. Le macro-plan Coran et FSRS des livres restent distincts et inchangés.

La préparation hors connexion démarre automatiquement au premier lancement ou quand des fichiers manquent. Stockage durable sakina-offline-assets-v1, indépendant de la version de l’interface, avec révisions par empreinte SHA-256. Les anciens téléchargements correspondants sont migrés sans transfert réseau. Les mises à jour récupèrent uniquement les fichiers nouveaux ou modifiés ; une interruption conserve les fichiers terminés. Les caches historiques ne sont supprimés qu’après préparation complète. Les anciens et nouveaux lecteurs peuvent conserver leur propre révision d’un fichier. Le statut distingue les fichiers téléchargés de ceux conservés. La préparation inclut les ressources embarquées, livres, matans et modèle 3.1 ; les récitations coraniques externes se téléchargent toujours depuis la lecture. Aucun effacement du suivi ou des programmes.


### Version 1.24.1 — correction du chargement du mushaf

Deux demandes simultanées peuvent partager un téléchargement, mais chaque consommateur reçoit désormais sa propre réponse lisible. Cela évite qu’un premier affichage épuise le flux attendu par un second. Le chargement des pages est également mutualisé dans le lecteur. Un échec temporaire du moteur ne bloque plus les tentatives suivantes jusqu’à la fermeture de l’application. Bouton Réessayer en cas d’échec ; aucun effacement des programmes, de l’historique ou des téléchargements.


Révision libre des livres : bouton Mélanger pour réordonner les cartes restantes ; les cartes ratées sont également mélangées au prochain tour. Les réussites et la progression restent conservées, les échéances FSRS ne sont pas modifiées. Un rafraîchissement avec le même inventaire hors connexion réutilise les fichiers terminés et ne demande aucun nouveau modèle ou audio.
