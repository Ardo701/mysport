/** Dates au format YYYY-MM-DD, calées sur le fuseau de l'appareil. */

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

export const JOURS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

export const JOURS_COURTS = ["L", "M", "M", "J", "V", "S", "D"];

export function libelleDate(dateISO: string): string {
  const d = new Date(`${dateISO}T12:00:00`);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** « 12 octobre », avec l'année quand ce n'est pas celle en cours : « 3 mars 2025 ». */
export function libelleJour(dateISO: string): string {
  const d = new Date(`${dateISO}T12:00:00`);
  const autreAnnee = d.getFullYear() !== new Date().getFullYear();
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: autreAnnee ? "numeric" : undefined,
  });
}

export function libelleDateCourt(dateISO: string): string {
  const d = new Date(`${dateISO}T12:00:00`);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function libelleRelatif(dateISO: string): string {
  const today = aujourdhuiISO();
  if (dateISO === today) return "Aujourd'hui";
  if (dateISO === ajouterJours(today, -1)) return "Hier";
  if (dateISO === ajouterJours(today, 1)) return "Demain";
  return libelleDate(dateISO);
}

export function minutesEnHeures(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

export function lundiDeLaSemaine(dateISO: string): string {
  return ajouterJours(dateISO, -(jourDeLaSemaine(dateISO) - 1));
}

export function differenceEnJours(depuisISO: string, jusquISO: string): number {
  const a = Date.parse(`${depuisISO}T12:00:00Z`);
  const b = Date.parse(`${jusquISO}T12:00:00Z`);
  return Math.round((b - a) / 86400000);
}

/** « octobre 2026 ». */
export function libelleMois(dateISO: string): string {
  const d = new Date(`${dateISO}T12:00:00`);
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

/** Premier jour du mois de la date, décalé de `mois` mois. */
export function debutDeMois(dateISO: string, mois = 0): string {
  const [a, m] = dateISO.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + mois, 1, 12));
  return d.toISOString().slice(0, 10);
}
