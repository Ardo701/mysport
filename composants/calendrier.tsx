"use client";

import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Carte, Etiquette, TitreSection } from "@/composants/ui";
import {
  IconeChevronDroite,
  IconeChevronGauche,
  IconeHaltere,
} from "@/composants/icones";
import {
  JOURS,
  JOURS_COURTS,
  ajouterJours,
  aujourdhuiISO,
  jourDeLaSemaine,
  libelleDate,
  libelleRelatif,
  minutesEnHeures,
  dureeNuitMin,
} from "@/lib/dates";
import {
  ajouterMois,
  creneauDuJour,
  evenementsDuJour,
  grilleDuMois,
  libelleMois,
  libelleSemaine,
  memeMois,
  semaineDe,
  seanceDuJour,
  type Evenement,
  type PlanningLocal,
  type SeanceProgramme,
} from "@/lib/planning";

type Vue = "jour" | "semaine" | "mois";

const VUES: { cle: Vue; libelle: string }[] = [
  { cle: "jour", libelle: "Jour" },
  { cle: "semaine", libelle: "Semaine" },
  { cle: "mois", libelle: "Mois" },
];

const COULEUR_POINT: Record<Evenement["nature"], string> = {
  lever: "bg-brume-sombre",
  repas: "bg-brume",
  seance: "bg-jaune",
  coucher: "bg-brume-sombre",
};

/**
 * Calendrier du planning, à trois échelles.
 *
 * Il lit le planning en cours d'édition, pas celui enregistré : déplacer un
 * créneau se voit tout de suite sur la grille, avant même de sauvegarder.
 */
export function Calendrier({
  planning,
  seances,
}: {
  planning: PlanningLocal;
  seances: SeanceProgramme[];
}) {
  const [vue, setVue] = useState<Vue>("semaine");
  const [date, setDate] = useState<string | null>(null);
  const journaux = useQuery(api.seances.historique, { limite: 200 });

  useEffect(() => setDate(aujourdhuiISO()), []);
  if (!date) return null;

  const today = aujourdhuiISO();
  const statutDe = (jour: string) =>
    journaux?.find((l) => l.date === jour)?.statut ?? null;

  function decaler(sens: 1 | -1) {
    setDate((actuelle) => {
      if (actuelle === null) return actuelle;
      if (vue === "jour") return ajouterJours(actuelle, sens);
      if (vue === "semaine") return ajouterJours(actuelle, sens * 7);
      return ajouterMois(actuelle, sens);
    });
  }

  const titre =
    vue === "jour"
      ? libelleRelatif(date)
      : vue === "semaine"
        ? libelleSemaine(date)
        : libelleMois(date);

  return (
    <Carte>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="surtitre mb-2">Calendrier</p>
          <h2 className="titre text-[19px] font-semibold leading-none">{titre}</h2>
        </div>
        <div className="flex items-center gap-1.5">
          {date !== today && (
            <button
              onClick={() => setDate(today)}
              className="rounded-lg border border-trait bg-ardoise px-3 py-2 text-[12px] text-brume transition hover:border-jaune hover:text-craie"
            >
              Aujourd'hui
            </button>
          )}
          <button
            onClick={() => decaler(-1)}
            aria-label="Période précédente"
            className="rounded-lg border border-trait bg-ardoise p-2 text-brume transition hover:text-craie"
          >
            <IconeChevronGauche className="h-4 w-4" />
          </button>
          <button
            onClick={() => decaler(1)}
            aria-label="Période suivante"
            className="rounded-lg border border-trait bg-ardoise p-2 text-brume transition hover:text-craie"
          >
            <IconeChevronDroite className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-1 rounded-lg border border-trait bg-ardoise p-1 sm:max-w-[400px]">
        {VUES.map((v) => (
          <button
            key={v.cle}
            onClick={() => setVue(v.cle)}
            aria-pressed={vue === v.cle}
            className={`flex-1 rounded-md py-2.5 text-[13px] font-medium transition ${
              vue === v.cle ? "bg-jaune text-noir" : "text-brume hover:text-craie"
            }`}
          >
            {v.libelle}
          </button>
        ))}
      </div>

      {vue === "jour" && (
        <VueJour
          planning={planning}
          seances={seances}
          date={date}
          statut={statutDe(date)}
        />
      )}

      {vue === "semaine" && (
        <VueSemaine
          planning={planning}
          seances={seances}
          date={date}
          today={today}
          statutDe={statutDe}
          onChoisir={setDate}
        />
      )}

      {vue === "mois" && (
        <VueMois
          planning={planning}
          date={date}
          today={today}
          statutDe={statutDe}
          onChoisir={setDate}
        />
      )}

      {vue !== "jour" && (
        <ResumeJour
          planning={planning}
          seances={seances}
          date={date}
          onOuvrir={() => setVue("jour")}
        />
      )}
    </Carte>
  );
}

/** Journée détaillée, dans l'ordre où elle se vit. */
function VueJour({
  planning,
  seances,
  date,
  statut,
}: {
  planning: PlanningLocal;
  seances: SeanceProgramme[];
  date: string;
  statut: string | null;
}) {
  const evenements = evenementsDuJour(planning, seances, date);

  return (
    <div className="lg:max-w-[560px]">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Etiquette>{libelleDate(date)}</Etiquette>
        {statut === "terminee" && <Etiquette ton="vert">Séance terminée</Etiquette>}
        {statut === "sautee" && <Etiquette ton="rouge">Séance sautée</Etiquette>}
        {statut === "en_cours" && <Etiquette ton="jaune">Séance en cours</Etiquette>}
      </div>

      <ul>
        {evenements.map((e, i) => (
          <li key={e.cle} className="flex gap-3.5">
            <span className="chiffres w-[46px] shrink-0 pt-px text-[13px] text-brume">
              {e.heure}
            </span>
            <span className="flex flex-col items-center">
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${COULEUR_POINT[e.nature]}`}
              />
              {i < evenements.length - 1 && (
                <span className="w-px flex-1 bg-trait" aria-hidden="true" />
              )}
            </span>
            <div className={i < evenements.length - 1 ? "pb-5" : ""}>
              <p
                className={`text-[14px] leading-tight ${
                  e.nature === "seance" ? "font-semibold" : "font-medium"
                }`}
              >
                {e.libelle}
              </p>
              {e.detail && (
                <p className="mt-1 text-[12px] leading-snug text-brume-sombre">
                  {e.detail}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 border-t border-trait pt-3.5 text-[12px] leading-relaxed text-brume-sombre">
        {minutesEnHeures(dureeNuitMin(planning.heureCoucher, planning.heureLever))} de
        sommeil prévues, objectif {planning.objectifSommeilH} h.
      </p>
    </div>
  );
}

/** Les sept jours de la semaine, en colonnes sur grand écran. */
function VueSemaine({
  planning,
  seances,
  date,
  today,
  statutDe,
  onChoisir,
}: {
  planning: PlanningLocal;
  seances: SeanceProgramme[];
  date: string;
  today: string;
  statutDe: (jour: string) => string | null;
  onChoisir: (jour: string) => void;
}) {
  const repasActifs = planning.repas.filter((r) => r.actif).length;

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
      {semaineDe(date).map((jour) => {
        const entrainement = seanceDuJour(planning, seances, jour);
        const statut = statutDe(jour);
        const choisi = jour === date;
        return (
          <button
            key={jour}
            onClick={() => onChoisir(jour)}
            aria-pressed={choisi}
            className={`rounded-net border p-3 text-left transition ${
              choisi
                ? "border-jaune bg-jaune-voile"
                : entrainement
                  ? "border-trait bg-ardoise hover:border-trait-clair"
                  : "border-trait bg-noir hover:border-trait-clair"
            }`}
          >
            <div className="flex items-baseline justify-between gap-2 lg:block">
              <span
                className={`text-[13px] font-medium ${jour === today ? "text-jaune" : ""}`}
              >
                {JOURS[jourDeLaSemaine(jour) - 1]}
              </span>
              <span className="chiffres text-[11px] text-brume-sombre lg:mt-1 lg:block">
                {Number(jour.slice(8))}
              </span>
            </div>

            {entrainement ? (
              <div className="mt-2.5">
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-jaune">
                  <IconeHaltere className="h-3.5 w-3.5 shrink-0" />
                  <span className="chiffres">{entrainement.creneau.heure}</span>
                </span>
                <p className="mt-1 text-[11px] leading-snug text-brume">
                  {entrainement.seance?.nom ?? "Séance"}
                </p>
                {statut === "terminee" && (
                  <p className="mt-1 text-[10px] text-vert">Faite</p>
                )}
                {statut === "sautee" && (
                  <p className="mt-1 text-[10px] text-rouge">Sautée</p>
                )}
              </div>
            ) : (
              <p className="mt-2.5 text-[11px] text-brume-sombre">Repos</p>
            )}

            <p className="chiffres mt-2.5 text-[10px] text-brume-sombre">
              {repasActifs} repas · {planning.heureCoucher}
            </p>
          </button>
        );
      })}
    </div>
  );
}

/** Le mois en grille, un point par jour d'entraînement. */
function VueMois({
  planning,
  date,
  today,
  statutDe,
  onChoisir,
}: {
  planning: PlanningLocal;
  date: string;
  today: string;
  statutDe: (jour: string) => string | null;
  onChoisir: (jour: string) => void;
}) {
  // Les cases sont carrées : sur un écran large, la grille se cadre plutôt que
  // de s'étirer en pavés de quinze centimètres.
  return (
    <div className="lg:max-w-[520px]">
      <div className="mb-2 grid grid-cols-7 gap-1.5">
        {JOURS_COURTS.map((lettre, i) => (
          <span key={i} className="surtitre text-center">
            {lettre}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {grilleDuMois(date).map((jour) => {
          const dansLeMois = memeMois(jour, date);
          const creneau = creneauDuJour(planning, jour);
          const statut = statutDe(jour);
          const choisi = jour === date;
          return (
            <button
              key={jour}
              onClick={() => onChoisir(jour)}
              aria-pressed={choisi}
              aria-label={libelleDate(jour)}
              className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border transition ${
                choisi
                  ? "border-jaune bg-jaune-voile"
                  : dansLeMois
                    ? "border-trait bg-ardoise hover:border-trait-clair"
                    : "border-transparent"
              }`}
            >
              <span
                className={`chiffres text-[13px] leading-none ${
                  !dansLeMois
                    ? "text-brume-sombre/50"
                    : jour === today
                      ? "font-semibold text-jaune"
                      : "text-craie"
                }`}
              >
                {Number(jour.slice(8))}
              </span>
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${
                  !creneau
                    ? "bg-transparent"
                    : statut === "terminee"
                      ? "bg-vert"
                      : statut === "sautee"
                        ? "bg-rouge"
                        : dansLeMois
                          ? "bg-jaune"
                          : "bg-trait-clair"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Rappel de la journée choisie, sous la grille de la semaine ou du mois. */
function ResumeJour({
  planning,
  seances,
  date,
  onOuvrir,
}: {
  planning: PlanningLocal;
  seances: SeanceProgramme[];
  date: string;
  onOuvrir: () => void;
}) {
  const entrainement = seanceDuJour(planning, seances, date);
  const repasActifs = planning.repas.filter((r) => r.actif);

  return (
    <div className="mt-4 border-t border-trait pt-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[14px] font-medium">{libelleRelatif(date)}</p>
        <button
          onClick={onOuvrir}
          className="shrink-0 text-[12px] text-brume transition hover:text-jaune"
        >
          Voir la journée
        </button>
      </div>
      <p className="mt-1.5 text-[12px] leading-relaxed text-brume-sombre">
        {entrainement
          ? `${entrainement.seance?.nom ?? "Séance"} à ${entrainement.creneau.heure}`
          : "Jour de repos"}
        {" · "}
        {repasActifs.length} repas
        {" · "}
        <span className="chiffres">
          {planning.heureCoucher} → {planning.heureLever}
        </span>
      </p>
    </div>
  );
}
