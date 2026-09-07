/** Utilitaires de dates au format YYYY-MM-DD, en semaine commençant le lundi. */

export function jourDeLaSemaine(dateISO: string): number {
  // 1 = lundi ... 7 = dimanche
  const d = new Date(`${dateISO}T12:00:00Z`);
  const js = d.getUTCDay();
  return js === 0 ? 7 : js;
}

export function ajouterJours(dateISO: string, jours: number): string {
  const d = new Date(`${dateISO}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString().slice(0, 10);
}

export function lundiDeLaSemaine(dateISO: string): string {
  return ajouterJours(dateISO, -(jourDeLaSemaine(dateISO) - 1));
}

export function differenceEnJours(depuisISO: string, jusquISO: string): number {
  const a = Date.parse(`${depuisISO}T12:00:00Z`);
  const b = Date.parse(`${jusquISO}T12:00:00Z`);
  return Math.round((b - a) / 86400000);
}

/** Numéro de semaine du programme (1 = première semaine), borné à 12. */
export function semaineDuProgramme(debutISO: string, dateISO: string): number {
  const jours = differenceEnJours(lundiDeLaSemaine(debutISO), dateISO);
  if (jours < 0) return 1;
  return Math.min(12, Math.floor(jours / 7) + 1);
}

/** Durée d'une nuit en minutes, en gérant le passage de minuit. */
export function dureeNuitMin(heureCoucher: string, heureLever: string): number {
  const [hc, mc] = heureCoucher.split(":").map(Number);
  const [hl, ml] = heureLever.split(":").map(Number);
  let minutes = hl * 60 + ml - (hc * 60 + mc);
  if (minutes <= 0) minutes += 24 * 60;
  return minutes;
}
