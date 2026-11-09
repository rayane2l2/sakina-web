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
