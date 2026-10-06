// Module d'accès aux données.
// Le reste de l'extension n'utilise QUE `getEvents()`.
//
// Source : events.json du dépôt GitHub. GitHub sert ce fichier avec un cache
// de 5 minutes (et ignore les paramètres d'URL), donc une modification met
// jusqu'à 5 minutes à apparaître dans le calendrier.

const EVENTS_URL = "https://raw.githubusercontent.com/Stolas5740/calendrier-mdpi2/main/events.json";

const LOCAL_SOURCE = "events.json";

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`${url} : HTTP ${response.status}`);
  return response.json();
}

/** Seule fonction à remplacer pour changer de source de données. */
async function loadRawEvents() {
  try {
    return await fetchJson(EVENTS_URL);
  } catch (error) {
    // Hors ligne ou GitHub injoignable : on retombe sur la copie livrée avec
    // l'extension plutôt que d'afficher un calendrier vide.
    console.warn("Source distante injoignable, repli sur le fichier local :", error);
    return fetchJson(LOCAL_SOURCE);
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEvent(raw) {
  if (!raw || typeof raw !== "object" || !DATE_RE.test(raw.date)) return null;
  const matiere = text(raw.matiere);
  const titre = text(raw.titre);
  if (!matiere && !titre) return null;

  return {
    date: raw.date,
    // Heure facultative : absente, on n'en affiche aucune.
    time: TIME_RE.test(raw.time) ? raw.time : null,
    type: text(raw.type),
    matiere,
    titre,
    details: text(raw.details),
  };
}

/**
 * Retourne la liste des échéances, normalisée et validée.
 * @returns {Promise<Array<{date: string, time: string|null, type: string,
 *                          matiere: string, titre: string, details: string}>>}
 */
export async function getEvents() {
  const raw = await loadRawEvents();
  if (!Array.isArray(raw)) throw new Error("Format invalide : un tableau d'échéances est attendu.");

  const events = [];
  for (const item of raw) {
    const event = normalizeEvent(item);
    if (event) events.push(event);
    else console.warn("Échéance ignorée (format invalide) :", item);
  }
  return events;
}
