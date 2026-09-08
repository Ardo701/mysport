"use client";

import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Carte, Etiquette, Onglets, TitreSection } from "@/composants/ui";
import { IllustrationExercice } from "@/composants/illustration-exercice";
import { Feuille } from "@/composants/feuille";
import type { Doc } from "@/convex/_generated/dataModel";
import { semaineDuProgramme } from "@/convex/lib/dates";
// `semaineDe` existe des deux côtés : ici les sept jours d'une semaine,
// là-bas la semaine du cycle d'entraînement. On les distingue à l'import.
import { doseDe, semaineDe as semaineDuCycle } from "@/convex/lib/programme";
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
  lever: "bg-brume-faible",
  repas: "bg-brume",
  seance: "bg-jaune-vif",
  coucher: "bg-brume-faible",
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
  // Date dont on regarde la séance en détail, dans la feuille glissante.
  const [detail, setDetail] = useState<string | null>(null);
  const journaux = useQuery(api.seances.historique, { limite: 200 });
  // Le programme complet : la liste d'exercices et les douze semaines n'entrent
  // pas dans les props légères du planning en cours d'édition.
  const programme = useQuery(api.programme.programmeActif);

  useEffect(() => setDate(aujourdhuiISO()), []);
  if (!date) return null;

  const today = aujourdhuiISO();
  const statutDe = (jour: string) =>
    journaux?.find((l) => l.date === jour)?.statut ?? null;
  const journalDe = (jour: string) => journaux?.find((l) => l.date === jour) ?? null;

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
              className="rounded-doux border border-trait bg-creux px-3 py-2 text-[12px] text-brume transition-colors hover:border-jaune hover:text-encre"
            >
              Aujourd'hui
            </button>
          )}
          <button
            onClick={() => decaler(-1)}
            aria-label="Période précédente"
            className="rounded-doux border border-trait bg-creux p-2 text-brume transition-colors hover:text-encre"
          >
            <IconeChevronGauche className="h-4 w-4" />
          </button>
          <button
            onClick={() => decaler(1)}
            aria-label="Période suivante"
            className="rounded-doux border border-trait bg-creux p-2 text-brume transition-colors hover:text-encre"
          >
            <IconeChevronDroite className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Onglets className="mb-5" options={VUES} valeur={vue} onChange={setVue} />

      {vue === "jour" && (
        <VueJour
          planning={planning}
          seances={seances}
          date={date}
          statut={statutDe(date)}
          onVoirSeance={() => setDetail(date)}
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
          onVoirSeance={() => setDetail(date)}
        />
      )}

      <DetailSeance
        date={detail}
        planning={planning}
        programme={programme ?? null}
        journal={detail ? journalDe(detail) : null}
        onFermer={() => setDetail(null)}
      />
    </Carte>
  );
}

/** Journée détaillée, dans l'ordre où elle se vit. */
function VueJour({
  planning,
  seances,
  date,
  statut,
  onVoirSeance,
}: {
  planning: PlanningLocal;
  seances: SeanceProgramme[];
  date: string;
  statut: string | null;
  onVoirSeance: () => void;
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
                className={`mt-[7px] h-1.5 w-1.5 shrink-0 ${COULEUR_POINT[e.nature]}`}
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
                <p className="mt-1 text-[12px] leading-snug text-brume-faible">
                  {e.detail}
                </p>
              )}
              {e.nature === "seance" && (
                <button
                  onClick={onVoirSeance}
                  className="mt-1.5 text-[12px] text-jaune transition-opacity hover:opacity-70"
                >
                  Voir le détail
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 border-t border-trait pt-3.5 text-[12px] leading-relaxed text-brume-faible">
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
            className={`flex flex-col rounded-doux border p-3 text-left transition-colors ${
              choisi
                ? "border-jaune bg-jaune-voile"
                : entrainement
                  ? "border-trait bg-creux hover:border-trait-vif"
                  : "border-trait bg-fond hover:border-trait-vif"
            }`}
          >
            <div className="flex items-baseline justify-between gap-2 lg:block">
              <span
                className={`text-[13px] font-medium ${jour === today ? "text-jaune" : ""}`}
              >
                {JOURS[jourDeLaSemaine(jour) - 1]}
              </span>
              {/* L'état de la séance se range à côté du quantième : il tenait
                  sa propre ligne, qui n'existait que les jours faits ou
                  sautés et décalait alors tout le bas de la carte. */}
              <span className="flex items-baseline gap-1.5 lg:mt-1">
                <span className="chiffres text-[11px] text-brume-faible">
                  {Number(jour.slice(8))}
                </span>
                {statut === "terminee" && (
                  <span className="text-[10px] text-vert">Faite</span>
                )}
                {statut === "sautee" && (
                  <span className="text-[10px] text-rouge">Sautée</span>
                )}
              </span>
            </div>

            {/* L'heure garde sa ligne les jours de repos, vide. */}
            <span className="mt-2.5 flex h-[18px] items-center gap-1.5 text-[12px] font-medium leading-none text-jaune">
              {entrainement && (
                <>
                  <IconeHaltere className="h-3.5 w-3.5 shrink-0" />
                  <span className="chiffres">{entrainement.creneau.heure}</span>
                </>
              )}
            </span>

            {/* Deux lignes réservées : « Bas du corps + Abdos » passe à la
                ligne dans une colonne étroite, « Repos » jamais. */}
            <p
              className={`mt-1 line-clamp-2 h-[30px] text-[11px] leading-[15px] ${
                entrainement ? "text-brume" : "text-brume-faible"
              }`}
            >
              {entrainement
                ? (entrainement.seance?.nom ?? "Séance")
                : "Repos"}
            </p>

            <p className="chiffres mt-2.5 text-[10px] text-brume-faible">
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
              className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-doux border transition-colors ${
                choisi
                  ? "border-jaune bg-jaune-voile"
                  : dansLeMois
                    ? "border-trait bg-creux hover:border-trait-vif"
                    : "border-transparent"
              }`}
            >
              <span
                className={`chiffres text-[13px] leading-none ${
                  !dansLeMois
                    ? "text-brume-faible/50"
                    : jour === today
                      ? "font-semibold text-jaune"
                      : "text-encre"
                }`}
              >
                {Number(jour.slice(8))}
              </span>
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 ${
                  !creneau
                    ? "bg-transparent"
                    : statut === "terminee"
                      ? "bg-vert"
                      : statut === "sautee"
                        ? "bg-rouge"
                        : dansLeMois
                          ? "bg-jaune-vif"
                          : "bg-trait-vif"
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
  onVoirSeance,
}: {
  planning: PlanningLocal;
  seances: SeanceProgramme[];
  date: string;
  onOuvrir: () => void;
  onVoirSeance: () => void;
}) {
  const entrainement = seanceDuJour(planning, seances, date);
  const repasActifs = planning.repas.filter((r) => r.actif);

  return (
    <div className="mt-4 border-t border-trait pt-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[14px] font-medium">{libelleRelatif(date)}</p>
        <span className="flex shrink-0 items-center gap-3">
          {entrainement && (
            <button
              onClick={onVoirSeance}
              className="text-[12px] text-jaune transition-opacity hover:opacity-70"
            >
              Détail de la séance
            </button>
          )}
          <button
            onClick={onOuvrir}
            className="text-[12px] text-brume transition-colors hover:text-jaune"
          >
            Voir la journée
          </button>
        </span>
      </div>
      <p className="mt-1.5 text-[12px] leading-relaxed text-brume-faible">
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

/**
 * Détail d'une séance : ce qui est prévu, ou ce qui a été fait.
 *
 * Le calendrier ne montrait qu'un nom et une heure. On ne pouvait donc ni
 * préparer une séance à venir — quels exercices, combien de séries cette
 * semaine-là — ni relire une séance passée avec les charges réellement
 * soulevées. Les deux vivent ici, parce que c'est la même question posée de
 * part et d'autre d'aujourd'hui.
 */
function DetailSeance({
  date,
  planning,
  programme,
  journal,
  onFermer,
}: {
  date: string | null;
  planning: PlanningLocal;
  programme: Doc<"programmes"> | null;
  journal: Doc<"seancesLog"> | null;
  onFermer: () => void;
}) {
  if (!date) return null;

  if (!programme) {
    return (
      <Feuille ouverte onFermer={onFermer} surtitre={libelleDate(date)} titre="Séance">
        <p className="text-[13px] leading-relaxed text-brume">
          Programme en cours de chargement.
        </p>
      </Feuille>
    );
  }

  const creneau = creneauDuJour(planning, date);
  const seance = programme.seances.find((s) => s.id === creneau?.seanceId);

  if (!creneau || !seance) {
    return (
      <Feuille ouverte onFermer={onFermer} surtitre={libelleDate(date)} titre="Repos">
        <p className="text-[13px] leading-relaxed text-brume">
          Aucune séance prévue ce jour-là.
        </p>
      </Feuille>
    );
  }

  const numero = semaineDuProgramme(programme.debutISO, date);
  const cycle = semaineDuCycle(programme.semaines, numero);
  const fait = journal?.statut === "terminee";
  const seriesFaites = journal?.series.filter((s) => s.fait) ?? [];

  return (
    <Feuille
      ouverte
      onFermer={onFermer}
      surtitre={`${libelleDate(date)} · ${creneau.heure}`}
      titre={seance.nom}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Etiquette ton="jaune">Semaine {numero} / 12</Etiquette>
        {cycle && <Etiquette>{cycle.bloc}</Etiquette>}
        {journal?.statut === "terminee" && <Etiquette ton="vert">Faite</Etiquette>}
        {journal?.statut === "sautee" && <Etiquette ton="rouge">Sautée</Etiquette>}
        {journal?.statut === "en_cours" && <Etiquette ton="jaune">En cours</Etiquette>}
      </div>

      {fait ? (
        <p className="mt-3 text-[13px] leading-relaxed text-brume">
          {seriesFaites.length} série{seriesFaites.length > 1 ? "s" : ""} validée
          {seriesFaites.length > 1 ? "s" : ""}
          {journal?.dureeMin ? ` en ${journal.dureeMin} minutes` : ""}.
        </p>
      ) : (
        cycle && (
          <p className="mt-3 text-[13px] leading-relaxed text-brume">
            {cycle.intention}
          </p>
        )
      )}

      {/* L'échauffement ne sert qu'avant : le relire après coup est du bruit. */}
      {!journal && seance.echauffement.length > 0 && (
        <section className="mt-6">
          <TitreSection titre="Échauffement" />
          <ul className="space-y-1.5">
            {seance.echauffement.map((ligne) => (
              <li key={ligne} className="text-[13px] leading-snug text-brume">
                {ligne}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        <TitreSection
          titre="Exercices"
          action={<Etiquette>{seance.exercices.length}</Etiquette>}
        />
        <ul className="divide-y divide-trait border-t border-trait">
          {seance.exercices.map((exercice) => {
            const dose = doseDe(exercice, cycle);
            const series = (journal?.series ?? [])
              .filter((s) => s.exerciceId === exercice.id)
              .sort((a, b) => a.index - b.index);

            // La variante réellement suivie s'il y en a une trace ; sinon
            // celle avec machine, qui est la version par défaut du programme.
            const variante = series[0]?.variante ?? "salle";

            return (
              <li key={exercice.id} className="flex gap-3 py-3">
                <IllustrationExercice
                  exerciceId={exercice.id}
                  variante={variante}
                  titre={variante === "maison" ? exercice.maison.nom : exercice.salle.nom}
                  className="mt-0.5 h-[54px] w-[86px] shrink-0 rounded-doux border border-trait bg-creux"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] leading-tight font-medium">{exercice.nom}</p>
                  <p className="chiffres mt-1 text-[12px] text-brume">
                    {dose.series} × {dose.reps} · repos {dose.reposSec}s
                    {series.length > 0 &&
                      (variante === "maison" ? " · sans machine" : " · avec machine")}
                  </p>
                  {dose.reserve && !journal && (
                    <p className="mt-0.5 text-[12px] text-brume-faible">{dose.reserve}</p>
                  )}

                  {/* Ce qui a réellement été soulevé, série par série. */}
                  {series.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      {series.map((s) => (
                        <li
                          key={s.index}
                          className={`chiffres text-[12px] ${
                            s.fait ? "text-encre" : "text-brume-faible line-through"
                          }`}
                        >
                          {libelleSerie(s)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {seance.finisher && (
        <section className="mt-6">
          <TitreSection
            titre="Finisher"
            action={
              cycle ? (
                <Etiquette ton={cycle.finisherObligatoire ? "jaune" : undefined}>
                  {cycle.finisherObligatoire ? "Prévu" : "Facultatif"}
                </Etiquette>
              ) : undefined
            }
          />
          <p className="text-[13px] leading-relaxed text-brume">{seance.finisher}</p>
        </section>
      )}
    </Feuille>
  );
}

/**
 * Une série réalisée, dite avec ce qu'on en sait.
 *
 * Les deux champs sont facultatifs : une planche n'a ni répétitions ni charge,
 * des pompes ont des répétitions sans charge. Écrire « — × poids du corps »
 * dans ces cas-là revenait à inventer une information qu'on n'a pas.
 */
function libelleSerie(s: Doc<"seancesLog">["series"][number]): string {
  if (s.reps != null && s.poidsKg != null) return `${s.reps} × ${s.poidsKg} kg`;
  if (s.reps != null) return `${s.reps} reps`;
  if (s.poidsKg != null) return `${s.poidsKg} kg`;
  return s.fait ? "faite" : "non faite";
}
