"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import { Stat } from "@/composants/jauges";
import { IconeChevronDroite, IconeChevronGauche } from "@/composants/icones";
import { DetailSeance, LigneSeance } from "@/composants/seance";
import {
  Bouton,
  Carte,
  Chargement,
  Colonne,
  Colonnes,
  EnTetePage,
  EtatVide,
  Onglets,
  TitreSection,
} from "@/composants/ui";
import {
  JOURS_COURTS,
  ajouterJours,
  aujourdhuiISO,
  debutDeMois,
  differenceEnJours,
  jourDeLaSemaine,
  libelleDate,
  libelleDateCourt,
  libelleMois,
  lundiDeLaSemaine,
} from "@/lib/dates";
import {
  entre,
  exercicesFrequents,
  libelleDuree,
  nombre,
  parSemaine,
  totaux,
  type Seance,
  type Totaux,
} from "@/lib/seances";

type Periode = "semaine" | "4s" | "3m" | "12m" | "tout";

/** En semaines entières : une moyenne par semaine sur des semaines tronquées tomberait faux. */
const PERIODES: { cle: Periode; libelle: string; semaines?: number }[] = [
  { cle: "semaine", libelle: "Semaine" },
  { cle: "4s", libelle: "4 semaines", semaines: 4 },
  { cle: "3m", libelle: "3 mois", semaines: 13 },
  { cle: "12m", libelle: "12 mois", semaines: 52 },
  { cle: "tout", libelle: "Tout" },
];

/** Au-delà, les barres deviendraient des fils : on montre les deux dernières années. */
const SEMAINES_MAX_GRAPHIQUE = 104;

export default function PageStatistiques() {
  const [aujourdhui, setAujourdhui] = useState<string | null>(null);
  useEffect(() => setAujourdhui(aujourdhuiISO()), []);
  const [periode, setPeriode] = useState<Periode>("4s");
  // La semaine affichée par l'onglet Semaine ; null tant qu'on n'a pas bougé,
  // c'est-à-dire la semaine en cours.
  const [lundiChoisi, setLundiChoisi] = useState<string | null>(null);

  const seances = useQuery(api.seances.mesSeances);

  if (!aujourdhui || seances === undefined) return <Chargement />;

  if (seances.length === 0) {
    return (
      <div className="lg:max-w-[640px]">
        <EnTetePage titre="Statistiques" />
        <EtatVide
          titre="Pas encore de statistiques"
          detail="Elles se calculent à partir des séances que tu notes : jours d'entraînement, temps passé, calories dépensées."
          action={
            <Link href="/seance">
              <Bouton>Ajouter une séance</Bouton>
            </Link>
          }
        />
      </div>
    );
  }

  const premiere = seances.at(-1)!.date;
  const lundiCourant = lundiDeLaSemaine(aujourdhui);
  const choix = PERIODES.find((p) => p.cle === periode)!;
  const lundi = lundiChoisi ?? lundiCourant;

  const nombreSemaines =
    periode === "semaine"
      ? 1
      : (choix.semaines ??
        Math.max(4, Math.floor(differenceEnJours(lundiDeLaSemaine(premiere), lundiCourant) / 7) + 1));
  const debut =
    periode === "semaine" ? lundi : ajouterJours(lundiCourant, -7 * (nombreSemaines - 1));

  return (
    <div>
      <EnTetePage
        surtitre={
          periode === "semaine" ? `Semaine du ${libelleDate(debut)}` : `Depuis le ${libelleDate(debut)}`
        }
        titre="Statistiques"
      />

      <Onglets
        className="mb-10"
        options={PERIODES.map((p) => ({ cle: p.cle, libelle: p.libelle }))}
        valeur={periode}
        onChange={setPeriode}
      />

      {periode === "semaine" ? (
        <VueSemaine
          seances={seances}
          aujourdhui={aujourdhui}
          lundi={lundi}
          lundiMin={lundiDeLaSemaine(premiere)}
          onLundi={setLundiChoisi}
        />
      ) : (
        <VuePeriode
          seances={seances}
          aujourdhui={aujourdhui}
          debut={debut}
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
  const dansPeriode = entre(seances, debut, aujourdhui);
  const t = totaux(dansPeriode);
  // La semaine en cours n'est pas finie : on divise par les jours réellement
  // écoulés, pas par un nombre rond de semaines qui ferait baisser la moyenne
  // chaque lundi.
  const joursEcoules = differenceEnJours(debut, aujourdhui) + 1;
  const parSemaineMoyenne = (t.kcal / joursEcoules) * 7;

  const semaines = parSemaine(
    seances,
    aujourdhui,
    Math.min(nombreSemaines, SEMAINES_MAX_GRAPHIQUE),
  );
  const milieu = Math.floor((semaines.length - 1) / 2);

  return (
    <Colonnes>
      <Colonne>
        <Carte>
          <TitreSection titre="Dépense moyenne" />
          {/* Le chiffre qu'on vient chercher, en grand ; les deux autres
              moyennes le précisent sans lui disputer la place. */}
          <ChiffreVedette valeur={parSemaineMoyenne} unite="kcal par semaine" />
          <div className="mt-6 grid grid-cols-2 gap-4">
            <StatsMoyennes totaux={t} jours={joursEcoules} />
          </div>
        </Carte>

        <Carte>
          <TitreSection titre="Calories par semaine" />
          <GraphiqueBarres
            barres={semaines.map((s) => ({
              cle: s.lundi,
              titre: `Semaine du ${libelleDateCourt(s.lundi)}`,
              kcal: s.kcal,
              seances: s.seances,
            }))}
            moyenne={parSemaineMoyenne}
            parDefaut={{
              titre: "Cette semaine",
              kcal: semaines.at(-1)!.kcal,
              seances: semaines.at(-1)!.seances,
            }}
            axe={
              <div className="chiffres mt-2 flex justify-between text-[10px] text-brume-faible">
                <span>{libelleDateCourt(semaines[0].lundi)}</span>
                {semaines.length > 4 && <span>{libelleDateCourt(semaines[milieu].lundi)}</span>}
                <span>{libelleDateCourt(semaines.at(-1)!.lundi)}</span>
              </div>
            }
          />
        </Carte>

        <Carte>
          <Calendrier seances={seances} aujourdhui={aujourdhui} />
        </Carte>
      </Colonne>

      <Colonne>
        <Carte>
          <TitreSection titre="Sur la période" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <Stat libelle="Séances" valeur={t.seances} />
            <Stat libelle="Séances par semaine" valeur={nombre((t.seances / joursEcoules) * 7)} />
            <StatsVolume totaux={t} jours={joursEcoules} />
          </div>
        </Carte>

        <ExercicesFrequents seances={dansPeriode} />
      </Colonne>
    </Colonnes>
  );
}

/**
 * Une semaine, du lundi au dimanche : ce qu'elle a coûté, jour par jour, et ce
 * qui a été fait chaque jour — repos compris.
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
  const dimanche = ajouterJours(lundi, 6);
  const enCours = lundi === lundiDeLaSemaine(aujourdhui);
  // La semaine en cours se juge sur les jours déjà passés : le jeudi, la
  // moyenne par jour ne compte pas le week-end qui n'a pas encore eu lieu.
  const joursEcoules = enCours ? differenceEnJours(lundi, aujourdhui) + 1 : 7;

  const deLaSemaine = entre(seances, lundi, dimanche);
  const t = totaux(deLaSemaine);
  const precedente = totaux(entre(seances, ajouterJours(lundi, -7), ajouterJours(lundi, -1)));

  const jours = Array.from({ length: 7 }, (_, i) => {
    const date = ajouterJours(lundi, i);
    const duJour = deLaSemaine.filter((s) => s.date === date);
    return {
      date,
      seances: duJour,
      kcal: duJour.reduce((n, s) => n + s.kcal, 0),
      avenir: date > aujourdhui,
    };
  });

  return (
    <>
      <div className="mb-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onLundi(ajouterJours(lundi, -7))}
          disabled={lundi <= lundiMin}
          aria-label="Semaine précédente"
          className="p-1 text-brume transition-colors hover:text-encre disabled:opacity-30"
        >
          <IconeChevronGauche className="h-4 w-4" />
        </button>
        <div className="text-center">
          <p className="chiffres text-[14px] font-medium">{libelleSemaine(lundi)}</p>
          <p className="mt-1 text-[11px] text-brume-faible">
            {enCours ? "Cette semaine" : `Il y a ${libelleEcart(differenceEnJours(lundi, lundiDeLaSemaine(aujourdhui)) / 7)}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onLundi(ajouterJours(lundi, 7))}
          disabled={enCours}
          aria-label="Semaine suivante"
          className="p-1 text-brume transition-colors hover:text-encre disabled:opacity-30"
        >
          <IconeChevronDroite className="h-4 w-4" />
        </button>
      </div>

      <Colonnes>
        <Colonne>
          <Carte>
            <TitreSection titre="Dépense de la semaine" />
            <ChiffreVedette valeur={t.kcal} unite="kcal" />
            <p className="mt-3 text-[12px] text-brume-faible">
              Semaine précédente :{" "}
              <span className="chiffres text-brume">{precedente.kcal.toLocaleString("fr-FR")} kcal</span>
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <StatsMoyennes totaux={t} jours={joursEcoules} />
            </div>
          </Carte>

          <Carte>
            <TitreSection titre="Calories par jour" />
            <GraphiqueBarres
              barres={jours.map((j) => ({
                cle: j.date,
                titre: libelleDate(j.date),
                kcal: j.kcal,
                seances: j.seances.length,
                avenir: j.avenir,
              }))}
              moyenne={t.kcal / joursEcoules}
              parDefaut={{ titre: "Toute la semaine", kcal: t.kcal, seances: t.seances }}
              axe={
                <div className="mt-2 flex gap-[2px]">
                  {jours.map((j, i) => (
                    <span
                      key={j.date}
                      className={`surtitre flex-1 text-center ${j.date === aujourdhui ? "text-encre" : ""}`}
                    >
                      {JOURS_COURTS[i]}
                    </span>
                  ))}
                </div>
              }
            />
          </Carte>

          <Carte>
            <TitreSection
              titre="Jour par jour"
              action={
                <span className="chiffres text-[12px] text-brume">
                  {t.seances} séance{t.seances > 1 ? "s" : ""}
                </span>
              }
            />
            {/* Le titre porte déjà un filet : la première ligne n'en remet pas un. */}
            <div className="[&>div:first-child>*:first-child]:border-t-0">
              {jours.map((j) => (
                <div key={j.date}>
                  {j.seances.length > 0 ? (
                    j.seances.map((s) => (
                      <div key={s._id}>
                        <LigneSeance seance={s} />
                        <DetailSeance seance={s} />
                      </div>
                    ))
                  ) : (
                    <JourSansSeance date={j.date} avenir={j.avenir} />
                  )}
                </div>
              ))}
            </div>
          </Carte>
        </Colonne>

        <Colonne>
          <Carte>
            <TitreSection titre="Sur la semaine" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
              <Stat libelle="Séances" valeur={t.seances} />
              <StatsVolume totaux={t} jours={joursEcoules} />
            </div>
          </Carte>

          <ExercicesFrequents seances={deLaSemaine} />
        </Colonne>
      </Colonnes>
    </>
  );
}

/** « 12 – 18 oct. », ou « 28 sept. – 4 oct. » quand la semaine change de mois. */
function libelleSemaine(lundi: string) {
  const dimanche = ajouterJours(lundi, 6);
  const debut =
    lundi.slice(0, 7) === dimanche.slice(0, 7) ? String(Number(lundi.slice(8))) : libelleDateCourt(lundi);
  return `${debut} – ${libelleDateCourt(dimanche)}`;
}

function libelleEcart(semaines: number) {
  return semaines === 1 ? "une semaine" : `${semaines} semaines`;
}

/** Un jour sans séance, aligné sur les lignes de séance : repos, ou pas encore venu. */
function JourSansSeance({ date, avenir }: { date: string; avenir: boolean }) {
  const d = new Date(`${date}T12:00:00`);
  return (
    <div className="flex items-center gap-4 border-t border-trait py-3.5">
      <div className="w-10 shrink-0 text-center text-brume-faible">
        <p className="chiffres titre text-[20px] font-semibold leading-none">{d.getDate()}</p>
        <p className="surtitre mt-1.5">
          {d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "")}
        </p>
      </div>
      <p className="text-[13px] text-brume-faible">{avenir ? "—" : "Repos"}</p>
    </div>
  );
}

/** Le chiffre principal d'une vue, en très grand. */
function ChiffreVedette({ valeur, unite }: { valeur: number; unite: string }) {
  return (
    <p className="chiffres titre text-[54px] font-bold leading-[0.85] tracking-[-0.04em]">
      {Math.round(valeur).toLocaleString("fr-FR")}
      <span className="ml-2 text-[13px] font-normal tracking-normal text-brume-faible">{unite}</span>
    </p>
  );
}

/** Par séance et par jour : les deux moyennes qui précisent le chiffre principal. */
function StatsMoyennes({ totaux: t, jours }: { totaux: Totaux; jours: number }) {
  return (
    <>
      <Stat
        libelle="Par séance"
        valeur={t.seances > 0 ? Math.round(t.kcal / t.seances).toLocaleString("fr-FR") : "—"}
        unite="kcal"
      />
      <Stat
        libelle="Par jour"
        valeur={Math.round(t.kcal / jours).toLocaleString("fr-FR")}
        unite="kcal"
        detail="jours de repos compris"
      />
    </>
  );
}

/** Jours actifs, temps et dépense : ce que les deux vues comptent de la même façon. */
function StatsVolume({ totaux: t, jours }: { totaux: Totaux; jours: number }) {
  return (
    <>
      <Stat libelle="Jours actifs" valeur={t.jours} detail={`sur ${jours}`} />
      <Stat libelle="Temps total" valeur={libelleDuree(t.dureeMin)} />
      <Stat
        libelle="Durée moyenne"
        valeur={t.seances > 0 ? libelleDuree(t.dureeMin / t.seances) : "—"}
      />
      <Stat libelle="Dépense totale" valeur={t.kcal.toLocaleString("fr-FR")} unite="kcal" />
    </>
  );
}

function ExercicesFrequents({ seances }: { seances: Seance[] }) {
  const frequents = exercicesFrequents(seances, 8);
  return (
    <Carte>
      <TitreSection titre="Exercices les plus faits" />
      {frequents.length === 0 ? (
        <p className="text-[13px] text-brume">Aucun exercice détaillé sur la période.</p>
      ) : (
        <ul className="space-y-3">
          {frequents.map((e) => (
            <li key={e.nom}>
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="truncate">{e.nom}</span>
                <span className="chiffres shrink-0 text-brume">
                  {e.seances} séance{e.seances > 1 ? "s" : ""}
                </span>
              </div>
              <div className="mt-1.5 h-[3px] bg-trait">
                <div
                  className="h-full bg-jaune"
                  style={{ width: `${(e.seances / frequents[0].seances) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Carte>
  );
}

type Barre = {
  cle: string;
  /** Ce que la lecture au-dessus du graphique dit de la barre désignée. */
  titre: string;
  kcal: number;
  seances: number;
  /** Un jour pas encore venu : ni barre, ni zéro. */
  avenir?: boolean;
};

/**
 * Une barre par semaine ou par jour, et la moyenne en pointillé.
 *
 * Au survol — ou au toucher, sur téléphone — la barre désignée s'écrit
 * au-dessus du graphique. Sans désignation, c'est `parDefaut` qui s'affiche :
 * la semaine en cours, ou le total de la semaine vue jour par jour.
 */
function GraphiqueBarres({
  barres,
  moyenne,
  parDefaut,
  axe,
}: {
  barres: Barre[];
  moyenne: number;
  parDefaut: { titre: string; kcal: number; seances: number };
  axe: ReactNode;
}) {
  const [designee, setDesignee] = useState<number | null>(null);
  const max = Math.max(moyenne, ...barres.map((b) => b.kcal), 1);
  const lue = designee === null ? parDefaut : barres[designee];

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <p className="text-[13px] text-brume first-letter:uppercase">{lue.titre}</p>
        <p className="chiffres shrink-0 text-[13px]">
          <span className="font-semibold">{lue.kcal.toLocaleString("fr-FR")} kcal</span>
          <span className="text-brume">
            {" "}· {lue.seances} séance{lue.seances > 1 ? "s" : ""}
          </span>
        </p>
      </div>

      <div className="relative h-40 border-b border-trait-vif" onMouseLeave={() => setDesignee(null)}>
        {moyenne > 0 && (
          <div
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-brume-faible"
            style={{ bottom: `${(moyenne / max) * 100}%` }}
          >
            <span className="absolute -top-4 right-0 bg-fond pl-1 text-[10px] text-brume-faible">
              moyenne
            </span>
          </div>
        )}
        <div className="flex h-full items-end gap-[2px]">
          {barres.map((b, i) => (
            <button
              key={b.cle}
              type="button"
              disabled={b.avenir}
              aria-label={`${b.titre} : ${b.kcal} kcal, ${b.seances} séances`}
              onMouseEnter={() => setDesignee(i)}
              onFocus={() => setDesignee(i)}
              onClick={() => setDesignee(i)}
              className="flex h-full min-w-0 flex-1 items-end justify-center"
            >
              {!b.avenir && (
                <span
                  className={`block w-full max-w-[44px] rounded-t-[4px] transition-opacity ${
                    b.kcal > 0 ? "bg-jaune" : "bg-trait-vif"
                  } ${designee === null || designee === i ? "opacity-100" : "opacity-45"}`}
                  // Une barre vide garde un trait de deux pixels : la semaine
                  // ou le jour existe, il est à zéro, ce n'est pas une donnée
                  // manquante.
                  style={{ height: b.kcal > 0 ? `${(b.kcal / max) * 100}%` : "2px" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {axe}
    </div>
  );
}

/** Le mois en grille : un jour coloré est un jour d'entraînement, le toucher montre la séance. */
function Calendrier({ seances, aujourdhui }: { seances: Seance[]; aujourdhui: string }) {
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
    <div>
      <TitreSection
        titre="Jour par jour"
        action={
          <span className="chiffres text-[12px] text-brume">
            {duMois.length} séance{duMois.length > 1 ? "s" : ""}
          </span>
        }
      />

      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => changerDeMois(-1)}
          aria-label="Mois précédent"
          className="p-1 text-brume transition-colors hover:text-encre"
        >
          <IconeChevronGauche className="h-4 w-4" />
        </button>
        <p className="text-[14px] font-medium first-letter:uppercase">{libelleMois(mois)}</p>
        <button
          type="button"
          onClick={() => changerDeMois(1)}
          disabled={mois >= moisCourant}
          aria-label="Mois suivant"
          className="p-1 text-brume transition-colors hover:text-encre disabled:opacity-30"
        >
          <IconeChevronDroite className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {JOURS_COURTS.map((l, i) => (
          <span key={i} className="surtitre pb-1 text-center">
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
              aria-label={`${libelleDate(date)}${actif ? ", séance" : ""}`}
              onClick={() => setJour(choisi ? null : date)}
              className={`chiffres flex h-10 items-center justify-center rounded-doux text-[13px] transition-colors ${
                actif
                  ? `bg-jaune-vif font-semibold text-sur-jaune ${choisi ? "ring-2 ring-encre ring-offset-2 ring-offset-fond" : ""}`
                  : futur
                    ? "text-brume-faible/50"
                    : date === aujourdhui
                      ? "font-semibold text-encre"
                      : "text-brume-faible"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {choisies.length > 0 ? (
          <div className="[&>div:first-child>a]:pt-2">
            {choisies.map((s) => (
              <div key={s._id}>
                <LigneSeance seance={s} />
                <DetailSeance seance={s} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-brume-faible">
            {duMois.length > 0
              ? "Touche un jour en jaune pour revoir la séance."
              : "Aucune séance ce mois-ci."}
          </p>
        )}
      </div>
    </div>
  );
}
