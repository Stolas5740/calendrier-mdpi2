// Type d'échéance → pastille (couleur + libellé).
// Pour ajouter un type : ajouter une entrée ici, rien d'autre à modifier.

export const TYPES = {
  projet: { color: "#a855f7", label: "Projet à rendre" },
  examen: { color: "#3ba55d", label: "Devoir sur table" },
};

// Pastille utilisée si le type est absent ou inconnu.
const FALLBACK = { color: "#949ba4", label: "Autre" };

export function resolveType(name) {
  return TYPES[name] ?? FALLBACK;
}
