"use client";

import { useQuery } from "convex/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import { ChiffreVedette, GrilleStats, PaireStats, Stat } from "@/composants/jauges";
import { IconeChevronDroite, IconeChevronGauche, IconePlus } from "@/composants/icones";
import { useLangue, type Langue } from "@/composants/langue";
import { DetailSeance, LigneRepos, LigneSeance } from "@/composants/seance";
import {
  ActionTete,
  BoutonLien,
  Carte,
  Chargement,
  Colonne,
  Colonnes,
  EnTetePage,
  EtatVide,
  Onglets,
  TitreSection,
} from "@/composants/ui";
import type { Texte } from "@/convex/data/langues";
import {
  ajouterJours,
  aujourdhuiISO,
  debutDeMois,
  differenceEnJours,
  jourDeLaSemaine,
  joursCourts,
  libelleDate,
  libelleDateCourt,
  libelleJour,
  libelleMois,
  lundiDeLaSemaine,
} from "@/lib/dates";
import {
  compteSeances,
  entre,
  exercicesFrequents,
  libelleDuree,
  nombre,
  nomExercice,
  parSemaine,
  repartition,
  totaux,
  type Seance,
  type Totaux,
} from "@/lib/seances";

type Periode = "semaine" | "mois" | "3m" | "an" | "tout";

/** En semaines entières : une moyenne par semaine sur des semaines tronquées tomberait faux. */
const PERIODES: { cle: Periode; libelle: Texte; semaines?: number }[] = [
  { cle: "semaine", libelle: { fr: "Semaine", en: "Week" } },
  { cle: "mois", libelle: { fr: "Mois", en: "Month" }, semaines: 4 },
  { cle: "3m", libelle: { fr: "3 mois", en: "3 months" }, semaines: 13 },
  { cle: "an", libelle: { fr: "1 an", en: "1 year" }, semaines: 52 },
  { cle: "tout", libelle: { fr: "Tout", en: "All" } },
];

/** Au-delà, les barres deviendraient des fils : on montre les deux dernières années. */
const SEMAINES_MAX_GRAPHIQUE = 104;

export default function PageStatistiques() {
  const { langue, t } = useLangue();
  const [aujourdhui, setAujourdhui] = useState<string | null>(null);
  useEffect(() => setAujourdhui(aujourdhuiISO()), []);
  const [periode, setPeriode] = useState<Periode>("semaine");
  // La semaine affichée par l'onglet Semaine ; null tant qu'on n'a pas bougé,
  // c'est-à-dire la semaine en cours.
  const [lundiChoisi, setLundiChoisi] = useState<string | null>(null);

  const seances = useQuery(api.seances.mesSeances);

  if (!aujourdhui || seances === undefined) return <Chargement />;

  const ajouter = (
    <ActionTete href="/seance" libelle={t("Ajouter une séance", "Add a workout")}>
      <IconePlus className="h-[22px] w-[22px]" />
    </ActionTete>
  );

  if (seances.length === 0) {
    return (
      <div className="lg:max-w-[640px]">
        <EnTetePage titre={t("Statistiques", "Statistics")} />
        <EtatVide
          titre={t("Pas encore de statistiques", "No statistics yet")}
          detail={t(
            "Elles se calculent à partir des séances que tu notes : jours d'entraînement, temps passé, calories dépensées.",
            "They are worked out from the workouts you log: training days, time spent, calories burned.",
          )}
          action={<BoutonLien href="/seance">{t("Ajouter une séance", "Add a workout")}</BoutonLien>}
        />
      </div>
    );
  }

  const premiere = seances.at(-1)!.date;
  const lundiCourant = lundiDeLaSemaine(aujourdhui);
  const choix = PERIODES.find((p) => p.cle === periode)!;
  const nombreSemaines =
    periode === "semaine"
      ? 1
      : (choix.semaines ??
        Math.max(4, Math.floor(differenceEnJours(lundiDeLaSemaine(premiere), lundiCourant) / 7) + 1));

  return (
    <div>
      <EnTetePage titre={t("Statistiques", "Statistics")} action={ajouter} />

      <Onglets
        className="mb-6 lg:max-w-[520px]"
        options={PERIODES.map((p) => ({ cle: p.cle, libelle: p.libelle[langue] }))}
        valeur={periode}
        onChange={setPeriode}
      />

      {periode === "semaine" ? (
        <VueSemaine
          seances={seances}
          aujourdhui={aujourdhui}
          lundi={lundiChoisi ?? lundiCourant}
          lundiMin={lundiDeLaSemaine(premiere)}
          onLundi={setLundiChoisi}
        />
      ) : (
        <VuePeriode
          seances={seances}
          aujourdhui={aujourdhui}
          debut={ajouterJours(lundiCourant, -7 * (nombreSemaines - 1))}
          nombreSemaines={nombreSemaines}
        />
      )}
    </div>
  );
}

/** Plusieurs semaines d'un coup : des moyennes, et une barre par semaine. */
function VuePeriode({
  seances,
  aujourdhui,
  debut,
  nombreSemaines,
}: {
  seances: Seance[];
  aujourdhui: string;
  debut: string;
  nombreSemaines: number;
}) {
  const { langue, t } = useLangue();
  const dansPeriode = entre(seances, debut, aujourdhui);
  const total = totaux(dansPeriode);
  // La semaine en cours n'est pas finie : on divise par les jours réellement
  // écoulés, pas par un nombre rond de semaines qui ferait baisser la moyenne
  // chaque lundi.
  const joursEcoules = differenceEnJours(debut, aujourdhui) + 1;
  const parSemaineMoyenne = (total.kcal / joursEcoules) * 7;

  const semaines = parSemaine(
    seances,
    aujourdhui,
    Math.min(nombreSemaines, SEMAINES_MAX_GRAPHIQUE),
  );
  const milieu = Math.floor((semaines.length - 1) / 2);

  return (
    <Colonnes>
      <Colonne>
        <ChiffreVedette
          libelle={t("Moyenne par semaine", "Weekly average")}
          valeur={nombre(Math.round(parSemaineMoyenne), langue)}
          unite="kcal"
        >
          <p className="mt-2 text-[13px] text-brume">
            {t(`Depuis le ${libelleJour(debut, langue)}`, `Since ${libelleJour(debut, langue)}`)} ·{" "}
            {compteSeances(total.seances, langue)}
          </p>
          <PaireMoyennes totaux={total} jours={joursEcoules} />
        </ChiffreVedette>

        <GraphiqueBarres
          titre={t("Calories par semaine", "Calories per week")}
          barres={semaines.map((s) => ({
            cle: s.lundi,
            titre: t(
              `Semaine du ${libelleDateCourt(s.lundi, langue)}`,
              `Week of ${libelleDateCourt(s.lundi, langue)}`,
            ),
            kcal: s.kcal,
            seances: s.seances,
          }))}
          moyenne={parSemaineMoyenne}
          parDefaut={{
            titre: t("Cette semaine", "This week"),
            kcal: semaines.at(-1)!.kcal,
            seances: semaines.at(-1)!.seances,
          }}
          axe={
            <div className="chiffres mt-2 flex justify-between text-[11px] text-brume">
              <span>{libelleDateCourt(semaines[0].lundi, langue)}</span>
              {semaines.length > 4 && (
                <span>{libelleDateCourt(semaines[milieu].lundi, langue)}</span>
              )}
              <span>{libelleDateCourt(semaines.at(-1)!.lundi, langue)}</span>
            </div>
          }
        />

        <Calendrier seances={seances} aujourdhui={aujourdhui} />
      </Colonne>

      <Colonne>
        <Carte>
          <TitreSection titre={t("Sur la période", "Over the period")} />
          <GrilleStats>
            <Stat libelle={t("Séances", "Workouts")} valeur={nombre(total.seances, langue)} />
            <Stat
              libelle={t("Séances par semaine", "Workouts per week")}
              valeur={nombre((total.seances / joursEcoules) * 7, langue)}
            />
            <StatsVolume totaux={total} jours={joursEcoules} />
            <Stat
              libelle={t("Dépense totale", "Total burned")}
              valeur={nombre(total.kcal, langue)}
              unite="kcal"
            />
          </GrilleStats>
        </Carte>

        <Repartition seances={dansPeriode} />
        <ExercicesFrequents seances={dansPeriode} />
      </Colonne>
    </Colonnes>
  );
}

/**
 * Une semaine, du lundi au dimanche : ce qu'elle a coûté, jour par jour, et ce
 * qui a été fait chaque jour, repos compris.
 */
function VueSemaine({
  seances,
  aujourdhui,
  lundi,
  lundiMin,
  onLundi,
}: {
  seances: Seance[];
  aujourdhui: string;
  lundi: string;
  /** La semaine de la toute première séance : rien à voir avant. */
  lundiMin: string;
  onLundi: (lundi: string) => void;
}) {
  const { langue, t } = useLangue();
  const dimanche = ajouterJours(lundi, 6);
  /** Semaines écoulées depuis celle affichée : 0 pour la semaine en cours. */
  const ecart = differenceEnJours(lundi, lundiDeLaSemaine(aujourdhui)) / 7;
  const enCours = ecart === 0;
  // La semaine en cours se juge sur les jours déjà passés : le jeudi, la
  // moyenne par jour ne compte pas le week-end qui n'a pas encore eu lieu.
  const joursEcoules = enCours ? differenceEnJours(lundi, aujourdhui) + 1 : 7;

  const deLaSemaine = entre(seances, lundi, dimanche);
  const total = totaux(deLaSemaine);
  const precedente = totaux(entre(seances, ajouterJours(lundi, -7), ajouterJours(lundi, -1)));

  const jours = Array.from({ length: 7 }, (_, i) => {
    const date = ajouterJours(lundi, i);
    // La requête rend les séances de la plus récente à la plus ancienne ; dans
    // une journée, on les relit dans l'ordre où elles ont eu lieu.
    const duJour = deLaSemaine.filter((s) => s.date === date).reverse();
    return {
      date,
      seances: duJour,
      kcal: duJour.reduce((n, s) => n + s.kcal, 0),
      avenir: date > aujourdhui,
    };
  });

  return (
    <>
      <div className="mb-7 flex items-center justify-between gap-3 lg:max-w-[520px]">
        <BoutonFleche
          libelle={t("Semaine précédente", "Previous week")}
          disabled={lundi <= lundiMin}
          onClick={() => onLundi(ajouterJours(lundi, -7))}
        >
          <IconeChevronGauche className="h-[18px] w-[18px]" />
        </BoutonFleche>
        <div className="text-center">
          <p className="text-[16px] font-semibold">{libelleSemaine(lundi, langue)}</p>
          <p className="text-[13px] text-brume">
            {enCours
              ? t("Cette semaine", "This week")
              : ecart === 1
                ? t("Semaine dernière", "Last week")
                : t(`Il y a ${ecart} semaines`, `${ecart} weeks ago`)}
          </p>
        </div>
        <BoutonFleche
          libelle={t("Semaine suivante", "Next week")}
          disabled={enCours}
          onClick={() => onLundi(ajouterJours(lundi, 7))}
        >
          <IconeChevronDroite className="h-[18px] w-[18px]" />
        </BoutonFleche>
      </div>

      <Colonnes>
        <Colonne>
          <ChiffreVedette
            libelle={t("Dépense de la semaine", "Burned this week")}
            valeur={nombre(total.kcal, langue)}
            unite="kcal"
          >
            <p className="mt-2 text-[13px] text-brume">
              {comparaison(total.kcal, precedente.kcal, langue)}
            </p>
            <PaireMoyennes totaux={total} jours={joursEcoules} />
          </ChiffreVedette>

          <GraphiqueBarres
            titre={t("Calories par jour", "Calories per day")}
            barres={jours.map((j) => ({
              cle: j.date,
              titre: libelleDate(j.date, langue),
              kcal: j.kcal,
              seances: j.seances.length,
              avenir: j.avenir,
            }))}
            moyenne={total.kcal / joursEcoules}
            parDefaut={{
              titre: t("Toute la semaine", "The whole week"),
              kcal: total.kcal,
              seances: total.seances,
            }}
            axe={
              <div className="mt-2 flex gap-2">
                {jours.map((j, i) => (
                  <span
                    key={j.date}
                    className={`flex-1 text-center text-[12px] font-semibold ${
                      j.date === aujourdhui ? "text-encre" : "text-brume"
                    }`}
                  >
                    {joursCourts(langue)[i]}
                  </span>
                ))}
              </div>
            }
          />

          <Carte>
            <TitreSection
              titre={t("Jour par jour", "Day by day")}
              action={compteSeances(total.seances, langue)}
            />
            <div className="boite divide-y divide-trait overflow-hidden">
              {jours.map((j) =>
                j.seances.length > 0 ? (
                  j.seances.map((s) => <LigneSeance key={s._id} seance={s} />)
                ) : (
                  <LigneRepos key={j.date} date={j.date} avenir={j.avenir} />
                ),
              )}
            </div>
          </Carte>
        </Colonne>

        <Colonne>
          <Carte>
            <TitreSection titre={t("Sur la semaine", "Over the week")} />
            <GrilleStats>
              <Stat libelle={t("Séances", "Workouts")} valeur={nombre(total.seances, langue)} />
              <StatsVolume totaux={total} jours={joursEcoules} />
            </GrilleStats>
          </Carte>

          <Repartition seances={deLaSemaine} />
        </Colonne>
      </Colonnes>
    </>
  );
}

/**
 * « 5 au 11 octobre », ou « 28 septembre au 4 octobre » quand la semaine
 * change de mois ; « 5 to 11 October » en anglais.
 */
function libelleSemaine(lundi: string, langue: Langue) {
  const dimanche = ajouterJours(lundi, 6);
  const debut =
    lundi.slice(0, 7) === dimanche.slice(0, 7)
      ? String(Number(lundi.slice(8)))
      : libelleJour(lundi, langue);
  return `${debut} ${langue === "fr" ? "au" : "to"} ${libelleJour(dimanche, langue)}`;
}

/** « +21 % par rapport à la semaine précédente (958 kcal) ». */
function comparaison(kcal: number, avant: number, langue: Langue): ReactNode {
  const fr = langue === "fr";
  if (avant === 0) return fr ? "Aucune séance la semaine précédente" : "No workouts the week before";
  const ecart = Math.round(((kcal - avant) / avant) * 100);
  return (
    <>
      <span className="font-semibold text-encre">
        {ecart > 0 ? "+" : ecart < 0 ? "−" : ""}
        {Math.abs(ecart)}
        {fr ? " %" : "%"}
      </span>{" "}
      {fr ? "par rapport à la semaine précédente" : "compared with the week before"} (
      {nombre(avant, langue)} kcal)
    </>
  );
}

function BoutonFleche({
  libelle,
  disabled,
  onClick,
  children,
}: {
  libelle: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={libelle}
      disabled={disabled}
      onClick={onClick}
      className="flex h-10 w-11 shrink-0 items-center justify-center rounded-doux border border-trait bg-surface text-encre transition-colors hover:bg-creux disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/** Par séance et par jour : les deux moyennes qui précisent le chiffre principal. */
function PaireMoyennes({ totaux: total, jours }: { totaux: Totaux; jours: number }) {
  const { langue, t } = useLangue();
  return (
    <PaireStats
      gauche={{
        valeur: total.seances > 0 ? nombre(Math.round(total.kcal / total.seances), langue) : "—",
        unite: total.seances > 0 ? "kcal" : undefined,
        libelle: t("par séance", "per workout"),
      }}
      droite={{
        valeur: nombre(Math.round(total.kcal / jours), langue),
        unite: "kcal",
        libelle: t("par jour, repos compris", "per day, rest days included"),
      }}
    />
  );
}

/** Jours actifs, temps et durée : ce que les deux vues comptent de la même façon. */
function StatsVolume({ totaux: total, jours }: { totaux: Totaux; jours: number }) {
  const { langue, t } = useLangue();
  return (
    <>
      <Stat
        libelle={t("Jours actifs", "Active days")}
        valeur={nombre(total.jours, langue)}
        unite={t(`sur ${jours}`, `of ${jours}`)}
      />
      <Stat libelle={t("Temps total", "Total time")} valeur={libelleDuree(total.dureeMin, langue)} />
      <Stat
        libelle={t("Durée moyenne", "Average duration")}
        valeur={total.seances > 0 ? libelleDuree(total.dureeMin / total.seances, langue) : "—"}
      />
    </>
  );
}

/** Une ligne de libellé et de valeur, puis sa jauge. */
function LigneJauge({ libelle, detail, part }: { libelle: string; detail: string; part: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-[14px] font-medium">{libelle}</span>
        <span className="chiffres shrink-0 text-[13px] text-brume">{detail}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-[3px] bg-piste">
        <div className="h-full rounded-[3px] bg-accent" style={{ width: `${part}%` }} />
      </div>
    </div>
  );
}

/** Où sont passées les calories : musculation, cardio et sports, séances sans détail. */
function Repartition({ seances }: { seances: Seance[] }) {
  const { langue, t } = useLangue();
  const parts = repartition(seances);
  const total = parts.musculation + parts.cardio + parts.sansDetail;
  const lignes = [
    { libelle: t("Musculation", "Strength training"), kcal: parts.musculation },
    { libelle: t("Cardio et sports", "Cardio and sports"), kcal: parts.cardio },
    { libelle: t("Séances sans détail", "Workouts with no details"), kcal: parts.sansDetail },
  ].filter((l) => l.kcal > 0);

  return (
    <Carte>
      <TitreSection titre={t("Répartition de la dépense", "Where the calories went")} />
      {total === 0 ? (
        <p className="boite px-4 py-4 text-[13px] text-brume">
          {t("Aucune dépense sur la période.", "Nothing burned over the period.")}
        </p>
      ) : (
        <div className="boite space-y-4 p-4">
          {lignes.map((l) => {
            const part = (l.kcal / total) * 100;
            return (
              <LigneJauge
                key={l.libelle}
                libelle={l.libelle}
                detail={`${nombre(Math.round(l.kcal), langue)} kcal · ${Math.round(part)}${t(" %", "%")}`}
                part={part}
              />
            );
          })}
        </div>
      )}
    </Carte>
  );
}

function ExercicesFrequents({ seances }: { seances: Seance[] }) {
  const { langue, t } = useLangue();
  const frequents = exercicesFrequents(seances, 8);
  return (
    <Carte>
      <TitreSection titre={t("Exercices les plus faits", "Most frequent exercises")} />
      {frequents.length === 0 ? (
        <p className="boite px-4 py-4 text-[13px] text-brume">
          {t("Aucun exercice détaillé sur la période.", "No exercises logged over the period.")}
        </p>
      ) : (
        <div className="boite space-y-4 p-4">
          {frequents.map((e) => (
            <LigneJauge
              key={e.cle}
              libelle={nomExercice(e, langue)}
              detail={compteSeances(e.seances, langue)}
              part={(e.seances / frequents[0].seances) * 100}
            />
          ))}
        </div>
      )}
    </Carte>
  );
}

type Barre = {
  cle: string;
  /** Ce que la lecture en tête du graphique dit de la barre désignée. */
  titre: string;
  kcal: number;
  seances: number;
  /** Un jour pas encore venu : ni barre, ni zéro. */
  avenir?: boolean;
};

/**
 * Une barre par semaine ou par jour sur son rail, et la moyenne en pointillé.
 *
 * Au survol, ou au toucher sur téléphone, la barre désignée s'écrit en tête
 * du graphique. Sans désignation, c'est `parDefaut` qui s'affiche : la
 * semaine en cours, ou le total de la semaine vue jour par jour.
 */
function GraphiqueBarres({
  titre,
  barres,
  moyenne,
  parDefaut,
  axe,
}: {
  titre: string;
  barres: Barre[];
  moyenne: number;
  parDefaut: { titre: string; kcal: number; seances: number };
  axe: ReactNode;
}) {
  const { langue, t } = useLangue();
  const [designee, setDesignee] = useState<number | null>(null);
  const max = Math.max(moyenne, ...barres.map((b) => b.kcal), 1) * 1.1;
  const lue = designee === null ? parDefaut : barres[designee];
  // Au-delà d'une quinzaine de barres, rails et arrondis ne seraient plus
  // que du bruit : les barres se serrent et s'affinent.
  const serre = barres.length > 15;

  return (
    <section className="boite p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold">{titre}</h2>
          <p className="mt-0.5 truncate text-[13px] text-brume first-letter:uppercase">{lue.titre}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="titre text-[19px] font-semibold leading-tight">
            {nombre(lue.kcal, langue)} kcal
          </p>
          <p className="text-[12px] text-brume">
            {lue.seances === 0 ? t("Repos", "Rest") : compteSeances(lue.seances, langue)}
          </p>
        </div>
      </div>

      <div className="relative mt-5 h-[170px]" onMouseLeave={() => setDesignee(null)}>
        {moyenne > 0 && (
          <div
            className="pointer-events-none absolute inset-x-0 z-10 border-t-[1.5px] border-dashed border-brume-faible"
            style={{ bottom: `${(moyenne / max) * 100}%` }}
          >
            <span className="absolute -top-[19px] right-0 bg-surface pl-1.5 text-[11px] font-medium text-brume">
              {t("moyenne", "average")} {nombre(Math.round(moyenne), langue)}
            </span>
          </div>
        )}
        <div className={`flex h-full items-end ${serre ? "gap-[2px]" : "gap-2"}`}>
          {barres.map((b, i) => (
            <button
              key={b.cle}
              type="button"
              disabled={b.avenir}
              aria-label={t(
                `${b.titre} : ${b.kcal} kcal, ${compteSeances(b.seances, langue)}`,
                `${b.titre}: ${b.kcal} kcal, ${compteSeances(b.seances, langue)}`,
              )}
              onMouseEnter={() => setDesignee(i)}
              onFocus={() => setDesignee(i)}
              onClick={() => setDesignee(i)}
              className={`flex h-full min-w-0 flex-1 items-end overflow-hidden ${
                serre ? "rounded-[2px]" : "rounded-[6px] bg-piste"
              }`}
            >
              {!b.avenir && (
                <span
                  className={`block w-full transition-opacity ${serre ? "rounded-[2px]" : "rounded-[6px]"} ${
                    b.kcal > 0 ? "bg-accent" : "bg-trait-vif"
                  } ${designee === null || designee === i ? "opacity-100" : "opacity-35"}`}
                  // Une semaine vide garde un trait de deux pixels quand les
                  // barres n'ont pas de rail : elle existe, elle est à zéro.
                  style={{
                    height: b.kcal > 0 ? `${(b.kcal / max) * 100}%` : serre ? "2px" : "0",
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {axe}
    </section>
  );
}

/** Le mois en grille : un jour coloré est un jour d'entraînement, le toucher montre la séance. */
function Calendrier({ seances, aujourdhui }: { seances: Seance[]; aujourdhui: string }) {
  const { langue, t } = useLangue();
  const moisCourant = debutDeMois(aujourdhui);
  const [mois, setMois] = useState(moisCourant);
  const [jour, setJour] = useState<string | null>(null);

  const parJour = useMemo(() => {
    const carte = new Map<string, Seance[]>();
    for (const s of seances) carte.set(s.date, [...(carte.get(s.date) ?? []), s]);
    return carte;
  }, [seances]);

  const finDuMois = ajouterJours(debutDeMois(mois, 1), -1);
  const nombreJours = Number(finDuMois.slice(8));
  const decalage = jourDeLaSemaine(mois) - 1;
  const duMois = entre(seances, mois, finDuMois);
  const choisies = jour ? (parJour.get(jour) ?? []) : [];

  function changerDeMois(sens: number) {
    setMois(debutDeMois(mois, sens));
    setJour(null);
  }

  return (
    <Carte>
      <TitreSection
        titre={t("Jour par jour", "Day by day")}
        action={compteSeances(duMois.length, langue)}
      />

      <div className="boite p-4">
        <div className="mb-3 flex items-center justify-between">
          <BoutonFleche
            libelle={t("Mois précédent", "Previous month")}
            disabled={false}
            onClick={() => changerDeMois(-1)}
          >
            <IconeChevronGauche className="h-[18px] w-[18px]" />
          </BoutonFleche>
          <p className="text-[15px] font-semibold first-letter:uppercase">
            {libelleMois(mois, langue)}
          </p>
          <BoutonFleche
            libelle={t("Mois suivant", "Next month")}
            disabled={mois >= moisCourant}
            onClick={() => changerDeMois(1)}
          >
            <IconeChevronDroite className="h-[18px] w-[18px]" />
          </BoutonFleche>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {joursCourts(langue).map((l, i) => (
            <span key={i} className="pb-1 text-center text-[11px] font-semibold text-brume">
              {l}
            </span>
          ))}
          {Array.from({ length: decalage }, (_, i) => (
            <span key={`vide-${i}`} />
          ))}
          {Array.from({ length: nombreJours }, (_, i) => {
            const date = ajouterJours(mois, i);
            const actif = parJour.has(date);
            const choisi = date === jour;
            const futur = date > aujourdhui;
            return (
              <button
                key={date}
                type="button"
                disabled={!actif}
                aria-pressed={actif ? choisi : undefined}
                aria-label={`${libelleDate(date, langue)}${actif ? t(", séance", ", workout") : ""}`}
                onClick={() => setJour(choisi ? null : date)}
                className={`chiffres flex h-10 items-center justify-center rounded-doux text-[14px] transition-colors ${
                  actif
                    ? `bg-accent font-semibold text-sur-accent ${choisi ? "ring-2 ring-encre ring-offset-2 ring-offset-surface" : ""}`
                    : futur
                      ? "text-brume-faible/50"
                      : date === aujourdhui
                        ? "font-semibold text-encre ring-1 ring-inset ring-trait-vif"
                        : "text-brume"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {choisies.length === 0 && (
          <p className="mt-4 text-[13px] text-brume">
            {duMois.length > 0
              ? t(
                  "Touche un jour en couleur pour revoir la séance.",
                  "Tap a coloured day to see its workout.",
                )
              : t("Aucune séance ce mois-ci.", "No workouts this month.")}
          </p>
        )}
      </div>

      {choisies.length > 0 && (
        <div className="boite mt-3 divide-y divide-trait overflow-hidden">
          {choisies.map((s) => (
            <div key={s._id}>
              <LigneSeance seance={s} />
              <DetailSeance seance={s} />
            </div>
          ))}
        </div>
      )}
    </Carte>
  );
}
