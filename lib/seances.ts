/**
 * Lecture des séances : résumés à afficher et totaux pour les statistiques.
 *
 * Tout se calcule côté client à partir de la liste complète, que la requête
 * renvoie déjà triée de la plus récente à la plus ancienne. À quelques séances
 * par semaine, recompter à chaque rendu ne coûte rien, et évite de tenir à
 * jour en base des totaux qui finiraient par diverger des séances.
 */

import type { Doc } from "@/convex/_generated/dataModel";
import { ID_PERSO, exerciceDuCatalogue, libelleMateriel } from "@/convex/data/exercices";
import { LOCALES, type Langue } from "@/convex/data/langues";
import { estimerParts, type PartsKcal } from "@/convex/lib/calories";
import { ajouterJours, lundiDeLaSemaine } from "./dates";

export type Seance = Doc<"seances">;
export type ExerciceSaisi = Seance["exercices"][number];

/** 45 → « 45 min », 75 → « 1 h 15 » ou « 1h 15m ». */
export function libelleDuree(minutes: number, langue: Langue): string {
  const m = Math.round(minutes);
  if (m < 60) return `${m} min`;
  const heures = Math.floor(m / 60);
  const reste = m % 60;
  if (langue === "en") return reste === 0 ? `${heures}h` : `${heures}h ${reste}m`;
  return reste === 0 ? `${heures} h` : `${heures} h ${String(reste).padStart(2, "0")}`;
}

/**
 * Nombre dans les usages de la langue, sans décimale superflue : 1,5 en
 * français, 1.5 en anglais, et jamais 1.50.
 */
export function nombre(n: number, langue: Langue, decimales = 1): string {
  return n.toLocaleString(LOCALES[langue], { maximumFractionDigits: decimales });
}

/**
 * Le nom d'un exercice dans la langue de l'interface. Celui du catalogue
 * quand il en vient : la séance a gardé le nom français du jour de la
 * saisie. Un exercice hors liste garde le nom qu'on lui a tapé.
 */
export function nomExercice(e: { exerciceId: string; nom: string }, langue: Langue): string {
  const catalogue = e.exerciceId === ID_PERSO ? undefined : exerciceDuCatalogue(e.exerciceId);
  return catalogue ? catalogue.nom[langue] : e.nom;
}

/**
 * « 4 × 8 · barre 80 kg », « 5 × 20 · poids du corps », « 3 × 45 s »,
 * « 30 min · 5 km » : ce qui a été saisi, rien de plus.
 */
export function detailExercice(e: ExerciceSaisi, langue: Langue): string {
  const morceaux: string[] = [];
  if (e.mesure === "duree") {
    if (e.dureeMin) morceaux.push(libelleDuree(e.dureeMin, langue));
    if (e.distanceKm) morceaux.push(`${nombre(e.distanceKm, langue, 2)} km`);
    return morceaux.join(" · ");
  }

  const quantite = e.mesure === "maintien" ? (e.secondes ? `${e.secondes} s` : null) : (e.repetitions ?? null);
  if (e.series && quantite !== null) morceaux.push(`${e.series} × ${quantite}`);
  else if (e.series) morceaux.push(compte(e.series, langue, ["série", "séries"], ["set", "sets"]));
  else if (quantite !== null) morceaux.push(String(quantite));

  // Les séances notées avant l'arrivée du matériel n'ont que la charge.
  const materiel = e.materiel ? libelleMateriel(e.materiel, langue, "court") : null;
  const charge = e.chargeKg ? `${nombre(e.chargeKg, langue)} kg` : null;
  if (materiel || charge) morceaux.push([materiel, charge].filter(Boolean).join(" "));
  return morceaux.join(" · ");
}

/**
 * Un nombre et son nom, accordé : « 1 séance », « 0 séance », « 3 séances »
 * en français, où le pluriel commence à deux ; « 1 workout », « 0 workouts »
 * en anglais, où il commence partout ailleurs qu'à un.
 */
export function compte(
  n: number,
  langue: Langue,
  fr: [singulier: string, pluriel: string],
  en: [singulier: string, pluriel: string],
): string {
  const [singulier, pluriel] = langue === "fr" ? fr : en;
  const pluralise = langue === "fr" ? n > 1 : n !== 1;
  return `${nombre(n, langue)} ${pluralise ? pluriel : singulier}`;
}

/** « 3 séances », « 3 workouts » : le compte qui revient sur toutes les pages. */
export function compteSeances(n: number, langue: Langue): string {
  return compte(n, langue, ["séance", "séances"], ["workout", "workouts"]);
}

/** Les noms des exercices, coupés au-delà de `max` : « Squat · Fentes · +3 ». */
export function resumeExercices(s: Seance, langue: Langue, max = 3): string {
  if (s.exercices.length === 0) return langue === "fr" ? "Séance sans détail" : "Workout, no details";
  const noms = s.exercices.slice(0, max).map((e) => nomExercice(e, langue));
  const reste = s.exercices.length - max;
  return reste > 0 ? `${noms.join(" · ")} · +${reste}` : noms.join(" · ");
}

/** Séances dont la date tombe entre `debut` et `fin`, bornes comprises. */
export function entre(seances: Seance[], debut: string, fin: string): Seance[] {
  return seances.filter((s) => s.date >= debut && s.date <= fin);
}

export type Totaux = {
  seances: number;
  jours: number;
  dureeMin: number;
  kcal: number;
};

export function totaux(seances: Seance[]): Totaux {
  return {
    seances: seances.length,
    jours: new Set(seances.map((s) => s.date)).size,
    dureeMin: seances.reduce((t, s) => t + s.dureeMin, 0),
    kcal: seances.reduce((t, s) => t + s.kcal, 0),
  };
}

/**
 * Semaines du lundi au dimanche, de la plus ancienne à celle de `fin`.
 * Une semaine sans séance figure quand même, à zéro : c'est un creux à voir.
 */
export function parSemaine(seances: Seance[], fin: string, nombreSemaines: number) {
  const derniere = lundiDeLaSemaine(fin);
  return Array.from({ length: nombreSemaines }, (_, i) => {
    const lundi = ajouterJours(derniere, -7 * (nombreSemaines - 1 - i));
    const semaine = entre(seances, lundi, ajouterJours(lundi, 6));
    return { lundi, ...totaux(semaine) };
  });
}

/** Exercices classés par nombre de séances où ils figurent. */
export function exercicesFrequents(seances: Seance[], limite: number) {
  const parCle = new Map<string, { cle: string; exerciceId: string; nom: string; seances: number }>();
  for (const s of seances) {
    // Un exercice saisi deux fois dans la même séance n'y compte qu'une fois.
    const vus = new Set<string>();
    for (const e of s.exercices) {
      const cle = e.exerciceId === ID_PERSO ? `perso:${e.nom.toLowerCase()}` : e.exerciceId;
      if (vus.has(cle)) continue;
      vus.add(cle);
      const ligne = parCle.get(cle) ?? { cle, exerciceId: e.exerciceId, nom: e.nom, seances: 0 };
      ligne.seances += 1;
      parCle.set(cle, ligne);
    }
  }
  return [...parCle.values()].sort((a, b) => b.seances - a.seances).slice(0, limite);
}

/**
 * Où sont passées les calories : musculation, cardio et sports, ou séances
 * notées sans détail. Chaque séance est découpée selon son estimation, puis
 * ramenée à sa dépense enregistrée pour que les parts tombent juste.
 */
export function repartition(seances: Seance[]): PartsKcal {
  const total: PartsKcal = { musculation: 0, cardio: 0, sansDetail: 0 };
  for (const s of seances) {
    const parts = estimerParts(s, s.poidsKg ?? 75);
    const somme = parts.musculation + parts.cardio + parts.sansDetail;
    if (somme <= 0) continue;
    for (const cle of ["musculation", "cardio", "sansDetail"] as const) {
      total[cle] += (parts[cle] / somme) * s.kcal;
    }
  }
  return total;
}
