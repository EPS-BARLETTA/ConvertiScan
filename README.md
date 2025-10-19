# ConvertiScan (v2)

- Page de garde **centrée**.
- Saisie **1 élève** avec **2 courses** (Course 1 & Course 2).
- QR **ScanProf** par course, avec **champs strictement demandés** :
  `nom`, `prenom`, `classe`, `split_200`, `split_400`, `split_600`, `temps_800` (en secondes, numériques).

## Fichiers
- `index.html` — page d’accueil (centrée).
- `saisie.html` — identité élève, 2 courses (cumuls), calcul live, QR par course.
- `style.css` — styles.
- `convertiscan.js` — logique.
- `vendor/qrcode.min.js` — placeholder (fallback CDN si absent).

## Déploiement
GitHub Pages : pousser les fichiers à la racine du dépôt et activer Pages.
