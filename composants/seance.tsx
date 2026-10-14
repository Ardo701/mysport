"use client";

import Link from "next/link";
import { IconeChevronDroite } from "./icones";
import { detailExercice, libelleDuree, resumeExercices, type Seance } from "@/lib/seances";

/**
 * Une séance sur une ligne : le jour en marge, ce qui a été fait, ce que ça a
 * coûté. Toute la ligne ouvre la séance, pour la corriger ou la supprimer.
 */
export function LigneSeance({ seance }: { seance: Seance }) {
  const d = new Date(`${seance.date}T12:00:00`);
  const jour = d.getDate();
  const jourSemaine = d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");

  return (
    <Link
      href={`/seance?id=${seance._id}`}
      className="group flex items-center gap-4 border-t border-trait py-3.5"
    >
      <div className="w-10 shrink-0 text-center">
        <p className="chiffres titre text-[20px] font-semibold leading-none">{jour}</p>
        <p className="surtitre mt-1.5">{jourSemaine}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium">{resumeExercices(seance)}</p>
        <p className="chiffres mt-1.5 text-[12px] text-brume">
          {libelleDuree(seance.dureeMin)}
          <span className="mx-1.5 text-brume-faible">·</span>
          {seance.kcal} kcal
        </p>
      </div>
      <IconeChevronDroite className="h-4 w-4 shrink-0 text-brume-faible transition-colors group-hover:text-encre" />
    </Link>
  );
}

/**
 * Le contenu d'une séance, exercice par exercice : ce qu'on vient chercher
 * quand on se demande ce qu'on a fait tel jour, et avec quelle charge.
 */
export function DetailSeance({ seance }: { seance: Seance }) {
  if (seance.exercices.length === 0 && !seance.notes) return null;
  return (
    <div className="mb-2 ml-14">
      <ul className="space-y-1.5">
        {seance.exercices.map((e, i) => {
          const detail = detailExercice(e);
          return (
            <li key={i} className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="text-brume">{e.nom}</span>
              {detail && <span className="chiffres shrink-0 text-right">{detail}</span>}
            </li>
          );
        })}
      </ul>
      {seance.notes && (
        <p className="mt-2.5 text-[12px] italic leading-relaxed text-brume-faible">
          {seance.notes}
        </p>
      )}
    </div>
  );
}
