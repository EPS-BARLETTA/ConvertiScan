# ConvertiScan

Mini‑app web (MDM‑safe) pour convertir des **temps cumulés sur 800 m** en **intermédiaires tous les 200 m** et générer un **QR JSON compatible ScanProf** (1 QR = 1 élève).

## Fichiers
- `index.html` — page de garde (bouton **Démarrer**).
- `saisie.html` — saisie de 2 élèves, calcul auto, stockage local, génération QR.
- `style.css` — styles simples, iPad‑friendly.
- `convertiscan.js` — logique (parsing temps, splits, normalisation de classe, QR).
- `vendor/qrcode.min.js` — bibliothèque QR (à embarquer localement pour MDM). Un **fallback CDN** est prévu si ce fichier est absent.

## QR JSON (direct, non compressé)
Exemple de payload encodé dans le QR :
```json
{
  "nom": "DURAND",
  "prenom": "Camille",
  "classe": "4B",
  "extras": {
    "epreuve": "800m",
    "cumul_200": 52.0,
    "cumul_400": 108.0,
    "cumul_600": 167.0,
    "cumul_800": 224.0,
    "split_200": 52.0,
    "split_400": 56.0,
    "split_600": 59.0
  }
}
```
> **Règles ScanProf** : `nom` en MAJ, `prenom` en clair, `classe` normalisée (ex. `4e/4ème/4 A` → `4A`).

## Déploiement GitHub Pages
1. Crée un dépôt `ConvertiScan` puis pousse les fichiers à la racine.
2. Active **GitHub Pages** sur la branche `main` (root).
3. Ouvre `https://<org>.github.io/ConvertiScan/`.

## MDM
- Le script charge `vendor/qrcode.min.js` en **local** ; si absent, fallback CDN.
- Pour un usage 100% offline MDM, place une copie réelle de `qrcode.min.js` dans `vendor/`.

## Licence
MIT
