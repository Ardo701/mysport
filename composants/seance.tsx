"use client";

import Link from "next/link";
import { libelleRessentiApres, libelleRessentiAvant } from "@/convex/data/ressentis";
import { libelleJourCourt } from "@/lib/dates";
import {
  detailExercice,
  libelleDuree,
  nombre,
  nomExercice,
  resumeExercices,
  type Seance,
} from "@/lib/seances";
import { useLangue, type Langue } from "./langue";

/**
 * Une séance sur une ligne, à poser dans une boîte : le jour en marge, ce qui
 * a été fait et comment on l'a vécu, et ce que ça a coûté, aligné à droite
 * comme sur un relevé. Toute la ligne ouvre la séance, pour la corriger ou la
 * supprimer.
 */
export function LigneSeance({ seance }: { seance: Seance }) {
  const { langue } = useLangue();
  const ressenti = resumeRessenti(seance, langue);

  return (
    <Link
      href={`/seance?id=${seance._id}`}
      className="flex items-center gap-3.5 px-4 py-3 transition-colors hover:bg-creux"
    >
      <JourMarge date={seance.date} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium">{resumeExercices(seance, langue)}</p>
        <p className="mt-0.5 truncate text-[13px] text-brume">
          {libelleDuree(seance.dureeMin, langue)}
          {ressenti && ` · ${ressenti}`}
        </p>
      </div>
      <p className="titre shrink-0 text-right text-[16px] font-semibold leading-tight">
        {nombre(seance.kcal, langue)}
        <span className="block font-sans text-[11px] font-medium text-brume">kcal</span>
      </p>
    </Link>
  );
}

/** Un jour sans séance, aligné sur les lignes de séance : repos, ou pas encore venu. */
export function LigneRepos({ date, avenir }: { date: string; avenir: boolean }) {
  const { t } = useLangue();
  return (
    <div className="flex items-center gap-3.5 px-4 py-2.5 text-brume">
      <JourMarge date={date} discret />
      <p className="text-[14px]">{avenir ? t("À venir", "Coming up") : t("Repos", "Rest")}</p>
    </div>
  );
}

function JourMarge({ date, discret = false }: { date: string; discret?: boolean }) {
  const { langue } = useLangue();
  return (
    <div className="w-[34px] shrink-0 text-center">
      <p
        className={`titre leading-none ${discret ? "text-[15px] font-medium" : "text-[19px] font-semibold"}`}
      >
        {Number(date.slice(8))}
      </p>
      <p className="mt-1 text-[11px] font-medium text-brume">{libelleJourCourt(date, langue)}</p>
    </div>
  );
}

/**
 * « motivé, puis au top » quand les deux sont notés ; sinon celui qui l'est,
 * situé dans la séance.
 */
function resumeRessenti(seance: Seance, langue: Langue): string | null {
  const avant =
    seance.ressentiAvant && libelleRessentiAvant(seance.ressentiAvant, langue).toLowerCase();
  const apres =
    seance.ressentiApres && libelleRessentiApres(seance.ressentiApres, langue).toLowerCase();
  const fr = langue === "fr";
  if (avant && apres) return fr ? `${avant}, puis ${apres}` : `${avant}, then ${apres}`;
  if (avant) return fr ? `${avant} au départ` : `${avant} at the start`;
  if (apres) return fr ? `${apres} à la fin` : `${apres} at the end`;
  return null;
}

/**
 * Le contenu d'une séance, exercice par exercice, sous sa ligne : ce qu'on
 * vient chercher quand on se demande ce qu'on a fait tel jour, et avec quelle
 * charge.
 */
export function DetailSeance({ seance }: { seance: Seance }) {
  const { langue } = useLangue();
  if (seance.exercices.length === 0 && !seance.notes) return null;
  return (
    <div className="pb-3.5 pl-16 pr-4">
      <ul className="space-y-1.5">
        {seance.exercices.map((e, i) => {
          const detail = detailExercice(e, langue);
          return (
            <li key={i} className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="text-brume">{nomExercice(e, langue)}</span>
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
