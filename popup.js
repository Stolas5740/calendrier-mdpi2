import { getEvents } from "./data.js";
import { TYPES, resolveType } from "./types.js";

const MAX_DOTS = 4;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const monthFormatter = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
const dayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const shortFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" });

const els = {
  monthLabel: document.getElementById("month-label"),
  prev: document.getElementById("prev-month"),
  next: document.getElementById("next-month"),
  weekdays: document.getElementById("weekdays"),
  grid: document.getElementById("grid"),
  panelTitle: document.getElementById("panel-title"),
  dayList: document.getElementById("day-list"),
  monthTitle: document.getElementById("month-title"),
  monthList: document.getElementById("month-list"),
  legend: document.getElementById("legend"),
};

const today = new Date();
const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

const state = {
  year: today.getFullYear(),
  month: today.getMonth(),
  selected: todayKey,
  /** Échéances triées par date puis heure. */
  events: [],
  /** @type {Map<string, Array>} */
  eventsByDate: new Map(),
  error: null,
};

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Nombre de jours entre deux clés de date, sans être faussé par le changement d'heure. */
function daysBetween(fromKey, toKey) {
  const utc = (key) => {
    const [year, month, day] = key.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((utc(toKey) - utc(fromKey)) / DAY_MS);
}

function countdown(key) {
  const days = daysBetween(todayKey, key);
  if (days < 0) return "Passé";
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  return `J-${days}`;
}

function eventLabel(event) {
  return [event.matiere, event.titre].filter(Boolean).join(" — ");
}

function sortEvents(events) {
  // Les échéances sans heure passent après celles qui en ont une, le même jour.
  return [...events].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      (a.time === null) - (b.time === null) ||
      (a.time ?? "").localeCompare(b.time ?? "") ||
      eventLabel(a).localeCompare(eventLabel(b))
  );
}

function indexByDate(events) {
  const byDate = new Map();
  for (const event of events) {
    const list = byDate.get(event.date) ?? [];
    list.push(event);
    byDate.set(event.date, list);
  }
  return byDate;
}

function makeDot(type) {
  const dot = document.createElement("span");
  dot.className = "dot";
  dot.style.background = resolveType(type).color;
  return dot;
}

function makeSpan(className, text) {
  const span = document.createElement("span");
  span.className = className;
  span.textContent = text;
  return span;
}

function makeMessage(text) {
  const item = document.createElement("li");
  item.className = "empty";
  item.textContent = text;
  return item;
}

function renderWeekdays() {
  els.weekdays.replaceChildren(...WEEKDAYS.map((label) => makeSpan("weekday", label)));
}

function renderLegend() {
  els.legend.replaceChildren(
    ...Object.entries(TYPES).map(([type, { label }]) => {
      const entry = makeSpan("legend-entry", "");
      entry.append(makeDot(type), label);
      return entry;
    })
  );
}

function renderGrid() {
  const { year, month } = state;
  els.monthLabel.textContent = monthFormatter.format(new Date(year, month, 1));

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay() : 0 = dimanche. On décale pour une semaine commençant le lundi.
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const cellCount = Math.ceil((offset + daysInMonth) / 7) * 7;

  const cells = [];
  for (let i = 0; i < cellCount; i++) {
    const date = new Date(year, month, i - offset + 1);
    const key = dateKey(date.getFullYear(), date.getMonth(), date.getDate());

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "day";
    cell.dataset.date = key;
    if (date.getMonth() !== month) cell.classList.add("outside");
    if (key === todayKey) cell.classList.add("today");
    if (key === state.selected) cell.classList.add("selected");

    cell.append(makeSpan("day-number", String(date.getDate())));

    const events = state.eventsByDate.get(key) ?? [];
    if (events.length > 0) {
      const dots = makeSpan("dots", "");
      for (const event of events.slice(0, MAX_DOTS)) dots.append(makeDot(event.type));
      if (events.length > MAX_DOTS) dots.append(makeSpan("dots-more", `+${events.length - MAX_DOTS}`));
      cell.append(dots);
    }

    cells.push(cell);
  }

  els.grid.replaceChildren(...cells);
}

function renderDayPanel() {
  els.panelTitle.textContent = dayFormatter.format(parseKey(state.selected));

  if (state.error) {
    els.dayList.replaceChildren(makeMessage(state.error));
    return;
  }

  const events = state.eventsByDate.get(state.selected) ?? [];
  if (events.length === 0) {
    els.dayList.replaceChildren(makeMessage("Rien de prévu ce jour-là."));
    return;
  }

  els.dayList.replaceChildren(
    ...events.map((event) => {
      const item = document.createElement("li");
      item.className = "entry";

      const body = makeSpan("entry-body", "");
      body.append(makeSpan("entry-title", eventLabel(event)));
      const meta = [resolveType(event.type).label, event.time].filter(Boolean).join(" · ");
      body.append(makeSpan("entry-meta", meta));
      if (event.details) body.append(makeSpan("entry-details", event.details));

      item.append(makeDot(event.type), body);
      return item;
    })
  );
}

/** Ligne cliquable d'une échéance : pastille, intitulé, date, compte à rebours. */
function makeEventRow(event) {
  const row = document.createElement("button");
  row.type = "button";
  row.className = "event-row";
  if (event.date < todayKey) row.classList.add("past");
  row.title = `Afficher le ${dayFormatter.format(parseKey(event.date))}`;
  row.append(
    makeDot(event.type),
    makeSpan("event-name", eventLabel(event)),
    makeSpan("event-date", shortFormatter.format(parseKey(event.date))),
    makeSpan("event-countdown", countdown(event.date))
  );
  row.addEventListener("click", () => selectDate(event.date));

  const item = document.createElement("li");
  item.append(row);
  return item;
}

/** Échéances du mois affiché dans la grille. */
function renderMonthList() {
  const monthName = monthFormatter.format(new Date(state.year, state.month, 1));
  els.monthTitle.textContent = `À faire en ${monthName}`;

  if (state.error) {
    els.monthList.replaceChildren();
    return;
  }

  const monthStart = dateKey(state.year, state.month, 1);
  const prefix = monthStart.slice(0, 7);
  const inMonth = state.events.filter((event) => event.date.startsWith(prefix));
  if (inMonth.length > 0) {
    els.monthList.replaceChildren(...inMonth.map(makeEventRow));
    return;
  }

  // Mois vide : on indique la prochaine échéance pour ne pas laisser le panneau muet.
  const from = monthStart > todayKey ? monthStart : todayKey;
  const next = state.events.find((event) => event.date >= from);
  if (!next) {
    els.monthList.replaceChildren(makeMessage(`Rien de prévu en ${monthName}.`));
    return;
  }
  els.monthList.replaceChildren(makeMessage(`Rien de prévu en ${monthName}. Prochaine échéance :`), makeEventRow(next));
}

function renderMonth() {
  renderGrid();
  renderMonthList();
}

function selectDate(key) {
  state.selected = key;
  const date = parseKey(key);
  state.year = date.getFullYear();
  state.month = date.getMonth();
  renderMonth();
  renderDayPanel();
}

function shiftMonth(delta) {
  const date = new Date(state.year, state.month + delta, 1);
  state.year = date.getFullYear();
  state.month = date.getMonth();
  renderMonth();
}

els.prev.addEventListener("click", () => shiftMonth(-1));
els.next.addEventListener("click", () => shiftMonth(1));

els.grid.addEventListener("click", (event) => {
  const cell = event.target.closest(".day");
  if (cell) selectDate(cell.dataset.date);
});

async function init() {
  renderWeekdays();
  renderLegend();
  try {
    state.events = sortEvents(await getEvents());
    state.eventsByDate = indexByDate(state.events);
  } catch (error) {
    console.error(error);
    state.error = "Impossible de charger les échéances.";
  }
  renderMonth();
  renderDayPanel();
}

init();
