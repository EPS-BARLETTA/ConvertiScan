# ConvertiScan (v6 – 1 QR avec 2 courses, détails exploitables)

- **1 QR unique** pour **2 courses** (même élève).
- Champs **plats** pour ScanProf :
  - `nom`, `prenom`, `classe`
  - `split_200_c1`, `split_400_c1`, `split_600_c1`, `temps_800_c1`
  - `split_200_c2`, `split_400_c2`, `split_600_c2`, `temps_800_c2`
- Et **en plus**, des champs lisibles **mm:ss** :
  - `split_200_c1_txt`, ..., `temps_800_c2_txt`

Les durées numériques sont en **secondes** (ex. 48, 224).

## Déploiement
Pousse les fichiers à la racine du dépôt et active GitHub Pages.
