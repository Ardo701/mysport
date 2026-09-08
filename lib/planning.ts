/** Ce que le planning donne pour une date : horaires, repas, entraînement. */

import { ajouterJours, jourDeLaSemaine } from "./dates";
import { TYPES_REPAS } from "./repas";

export type PlanningLocal = {
  heureLever: string;
  heureCoucher: string;
  objectifSommeilH: number;
  repas: { type: string; heure: string; actif: boolean }[];
  entrainements: { jour: number; heure: string; seanceId: string }[];
};

export type SeanceProgramme = {
  id: string;
  nom: string;
  focus: string;
  dureeMin: number;
};

export type NatureEvenement = "lever" | "repas" | "seance" | "coucher";

export type Evenement = {
  cle: string;
  heure: string;
  libelle: string;
  detail?: string;
  nature: NatureEvenement;
};

export function creneauDuJour(planning: PlanningLocal, dateISO: string) {
  return planning.entrainements.find(
    (c) => c.jour === jourDeLaSemaine(dateISO),
  );
}

export function seanceDuJour(
  planning: PlanningLocal,
  seances: SeanceProgramme[],
  dateISO: string,
): { creneau: { heure: string; seanceId: string }; seance?: SeanceProgramme } | null {
  const creneau = creneauDuJour(planning, dateISO);
  if (!creneau) return null;
  return { creneau, seance: seances.find((s) => s.id === creneau.seanceId) };
}

function minutes(heure: string): number {
  const [h, m] = heure.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Journée type d'une date, dans l'ordre où elle se vit.
 *
 * L'ordre part du lever plutôt que de minuit : un coucher à 00 h 30 appartient
 * à la fin de la journée, pas à son début.
 */
export function evenementsDuJour(
  planning: PlanningLocal,
  seances: SeanceProgramme[],
  dateISO: string,
): Evenement[] {
  const evenements: Evenement[] = [
    {
      cle: "lever",
      heure: planning.heureLever,
      libelle: "Lever",
      nature: "lever",
    },
  ];

  for (const type of TYPES_REPAS) {
    const ligne = planning.repas.find((r) => r.type === type.cle);
    if (!ligne || !ligne.actif) continue;
    evenements.push({
      cle: `repas-${type.cle}`,
      heure: ligne.heure,
      libelle: type.libelle,
      detail:
        type.cle === "dejeuner" ? "Repas libre, photo ou description" : undefined,
      nature: "repas",
    });
  }

  const entrainement = seanceDuJour(planning, seances, dateISO);
  if (entrainement) {
    evenements.push({
      cle: "seance",
      heure: entrainement.creneau.heure,
      libelle: entrainement.seance?.nom ?? "Séance",
      detail: entrainement.seance
        ? `${entrainement.seance.focus} · ${entrainement.seance.dureeMin} min`
        : undefined,
      nature: "seance",
    });
  }

  evenements.push({
    cle: "coucher",
    heure: planning.heureCoucher,
    libelle: "Coucher",
    nature: "coucher",
  });

  const depart = minutes(planning.heureLever);
  return evenements.sort((a, b) => {
    const ma = (minutes(a.heure) - depart + 1440) % 1440;
    const mb = (minutes(b.heure) - depart + 1440) % 1440;
    return ma - mb;
  });
}

/** Les sept dates de la semaine contenant `dateISO`, du lundi au dimanche. */
export function semaineDe(dateISO: string): string[] {
  const lundi = ajouterJours(dateISO, -(jourDeLaSemaine(dateISO) - 1));
  return Array.from({ length: 7 }, (_, i) => ajouterJours(lundi, i));
}

export function joursDuMois(dateISO: string): number {
  const [annee, mois] = dateISO.split("-").map(Number);
  return new Date(annee, mois, 0).getDate();
}

/**
 * Grille du mois, complétée par les jours voisins pour tomber sur des semaines
 * entières. Le nombre de lignes suit le mois : pas de semaine vide en bas.
 */
export function grilleDuMois(dateISO: string): string[] {
  const premier = `${dateISO.slice(0, 7)}-01`;
  const decalage = jourDeLaSemaine(premier) - 1;
  const debut = ajouterJours(premier, -decalage);
  const cases = Math.ceil((decalage + joursDuMois(dateISO)) / 7) * 7;
  return Array.from({ length: cases }, (_, i) => ajouterJours(debut, i));
}

export function memeMois(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

export function ajouterMois(dateISO: string, n: number): string {
  const [annee, mois, jour] = dateISO.split("-").map(Number);
  const d = new Date(annee, mois - 1 + n, 1);
  const dernier = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const j = String(Math.min(jour, dernier)).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${j}`;
}

function majuscule(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

export function libelleMois(dateISO: string): string {
  return majuscule(
    new Date(`${dateISO}T12:00:00`).toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    }),
  );
}

/** « 8 – 14 septembre », ou « 29 sept. – 5 oct. » à cheval sur deux mois. */
export function libelleSemaine(dateISO: string): string {
  const jours = semaineDe(dateISO);
  const debut = new Date(`${jours[0]}T12:00:00`);
  const fin = new Date(`${jours[6]}T12:00:00`);
  const memeM = memeMois(jours[0], jours[6]);
  return `${debut.toLocaleDateString("fr-FR", {
    day: "numeric",
    ...(memeM ? {} : { month: "short" }),
  })} – ${fin.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: memeM ? "long" : "short",
  })}`;
}
