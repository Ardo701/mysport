"use client";

import Link from "next/link";
import { libelleRessentiApres, libelleRessentiAvant } from "@/convex/data/ressentis";
import { detailExercice, libelleDuree, resumeExercices, type Seance } from "@/lib/seances";

/**
 * Une séance sur une ligne, à poser dans une boîte : le jour en marge, ce qui
 * a été fait et comment on l'a vécu, et ce que ça a coûté, aligné à droite
 * comme sur un relevé. Toute la ligne ouvre la séance, pour la corriger ou la
 * supprimer.
 */
export function LigneSeance({ seance }: { seance: Seance }) {
  const d = new Date(`${seance.date}T12:00:00`);
  const ressenti = resumeRessenti(seance);

  return (
    <Link
      href={`/seance?id=${seance._id}`}
      className="flex items-center gap-3.5 px-4 py-3 transition-colors hover:bg-creux"
    >
      <JourMarge date={d} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium">{resumeExercices(seance)}</p>
        <p className="mt-0.5 truncate text-[13px] text-brume">
          {libelleDuree(seance.dureeMin)}
          {ressenti && ` · ${ressenti}`}
        </p>
      </div>
      <p className="titre shrink-0 text-right text-[16px] font-semibold leading-tight">
        {seance.kcal.toLocaleString("fr-FR")}
        <span className="block font-sans text-[11px] font-medium text-brume">kcal</span>
      </p>
    </Link>
  );
}

/** Un jour sans séance, aligné sur les lignes de séance : repos, ou pas encore venu. */
export function LigneRepos({ date, avenir }: { date: string; avenir: boolean }) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-2.5 text-brume">
      <JourMarge date={new Date(`${date}T12:00:00`)} discret />
      <p className="text-[14px]">{avenir ? "À venir" : "Repos"}</p>
    </div>
  );
}

function JourMarge({ date, discret = false }: { date: Date; discret?: boolean }) {
  return (
    <div className="w-[34px] shrink-0 text-center">
      <p
        className={`titre leading-none ${discret ? "text-[15px] font-medium" : "text-[19px] font-semibold"}`}
      >
        {date.getDate()}
      </p>
      <p className="mt-1 text-[11px] font-medium text-brume">
        {date.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "")}
      </p>
    </div>
  );
}

/**
 * « motivé, puis au top » quand les deux sont notés ; sinon celui qui l'est,
 * situé dans la séance.
 */
function resumeRessenti(seance: Seance): string | null {
  const avant = seance.ressentiAvant && libelleRessentiAvant(seance.ressentiAvant).toLowerCase();
  const apres = seance.ressentiApres && libelleRessentiApres(seance.ressentiApres).toLowerCase();
  if (avant && apres) return `${avant}, puis ${apres}`;
  if (avant) return `${avant} au départ`;
  if (apres) return `${apres} à la fin`;
  return null;
}

/**
 * Le contenu d'une séance, exercice par exercice, sous sa ligne : ce qu'on
 * vient chercher quand on se demande ce qu'on a fait tel jour, et avec quelle
 * charge.
 */
export function DetailSeance({ seance }: { seance: Seance }) {
  if (seance.exercices.length === 0 && !seance.notes) return null;
  return (
    <div className="pb-3.5 pl-16 pr-4">
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
        <p className="mt-2.5 text-[13px] italic leading-relaxed text-brume">{seance.notes}</p>
      )}
    </div>
  );
}
