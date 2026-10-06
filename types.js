// Type d'échéance → pastille (couleur + libellé).
// Pour ajouter un type : ajouter une entrée ici, rien d'autre à modifier.
// L'ordre des entrées est celui de la légende.

export const TYPES = {
  ecrit: { color: "#f0b232", label: "Écrit à rendre" },
  oral: { color: "#a855f7", label: "Oral" },
  examen: { color: "#3ba55d", label: "Devoir sur table" },
  memoire: { color: "#f57731", label: "Mémoire" },
};

// Pastille utilisée si le type est absent ou inconnu.
const FALLBACK = { color: "#949ba4", label: "Autre" };

export function resolveType(name) {
  return TYPES[name] ?? FALLBACK;
}
