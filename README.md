# ConvertiScan (v5 – 1 QR pour 2 courses)

- Accueil **centré**.
- **1 élève** avec **2 courses** (Course 1 & Course 2).
- **UN SEUL QR** contenant les deux séries de splits, via des **champs à plat** :  
  `nom`, `prenom`, `classe`,  
  `split200_1`, `split400_1`, `split600_1`, `temps800_1`,  
  `split200_2`, `split400_2`, `split600_2`, `temps800_2`.
- Saisie flexible : `48`, `1:48`, `1'48`, `108`, `1:48.5`, etc. → tout est converti en **secondes** (nombres).

## Déploiement
Pousse les fichiers à la racine du dépôt et active GitHub Pages.

## Notes ScanProf
Le QR encode un **JSON direct** (non compressé). Les champs sont à plat pour que ScanProf les lise comme de simples colonnes.
