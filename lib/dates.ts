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

export function heureCourante(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function minutesEnHeures(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

/** Durée d'une nuit en minutes, en gérant le passage de minuit. */
export function dureeNuitMin(heureCoucher: string, heureLever: string): number {
  const [hc, mc] = heureCoucher.split(":").map(Number);
  const [hl, ml] = heureLever.split(":").map(Number);
  let minutes = hl * 60 + ml - (hc * 60 + mc);
  if (minutes <= 0) minutes += 24 * 60;
  return minutes;
}
