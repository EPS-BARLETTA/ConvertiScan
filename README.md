# ConvertiScan (v3)

- Accueil **centré**.
- **1 élève** avec **2 courses** (Course 1 & Course 2).
- **Compat ScanProf** : 1 QR = 1 enregistrement. On génère **2 QR** pour éviter les doublons — chaque QR inclut un champ `essai` (=1 ou 2) pour différencier les deux mesures du même élève.
- **Champs EXACTS** dans chaque QR : `nom`, `prenom`, `classe`, `split_200`, `split_400`, `split_600`, `temps_800`, `essai`.
- Splits et temps sont **en secondes (nombres)** pour être exploitables ; l’UI affiche aussi **mm:ss**.

## Déploiement
Pousse les fichiers à la racine du dépôt et active GitHub Pages.
