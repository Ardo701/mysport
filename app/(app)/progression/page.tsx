"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Stat } from "@/composants/jauges";
import {
  Bouton,
  Carte,
  Champ,
  Chargement,
  Message,
  TitreSection,
} from "@/composants/ui";
import { IconeBalance, IconeChevronGauche } from "@/composants/icones";
import {
  ajouterJours,
  aujourdhuiISO,
  libelleDateCourt,
  minutesEnHeures,
} from "@/lib/dates";

export default function PageProgression() {
  const [date, setDate] = useState<string | null>(null);
  useEffect(() => setDate(aujourdhuiISO()), []);

  const profil = useQuery(api.profils.monProfil);
  const mesures = useQuery(api.mesures.historiqueMesures, { limite: 90 });
  const seances = useQuery(api.seances.historique, { limite: 60 });
  const nuits = useQuery(
    api.sommeil.dernieresNuits,
    date ? { date, jours: 28 } : "skip",
  );
  const enregistrerMesure = useMutation(api.mesures.enregistrerMesure);

  const [poids, setPoids] = useState("");
  const [taille, setTaille] = useState("");
  const [etat, setEtat] = useState<"repos" | "envoi" | "ok">("repos");

  if (!date || !profil || mesures === undefined || seances === undefined || nuits === undefined)
    return <Chargement />;

  const premiere = mesures[0];
  const derniere = mesures[mesures.length - 1];
  const variation = premiere && derniere ? derniere.poidsKg - premiere.poidsKg : 0;

  const terminees = seances.filter((s) => s.statut === "terminee");
  const quatreSemaines = ajouterJours(date, -27);
  const terminees4S = terminees.filter((s) => s.date >= quatreSemaines);
  const moyenneSommeil =
    nuits.length > 0
      ? Math.round(nuits.reduce((s, n) => s + n.dureeMin, 0) / nuits.length)
      : 0;

  const tonnage = terminees.reduce(
    (total, s) =>
      total +
      s.series.reduce(
        (t, serie) =>
          t + (serie.fait ? (serie.poidsKg ?? 0) * (serie.reps ?? 0) : 0),
        0,
      ),
    0,
  );

  async function ajouterMesure() {
    if (!date || poids === "") return;
    setEtat("envoi");
    await enregistrerMesure({
      date,
      poidsKg: Number(poids),
      tourTailleCm: taille === "" ? undefined : Number(taille),
    });
    setPoids("");
    setTaille("");
    setEtat("ok");
  }

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-brume transition hover:text-craie"
        >
          <IconeChevronGauche className="h-4 w-4" />
          Aujourd'hui
        </Link>
        <p className="surtitre mb-2.5">Sur la durée</p>
        <h1 className="titre text-[28px] font-bold leading-none">Progression</h1>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <Stat
          libelle="Poids"
          valeur={derniere?.poidsKg ?? profil.poidsKg}
          unite="kg"
          detail={
            variation === 0
              ? "stable depuis le début"
              : `${variation > 0 ? "+" : ""}${variation.toFixed(1)} kg depuis le début`
          }
        />
        <Stat
          libelle="Séances"
          valeur={terminees4S.length}
          detail="sur les 4 dernières semaines"
        />
        <Stat
          libelle="Sommeil moyen"
          valeur={moyenneSommeil > 0 ? minutesEnHeures(moyenneSommeil) : "—"}
          detail="sur 4 semaines"
        />
        <Stat
          libelle="Volume soulevé"
          valeur={tonnage >= 1000 ? `${(tonnage / 1000).toFixed(1)} t` : `${Math.round(tonnage)} kg`}
          detail="cumul enregistré"
        />
      </div>

      {/* Courbe de poids */}
      <Carte>
        <TitreSection
          surtitre="Poids"
          titre="Évolution"
          action={<IconeBalance className="h-5 w-5 text-jaune" />}
        />
        {mesures.length < 2 ? (
          <p className="py-6 text-center text-[13px] text-brume-sombre">
            Ajoute au moins deux pesées pour voir la courbe. Pèse-toi le matin, à
            jeun, deux fois par semaine.
          </p>
        ) : (
          <CourbePoids
            points={mesures.map((m) => ({ date: m.date, valeur: m.poidsKg }))}
          />
        )}

        <div className="mt-5 border-t border-trait pt-4">
          <p className="surtitre mb-3">Nouvelle pesée</p>
          <div className="grid grid-cols-2 gap-3">
            <Champ
              type="number"
              inputMode="decimal"
              step="0.1"
              suffixe="kg"
              placeholder="Poids"
              value={poids}
              onChange={(e) => {
                setPoids(e.target.value);
                setEtat("repos");
              }}
            />
            <Champ
              type="number"
              inputMode="decimal"
              step="0.5"
              suffixe="cm"
              placeholder="Tour de taille"
              value={taille}
              onChange={(e) => {
                setTaille(e.target.value);
                setEtat("repos");
              }}
            />
          </div>
          <div className="mt-3">
            <Bouton
              taille="large"
              disabled={poids === "" || etat === "envoi"}
              onClick={ajouterMesure}
            >
              {etat === "envoi" ? "Enregistrement…" : "Enregistrer"}
            </Bouton>
          </div>
          {etat === "ok" && (
            <div className="mt-3">
              <Message ton="succes">Pesée enregistrée.</Message>
            </div>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-brume-sombre">
            Le tour de taille est le meilleur indicateur pour le ventre et les
            poignées d'amour : il bouge même quand la balance stagne.
          </p>
        </div>
      </Carte>

      {/* Assiduité */}
      <Carte>
        <TitreSection surtitre="Régularité" titre="Séances par semaine" />
        <AssiduiteHebdo
          dateReference={date}
          dates={terminees.map((s) => s.date)}
          objectif={profil.joursParSemaine}
        />
      </Carte>

      {/* Dernières séances */}
      <section>
        <TitreSection surtitre="Historique" titre="Dernières séances" />
        {terminees.length === 0 ? (
          <p className="rounded-net border border-dashed border-trait px-4 py-7 text-center text-[13px] text-brume-sombre">
            Aucune séance terminée pour l'instant.
          </p>
        ) : (
          <ul className="divide-y divide-trait overflow-hidden rounded-net border border-trait">
            {terminees.slice(0, 10).map((s) => (
              <li
                key={s._id}
                className="flex items-center gap-3 bg-nuit px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px]">{s.seanceNom}</p>
                  <p className="chiffres mt-0.5 text-[11px] text-brume-sombre">
                    {libelleDateCourt(s.date)} · {s.series.filter((x) => x.fait).length}{" "}
                    séries · {s.dureeMin ?? "?"} min
                  </p>
                </div>
                {s.ressenti && (
                  <span className="chiffres shrink-0 rounded-full border border-trait px-2.5 py-1 text-[11px] text-brume">
                    RPE {s.ressenti}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** Courbe simple, tracée à la main en SVG pour rester légère sur mobile. */
function CourbePoids({ points }: { points: { date: string; valeur: number }[] }) {
  const largeur = 320;
  const hauteur = 120;
  const marge = 6;

  const valeurs = points.map((p) => p.valeur);
  const min = Math.min(...valeurs) - 0.5;
  const max = Math.max(...valeurs) + 0.5;
  const etendue = Math.max(0.5, max - min);

  const coords = points.map((p, i) => {
    const x = marge + (i / Math.max(1, points.length - 1)) * (largeur - marge * 2);
    const y = hauteur - marge - ((p.valeur - min) / etendue) * (hauteur - marge * 2);
    return { x, y, ...p };
  });

  const chemin = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");
  const surface = `${chemin} L ${coords[coords.length - 1].x.toFixed(1)} ${hauteur} L ${coords[0].x.toFixed(1)} ${hauteur} Z`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${largeur} ${hauteur}`}
        className="w-full"
        role="img"
        aria-label="Évolution du poids"
      >
        <defs>
          <linearGradient id="voileJaune" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-jaune)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-jaune)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={surface} fill="url(#voileJaune)" />
        <path
          d={chemin}
          fill="none"
          stroke="var(--color-jaune)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={i === coords.length - 1 ? 3.5 : 2}
            fill={i === coords.length - 1 ? "var(--color-jaune)" : "var(--color-noir)"}
            stroke="var(--color-jaune)"
            strokeWidth="1.5"
          />
        ))}
      </svg>
      <div className="chiffres mt-2 flex justify-between text-[11px] text-brume-sombre">
        <span>{libelleDateCourt(points[0].date)}</span>
        <span>
          {valeurs[0].toFixed(1)} → {valeurs[valeurs.length - 1].toFixed(1)} kg
        </span>
        <span>{libelleDateCourt(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}

/** Huit dernières semaines, une barre par semaine. */
function AssiduiteHebdo({
  dateReference,
  dates,
  objectif,
}: {
  dateReference: string;
  dates: string[];
  objectif: number;
}) {
  const semaines = Array.from({ length: 8 }, (_, i) => {
    const fin = ajouterJours(dateReference, -7 * (7 - i));
    const debut = ajouterJours(fin, -6);
    const compte = dates.filter((d) => d >= debut && d <= fin).length;
    return { debut, fin, compte };
  });

  return (
    <div>
      <div className="flex h-24 items-end gap-2">
        {semaines.map((s) => {
          const ratio = Math.min(1, s.compte / Math.max(1, objectif));
          return (
            <div key={s.fin} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-full w-full items-end">
                <div
                  className="w-full rounded-sm"
                  style={{
                    height: `${Math.max(4, ratio * 100)}%`,
                    backgroundColor:
                      s.compte >= objectif
                        ? "var(--color-jaune)"
                        : s.compte === 0
                          ? "var(--color-trait)"
                          : "var(--color-trait-clair)",
                  }}
                />
              </div>
              <span className="chiffres text-[10px] text-brume-sombre">
                {s.compte}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-brume-sombre">
        Objectif : {objectif} séances par semaine. Les semaines pleines sont en
        jaune. La régularité pèse plus lourd que la perfection d'une séance.
      </p>
    </div>
  );
}
