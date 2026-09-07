"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Jauge, Stat } from "@/composants/jauges";
import {
  Bouton,
  Carte,
  Chargement,
  Message,
  TitreSection,
} from "@/composants/ui";
import { IconeChevronGauche, IconeLune } from "@/composants/icones";
import Link from "next/link";
import {
  ajouterJours,
  aujourdhuiISO,
  dureeNuitMin,
  libelleDateCourt,
  libelleRelatif,
  minutesEnHeures,
} from "@/lib/dates";

export default function PageSommeil() {
  const [date, setDate] = useState<string | null>(null);
  useEffect(() => setDate(aujourdhuiISO()), []);

  const planning = useQuery(api.planning.monPlanning);
  const nuit = useQuery(api.sommeil.nuitDuJour, date ? { date } : "skip");
  const nuits = useQuery(
    api.sommeil.dernieresNuits,
    date ? { date, jours: 14 } : "skip",
  );
  const enregistrer = useMutation(api.sommeil.enregistrerNuit);

  const [coucher, setCoucher] = useState("23:00");
  const [lever, setLever] = useState("07:00");
  const [qualite, setQualite] = useState(3);
  const [notes, setNotes] = useState("");
  const [etat, setEtat] = useState<"repos" | "envoi" | "enregistre">("repos");

  useEffect(() => {
    if (nuit) {
      setCoucher(nuit.heureCoucher);
      setLever(nuit.heureLever);
      setQualite(nuit.qualite);
      setNotes(nuit.notes ?? "");
    } else if (planning) {
      setCoucher(planning.heureCoucher);
      setLever(planning.heureLever);
    }
  }, [nuit, planning]);

  if (!date || !planning || nuit === undefined || nuits === undefined)
    return <Chargement />;

  const objectifMin = planning.objectifSommeilH * 60;
  const duree = dureeNuitMin(coucher, lever);
  const moyenne =
    nuits.length > 0
      ? Math.round(nuits.reduce((s, n) => s + n.dureeMin, 0) / nuits.length)
      : 0;
  const dette = nuits.reduce((s, n) => s + Math.max(0, objectifMin - n.dureeMin), 0);

  async function sauvegarder() {
    if (!date) return;
    setEtat("envoi");
    await enregistrer({
      date,
      heureCoucher: coucher,
      heureLever: lever,
      qualite,
      notes: notes.trim() || undefined,
    });
    setEtat("enregistre");
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
        <p className="surtitre mb-2.5">Nuit du {libelleRelatif(date).toLowerCase()}</p>
        <h1 className="titre text-[28px] font-bold leading-none">Sommeil</h1>
      </header>

      <Carte>
        <TitreSection
          surtitre="À remplir au réveil"
          titre="Ta nuit"
          action={<IconeLune className="h-5 w-5 text-jaune" />}
        />

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="surtitre mb-2 block">Couché à</span>
            <input
              type="time"
              value={coucher}
              onChange={(e) => {
                setCoucher(e.target.value);
                setEtat("repos");
              }}
              className="champ chiffres"
            />
          </label>
          <label className="block">
            <span className="surtitre mb-2 block">Levé à</span>
            <input
              type="time"
              value={lever}
              onChange={(e) => {
                setLever(e.target.value);
                setEtat("repos");
              }}
              className="champ chiffres"
            />
          </label>
        </div>

        <div className="mt-4 rounded-net border border-trait bg-ardoise px-4 py-3.5">
          <div className="flex items-end justify-between">
            <p className="chiffres titre text-[28px] font-semibold leading-none">
              {minutesEnHeures(duree)}
            </p>
            <span className="text-[12px] text-brume-sombre">
              objectif {planning.objectifSommeilH} h
            </span>
          </div>
          <div className="mt-3">
            <Jauge pourcent={(duree / objectifMin) * 100} />
          </div>
        </div>

        <div className="mt-4">
          <span className="surtitre mb-2 block">Qualité ressentie</span>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => {
                  setQualite(n);
                  setEtat("repos");
                }}
                className={`chiffres flex-1 rounded-lg border py-3 text-[15px] transition ${
                  qualite === n
                    ? "border-jaune bg-jaune font-semibold text-noir"
                    : "border-trait bg-ardoise text-brume"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-brume-sombre">
            1 = nuit hachée, 5 = réveil frais.
          </p>
        </div>

        <label className="mt-4 block">
          <span className="surtitre mb-2 block">Note (facultatif)</span>
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setEtat("repos");
            }}
            rows={2}
            placeholder="Écran tard, réveil nocturne, café du soir…"
            className="champ resize-none !font-sans"
          />
        </label>

        <div className="mt-4">
          <Bouton taille="large" disabled={etat === "envoi"} onClick={sauvegarder}>
            {etat === "envoi"
              ? "Enregistrement…"
              : nuit
                ? "Mettre à jour"
                : "Enregistrer la nuit"}
          </Bouton>
        </div>

        {etat === "enregistre" && (
          <div className="mt-3">
            <Message ton="succes">Nuit enregistrée.</Message>
          </div>
        )}
      </Carte>

      <section>
        <TitreSection surtitre="14 derniers jours" titre="Ce que ça donne" />
        <div className="mb-3 grid grid-cols-2 gap-2">
          <Stat
            libelle="Moyenne"
            valeur={moyenne > 0 ? minutesEnHeures(moyenne) : "—"}
            detail={`sur ${nuits.length} nuit${nuits.length > 1 ? "s" : ""}`}
          />
          <Stat
            libelle="Dette cumulée"
            valeur={dette > 0 ? minutesEnHeures(dette) : "0 h"}
            detail="sous l'objectif"
          />
        </div>

        {nuits.length === 0 ? (
          <p className="rounded-net border border-dashed border-trait px-4 py-7 text-center text-[13px] text-brume-sombre">
            Aucune nuit enregistrée pour l'instant.
          </p>
        ) : (
          <div className="carte p-4">
            <div className="flex h-28 items-end gap-1.5">
              {Array.from({ length: 14 }, (_, i) => {
                const jour = ajouterJours(date, -(13 - i));
                const n = nuits.find((x) => x.date === jour);
                const hauteur = n
                  ? Math.max(6, Math.min(100, (n.dureeMin / (objectifMin * 1.2)) * 100))
                  : 0;
                const suffisant = n ? n.dureeMin >= objectifMin - 30 : false;
                return (
                  <div key={jour} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex h-full w-full items-end">
                      <div
                        title={
                          n ? `${libelleDateCourt(jour)} : ${minutesEnHeures(n.dureeMin)}` : jour
                        }
                        className="w-full rounded-sm"
                        style={{
                          height: `${hauteur}%`,
                          backgroundColor: n
                            ? suffisant
                              ? "var(--color-jaune)"
                              : "var(--color-trait-clair)"
                            : "transparent",
                          border: n ? "none" : "1px dashed var(--color-trait)",
                          minHeight: n ? undefined : "6px",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-brume-sombre">
              En jaune, les nuits qui atteignent ton objectif. Sous 7 h de manière
              répétée, la récupération musculaire et la gestion de la faim se
              dégradent nettement.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
