# Calendrier MDPI2

Extension Chrome affichant les échéances du Master 2 : projets à rendre et
devoirs sur table. Le calendrier lit `events.json` sur ce dépôt ; une
modification apparaît dans l'extension en 5 minutes maximum (cache GitHub).

## Installation

1. `Code` → `Download ZIP`, puis décompresser le dossier.
2. Ouvrir `chrome://extensions` et activer le **mode développeur**.
3. **Charger l'extension non empaquetée** → choisir le dossier décompressé.

## Pastilles

| Pastille | `type` | Signification |
|---|---|---|
| 🟣 violet | `projet` | Projet à rendre |
| 🟢 vert | `examen` | Devoir sur table |

## Format d'`events.json`

```json
{
  "date": "2026-12-04",
  "type": "projet",
  "matiere": "Fiscalité",
  "titre": "Rendu écrit",
  "details": "Texte libre, facultatif",
  "time": "14:00"
}
```

- `date` : obligatoire, au format `AAAA-MM-JJ`.
- `time` : facultatif, au format `HH:MM`. Sans heure connue, ne pas mettre le champ.
- `details` : facultatif (sujets, consignes, salle…).
