"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Stat } from "@/composants/jauges";
import { IconeChevronDroite, IconeChevronGauche } from "@/composants/icones";
import { LigneSeance } from "@/composants/seance";
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
} from "@/lib/seances";

type Periode = "4s" | "3m" | "12m" | "tout";

/** En semaines entières : une moyenne par semaine sur des semaines tronquées tomberait faux. */
const PERIODES: { cle: Periode; libelle: string; semaines?: number }[] = [
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
  const nombreSemaines =
    choix.semaines ??
    Math.max(4, Math.floor(differenceEnJours(lundiDeLaSemaine(premiere), lundiCourant) / 7) + 1);
  const debut = ajouterJours(lundiCourant, -7 * (nombreSemaines - 1));

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
  const frequents = exercicesFrequents(dansPeriode, 8);

  return (
    <div>
      <EnTetePage
        surtitre={`Depuis le ${libelleDate(debut)}`}
        titre="Statistiques"
      />

      <Onglets
        className="mb-10"
        options={PERIODES.map((p) => ({ cle: p.cle, libelle: p.libelle }))}
        valeur={periode}
        onChange={setPeriode}
      />

      <Colonnes>
        <Colonne>
          <Carte>
            <TitreSection titre="Dépense moyenne" />
            {/* Le chiffre qu'on vient chercher, en grand ; les deux autres
                moyennes le précisent sans lui disputer la place. */}
            <p className="chiffres titre text-[54px] font-bold leading-[0.85] tracking-[-0.04em]">
              {Math.round(parSemaineMoyenne).toLocaleString("fr-FR")}
              <span className="ml-2 text-[13px] font-normal tracking-normal text-brume-faible">
                kcal par semaine
              </span>
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <Stat
                libelle="Par séance"
                valeur={t.seances > 0 ? Math.round(t.kcal / t.seances).toLocaleString("fr-FR") : "—"}
                unite="kcal"
              />
              <Stat
                libelle="Par jour"
                valeur={Math.round(t.kcal / joursEcoules).toLocaleString("fr-FR")}
                unite="kcal"
                detail="jours de repos compris"
              />
            </div>
          </Carte>

          <Carte>
            <TitreSection titre="Calories par semaine" />
            <GraphiqueSemaines semaines={semaines} moyenne={parSemaineMoyenne} />
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
              <Stat
                libelle="Séances par semaine"
                valeur={nombre((t.seances / joursEcoules) * 7)}
              />
              <Stat libelle="Jours actifs" valeur={t.jours} detail={`sur ${joursEcoules}`} />
              <Stat libelle="Temps total" valeur={libelleDuree(t.dureeMin)} />
              <Stat
                libelle="Durée moyenne"
                valeur={t.seances > 0 ? libelleDuree(t.dureeMin / t.seances) : "—"}
              />
              <Stat libelle="Dépense totale" valeur={t.kcal.toLocaleString("fr-FR")} unite="kcal" />
            </div>
          </Carte>

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
        </Colonne>
      </Colonnes>
    </div>
  );
}

/**
 * Une barre par semaine, et la moyenne en pointillé.
 *
 * Au survol — ou au toucher, sur téléphone — la semaine désignée s'écrit
 * au-dessus du graphique. Sans désignation, c'est la semaine en cours : c'est
 * celle qu'on regarde en premier.
 */
function GraphiqueSemaines({
  semaines,
  moyenne,
}: {
  semaines: ReturnType<typeof parSemaine>;
  moyenne: number;
}) {
  const [designee, setDesignee] = useState<number | null>(null);
  const max = Math.max(moyenne, ...semaines.map((s) => s.kcal), 1);
  const lue = semaines[designee ?? semaines.length - 1];
  const milieu = Math.floor((semaines.length - 1) / 2);

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <p className="text-[13px] text-brume">
          {designee === null ? "Cette semaine" : `Semaine du ${libelleDateCourt(lue.lundi)}`}
        </p>
        <p className="chiffres text-[13px]">
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
          {semaines.map((s, i) => (
            <button
              key={s.lundi}
              type="button"
              aria-label={`Semaine du ${libelleDateCourt(s.lundi)} : ${s.kcal} kcal, ${s.seances} séances`}
              onMouseEnter={() => setDesignee(i)}
              onFocus={() => setDesignee(i)}
              onClick={() => setDesignee(i)}
              className="flex h-full min-w-0 flex-1 items-end justify-center"
            >
              <span
                className={`block w-full max-w-[44px] rounded-t-[4px] transition-opacity ${
                  s.kcal > 0 ? "bg-jaune" : "bg-trait-vif"
                } ${designee === null || designee === i ? "opacity-100" : "opacity-45"}`}
                // Une semaine vide garde un trait de deux pixels : elle existe,
                // elle est à zéro, ce n'est pas une donnée manquante.
                style={{ height: s.kcal > 0 ? `${(s.kcal / max) * 100}%` : "2px" }}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="chiffres mt-2 flex justify-between text-[10px] text-brume-faible">
        <span>{libelleDateCourt(semaines[0].lundi)}</span>
        {semaines.length > 4 && <span>{libelleDateCourt(semaines[milieu].lundi)}</span>}
        <span>{libelleDateCourt(semaines.at(-1)!.lundi)}</span>
      </div>
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
          <div className="[&>a:first-child]:pt-2">
            {choisies.map((s) => (
              <LigneSeance key={s._id} seance={s} />
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
