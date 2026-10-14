/**
 * Lecture des séances : résumés à afficher et totaux pour les statistiques.
 *
 * Tout se calcule côté client à partir de la liste complète, que la requête
 * renvoie déjà triée de la plus récente à la plus ancienne. À quelques séances
 * par semaine, recompter à chaque rendu ne coûte rien, et évite de tenir à
 * jour en base des totaux qui finiraient par diverger des séances.
 */

import type { Doc } from "@/convex/_generated/dataModel";
import { ajouterJours, lundiDeLaSemaine } from "./dates";

export type Seance = Doc<"seances">;
export type ExerciceSaisi = Seance["exercices"][number];

/** 45 → « 45 min », 75 → « 1 h 15 ». */
export function libelleDuree(minutes: number): string {
  const m = Math.round(minutes);
  if (m < 60) return `${m} min`;
  const reste = m % 60;
  return reste === 0 ? `${Math.floor(m / 60)} h` : `${Math.floor(m / 60)} h ${String(reste).padStart(2, "0")}`;
}

/** Nombre à la française, sans décimale superflue : 1,5 et non 1.50. */
export function nombre(n: number, decimales = 1): string {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: decimales });
}

/** « 4 × 8 · 80 kg », « 3 × 45 s », « 30 min · 5 km » — ce qui a été saisi, rien de plus. */
export function detailExercice(e: ExerciceSaisi): string {
  const morceaux: string[] = [];
  if (e.mesure === "duree") {
    if (e.dureeMin) morceaux.push(libelleDuree(e.dureeMin));
    if (e.distanceKm) morceaux.push(`${nombre(e.distanceKm, 2)} km`);
  } else {
    const quantite = e.mesure === "maintien" ? (e.secondes ? `${e.secondes} s` : null) : (e.repetitions ?? null);
    if (e.series && quantite !== null) morceaux.push(`${e.series} × ${quantite}`);
    else if (e.series) morceaux.push(`${e.series} séries`);
    else if (quantite !== null) morceaux.push(String(quantite));
    if (e.chargeKg) morceaux.push(`${nombre(e.chargeKg)} kg`);
  }
  return morceaux.join(" · ");
}

/** Les noms des exercices, coupés au-delà de `max` : « Squat · Fentes · +3 ». */
export function resumeExercices(s: Seance, max = 3): string {
  if (s.exercices.length === 0) return "Séance sans détail";
  const noms = s.exercices.slice(0, max).map((e) => e.nom);
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
  const compte = new Map<string, { nom: string; seances: number }>();
  for (const s of seances) {
    // Un exercice saisi deux fois dans la même séance n'y compte qu'une fois.
    const vus = new Set<string>();
    for (const e of s.exercices) {
      const cle = e.exerciceId === "perso" ? `perso:${e.nom.toLowerCase()}` : e.exerciceId;
      if (vus.has(cle)) continue;
      vus.add(cle);
      const ligne = compte.get(cle) ?? { nom: e.nom, seances: 0 };
      ligne.seances += 1;
      compte.set(cle, ligne);
    }
  }
  return [...compte.values()].sort((a, b) => b.seances - a.seances).slice(0, limite);
}
