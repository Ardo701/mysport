/** Dates au format YYYY-MM-DD, calées sur le fuseau de l'appareil. */

import { LOCALES, type Langue } from "@/convex/data/langues";

export function aujourdhuiISO(): string {
  const d = new Date();
  const decalage = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - decalage).toISOString().slice(0, 10);
}

export function ajouterJours(dateISO: string, jours: number): string {
  const d = new Date(`${dateISO}T12:00:00`);
  d.setDate(d.getDate() + jours);
  const decalage = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - decalage).toISOString().slice(0, 10);
}

export function jourDeLaSemaine(dateISO: string): number {
  const js = new Date(`${dateISO}T12:00:00`).getDay();
  return js === 0 ? 7 : js;
}

/** Initiales des jours, du lundi au dimanche. */
export function joursCourts(langue: Langue): string[] {
  return langue === "fr"
    ? ["L", "M", "M", "J", "V", "S", "D"]
    : ["M", "T", "W", "T", "F", "S", "S"];
}

function formater(dateISO: string, langue: Langue, options: Intl.DateTimeFormatOptions) {
  return new Date(`${dateISO}T12:00:00`).toLocaleDateString(LOCALES[langue], options);
}

/** « mercredi 14 octobre », « Wednesday 14 October ». */
export function libelleDate(dateISO: string, langue: Langue): string {
  return formater(dateISO, langue, { weekday: "long", day: "numeric", month: "long" });
}

/** « 12 octobre », avec l'année quand ce n'est pas celle en cours : « 3 mars 2025 ». */
export function libelleJour(dateISO: string, langue: Langue): string {
  const autreAnnee = dateISO.slice(0, 4) !== String(new Date().getFullYear());
  return formater(dateISO, langue, {
    day: "numeric",
    month: "long",
    year: autreAnnee ? "numeric" : undefined,
  });
}

/** « 12 oct. », « 12 Oct ». */
export function libelleDateCourt(dateISO: string, langue: Langue): string {
  return formater(dateISO, langue, { day: "numeric", month: "short" });
}

/** « mer », « Wed » : le jour en abrégé, sans le point du français. */
export function libelleJourCourt(dateISO: string, langue: Langue): string {
  return formater(dateISO, langue, { weekday: "short" }).replace(".", "");
}

export function libelleRelatif(dateISO: string, langue: Langue): string {
  const today = aujourdhuiISO();
  const fr = langue === "fr";
  if (dateISO === today) return fr ? "Aujourd'hui" : "Today";
  if (dateISO === ajouterJours(today, -1)) return fr ? "Hier" : "Yesterday";
  if (dateISO === ajouterJours(today, 1)) return fr ? "Demain" : "Tomorrow";
  return libelleDate(dateISO, langue);
}

export function lundiDeLaSemaine(dateISO: string): string {
  return ajouterJours(dateISO, -(jourDeLaSemaine(dateISO) - 1));
}

export function differenceEnJours(depuisISO: string, jusquISO: string): number {
  const a = Date.parse(`${depuisISO}T12:00:00Z`);
  const b = Date.parse(`${jusquISO}T12:00:00Z`);
  return Math.round((b - a) / 86400000);
}

/** « octobre 2026 », « October 2026 ». */
export function libelleMois(dateISO: string, langue: Langue): string {
  return formater(dateISO, langue, { month: "long", year: "numeric" });
}

/** Premier jour du mois de la date, décalé de `mois` mois. */
export function debutDeMois(dateISO: string, mois = 0): string {
  const [a, m] = dateISO.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + mois, 1, 12));
  return d.toISOString().slice(0, 10);
}
