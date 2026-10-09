# Major : application Angular (V1)

Préparation aux concours directs du Burkina Faso : entraînement quotidien, Indice Major, examens blancs, classements.
Cette V1 est le portage en Angular du prototype `Major_web.html`. Elle fonctionne sans serveur : les réponses sont gardées dans le navigateur.

## Lancer l'application

Il faut Node.js 20.19 ou plus récent (22 ou 24 recommandé).

```bash
npm install
npm start
```

Puis ouvrir http://localhost:4200. Pour voir l'affichage téléphone, utiliser le mode appareil mobile du navigateur (360 × 800).

Autres commandes :

- `npm run build` : version de production dans `dist/major-app` (installable sur Android comme application, fonctionne hors ligne).
- `npm test` : tests du calcul de l'Indice Major et de la répétition espacée.

## Où modifier quoi

| Besoin | Fichier |
|---|---|
| Ajouter ou corriger des questions | `src/app/data/questions.json` |
| Ajouter un concours, changer ses coefficients | `src/app/data/concours.json` |
| Ajouter une matière | `src/app/data/matieres.json` |
| Formule de l'Indice Major, répétition espacée | `src/app/core/indice.ts` |
| Profil, réponses, série, ligue | `src/app/core/etat.service.ts` |
| Déroulé d'une séance | `src/app/core/seance.service.ts` |
| Examen blanc | `src/app/core/examen.service.ts` |
| Écrans | `src/app/pages/` |
| Couleurs et styles | `src/styles.css` |

Chaque question suit ce format (les champs `chapitre`, `notion`, `concours`, `difficulte` et `type` préparent le classement prévu par l'étude terrain) :

```json
{
  "id": "ma01",
  "matiere": "ma",
  "chapitre": "Pourcentages",
  "notion": "Calcul d'un pourcentage",
  "concours": [],
  "difficulte": 1,
  "type": "calcul",
  "enonce": "Combien font 15 % de 2 000 FCFA ?",
  "choix": ["150", "200", "300", "1 500"],
  "reponse": 2,
  "explication": "2 000 × 15 / 100 = 300 FCFA.",
  "astuce": "10 % = 200, 5 % = 100, donc 15 % = 300."
}
```

`reponse` est la position de la bonne réponse dans `choix`, en comptant à partir de 0. `concours` vide signifie : tous les concours qui ont cette matière.

## Ce qui est simulé dans cette V1

- Les autres candidats (ligue, classements, rang à l'examen blanc) et l'équipe.
- Le paiement Orange Money et Moov Money.
- L'explication « autrement » de l'IA.
- Les dates des concours (nombre de jours fixe) et les coefficients, à remplacer par les communiqués officiels.

Ces éléments viendront avec le serveur (étape 3 de la démarche).
