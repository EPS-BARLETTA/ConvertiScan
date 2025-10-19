# ConvertiScan (v4 – 1 QR pour 2 courses)

- Accueil **centré**.
- **1 élève** avec **2 courses** (Course 1 & Course 2).
- **UN SEUL QR** contenant les deux séries de splits, via des **champs à plat** (compat ScanProf dynamique) :  
  `nom`, `prenom`, `classe`,  
  `split200_1`, `split400_1`, `split600_1`, `temps800_1`,  
  `split200_2`, `split400_2`, `split600_2`, `temps800_2`.

> Pas de tableau imbriqué → ScanProf verra simplement des colonnes supplémentaires, donc exploitable.

Les valeurs de temps sont en **secondes** (nombres). L’UI affiche en **mm:ss** pour la lisibilité.

## Déploiement
Pousse les fichiers à la racine du dépôt et active GitHub Pages.
