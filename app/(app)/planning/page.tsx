"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import {
  Bouton,
  Carte,
  Chargement,
  Colonne,
  Colonnes,
  Etiquette,
  Message,
  TitreSection,
} from "@/composants/ui";
import { Calendrier } from "@/composants/calendrier";
import { IconeHorloge, IconeLune } from "@/composants/icones";
import { JOURS, dureeNuitMin, minutesEnHeures } from "@/lib/dates";
import { TYPES_REPAS } from "@/lib/repas";

type Creneau = { jour: number; heure: string; seanceId: string };
type Repas = { type: string; heure: string; actif: boolean };

export default function PagePlanning() {
  const planning = useQuery(api.planning.monPlanning);
  const programme = useQuery(api.programme.programmeActif);
  const enregistrer = useMutation(api.planning.enregistrerPlanning);

  const [heureLever, setHeureLever] = useState("07:00");
  const [heureCoucher, setHeureCoucher] = useState("23:00");
  const [objectifSommeilH, setObjectifSommeilH] = useState(8);
  const [repas, setRepas] = useState<Repas[]>([]);
  const [entrainements, setEntrainements] = useState<Creneau[]>([]);
  const [etat, setEtat] = useState<"repos" | "enregistrement" | "enregistre">("repos");

  useEffect(() => {
    if (!planning) return;
    setHeureLever(planning.heureLever);
    setHeureCoucher(planning.heureCoucher);
    setObjectifSommeilH(planning.objectifSommeilH);
    setRepas(planning.repas);
    setEntrainements(planning.entrainements);
  }, [planning]);

  if (planning === undefined || programme === undefined) return <Chargement />;

  const dureePrevue = dureeNuitMin(heureCoucher, heureLever);
  const seances = programme?.seances ?? [];

  function majRepas(type: string, champs: Partial<Repas>) {
    setRepas((liste) =>
      liste.map((r) => (r.type === type ? { ...r, ...champs } : r)),
    );
    setEtat("repos");
  }

  function majJour(jour: number, seanceId: string | null, heure?: string) {
    setEntrainements((liste) => {
      const sans = liste.filter((c) => c.jour !== jour);
      if (seanceId === null) return sans;
      const existant = liste.find((c) => c.jour === jour);
      return [
        ...sans,
        { jour, seanceId, heure: heure ?? existant?.heure ?? "18:30" },
      ].sort((a, b) => a.jour - b.jour);
    });
    setEtat("repos");
  }

  async function sauvegarder() {
    setEtat("enregistrement");
    await enregistrer({
      heureLever,
      heureCoucher,
      objectifSommeilH,
      repas,
      entrainements,
    });
    setEtat("enregistre");
  }

  return (
    <div className="space-y-5 pb-4">
      <header className="mb-10 pt-1 lg:mb-12 lg:pt-0">
        <p className="surtitre mb-2.5">Tes horaires</p>
        <h1 className="titre text-[30px] font-bold leading-[0.95] tracking-[-0.03em] lg:text-[38px]">
          Planning
        </h1>
        <p className="mt-2.5 text-[14px] leading-relaxed text-brume">
          Des horaires réguliers font la moitié du résultat : le corps s'installe
          dans un rythme, la faim et le sommeil se calent dessus.
        </p>
      </header>

      {/* Le calendrier lit les réglages du dessous, en direct. */}
      <Calendrier
        planning={{
          heureLever,
          heureCoucher,
          objectifSommeilH,
          repas,
          entrainements,
        }}
        seances={seances}
      />

      <Colonnes>
        <Colonne>
          {/* Sommeil */}
          <Carte>
            <TitreSection
              titre="Sommeil"
              action={<IconeLune className="h-5 w-5 text-jaune" />}
            />
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="surtitre mb-2 block">Coucher visé</span>
                <input
                  type="time"
                  value={heureCoucher}
                  onChange={(e) => {
                    setHeureCoucher(e.target.value);
                    setEtat("repos");
                  }}
                  className="champ chiffres"
                />
              </label>
              <label className="block">
                <span className="surtitre mb-2 block">Lever visé</span>
                <input
                  type="time"
                  value={heureLever}
                  onChange={(e) => {
                    setHeureLever(e.target.value);
                    setEtat("repos");
                  }}
                  className="champ chiffres"
                />
              </label>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="surtitre">Objectif par nuit</span>
                <span className="chiffres text-[13px] text-jaune">
                  {objectifSommeilH} h
                </span>
              </div>
              <div className="flex gap-1.5">
                {[6, 7, 7.5, 8, 8.5, 9].map((h) => (
                  <button
                    key={h}
                    onClick={() => {
                      setObjectifSommeilH(h);
                      setEtat("repos");
                    }}
                    className={`chiffres flex-1 rounded-doux border py-2.5 text-[13px] transition-colors ${
                      objectifSommeilH === h
                        ? "border-jaune bg-jaune-vif text-sur-jaune font-semibold"
                        : "border-trait bg-creux text-brume"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-3.5 flex items-center gap-2 text-[12px] leading-relaxed text-brume-faible">
              <IconeHorloge className="h-3.5 w-3.5 shrink-0" />
              Ces horaires donnent {minutesEnHeures(dureePrevue)} de sommeil
              {dureePrevue < objectifSommeilH * 60
                ? ` — il te manque ${minutesEnHeures(objectifSommeilH * 60 - dureePrevue)} pour tenir ton objectif.`
                : " — objectif tenu."}
            </p>
          </Carte>

          {/* Repas */}
          <Carte>
            <TitreSection titre="Heures des repas" />
            <ul className="divide-y divide-trait overflow-hidden border-t border-trait">
              {TYPES_REPAS.filter((t) => t.cle !== "extra").map((t) => {
                const ligne = repas.find((r) => r.type === t.cle);
                if (!ligne) return null;
                return (
                  <li
                    key={t.cle}
                    className="flex items-center gap-3 bg-creux px-3.5 py-3"
                  >
                    <button
                      onClick={() => majRepas(t.cle, { actif: !ligne.actif })}
                      aria-pressed={ligne.actif}
                      className={`h-5 w-9 shrink-0 rounded-doux border transition-colors ${
                        ligne.actif ? "border-jaune bg-jaune-vif" : "border-trait bg-fond"
                      }`}
                    >
                      <span
                        className={`block h-3 w-3 transition-all ${
                          ligne.actif
                            ? "ml-[19px] bg-fond"
                            : "ml-[3px] bg-brume-faible"
                        }`}
                      />
                    </button>
                    <span
                      className={`flex-1 text-[14px] ${ligne.actif ? "" : "text-brume-faible line-through"}`}
                    >
                      {t.libelle}
                    </span>
                    <input
                      type="time"
                      value={ligne.heure}
                      disabled={!ligne.actif}
                      onChange={(e) => majRepas(t.cle, { heure: e.target.value })}
                      className="chiffres w-[104px] rounded-doux border border-trait bg-fond px-2.5 py-2 text-center text-[14px] outline-none focus:border-jaune disabled:opacity-40"
                    />
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-[12px] leading-relaxed text-brume-faible">
              Le déjeuner reste libre : c'est le repas que tu enregistres par photo ou
              par description.
            </p>
          </Carte>
        </Colonne>

        <Colonne>
          {/* Entraînements */}
          <Carte>
            <TitreSection
              titre="Créneaux d'entraînement"
              action={
                <Etiquette ton="jaune">{entrainements.length} par semaine</Etiquette>
              }
            />
            <ul className="space-y-2">
              {JOURS.map((nomJour, i) => {
                const jour = i + 1;
                const creneau = entrainements.find((c) => c.jour === jour);
                return (
                  <li
                    key={jour}
                    className={`rounded-doux border px-3.5 py-3 transition-colors ${
                      creneau ? "border-jaune/30 bg-jaune-voile" : "border-trait bg-creux"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-[74px] shrink-0 text-[13px] font-medium">
                        {nomJour}
                      </span>
                      <select
                        value={creneau?.seanceId ?? ""}
                        onChange={(e) =>
                          majJour(jour, e.target.value === "" ? null : e.target.value)
                        }
                        className="min-w-0 flex-1 rounded-doux border border-trait bg-fond px-2.5 py-2 text-[13px] outline-none focus:border-jaune"
                      >
                        <option value="">Repos</option>
                        {seances.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nom}
                          </option>
                        ))}
                      </select>
                      {creneau && (
                        <input
                          type="time"
                          value={creneau.heure}
                          onChange={(e) => majJour(jour, creneau.seanceId, e.target.value)}
                          className="chiffres w-[96px] shrink-0 rounded-doux border border-trait bg-fond px-2 py-2 text-center text-[13px] outline-none focus:border-jaune"
                        />
                      )}
                    </div>
                    {creneau && (
                      <p className="mt-2 pl-[86px] text-[11px] text-brume-faible">
                        {seances.find((s) => s.id === creneau.seanceId)?.focus}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </Carte>
        </Colonne>
      </Colonnes>

      {etat === "enregistre" && (
        <Message ton="succes" className="lg:max-w-[420px]">
          Planning enregistré.
        </Message>
      )}

      <div className="sticky bottom-[86px] z-30 lg:bottom-8 lg:max-w-[420px]">
        <Bouton
          taille="large"
          disabled={etat === "enregistrement"}
          onClick={sauvegarder}
        >
          {etat === "enregistrement" ? "Enregistrement…" : "Enregistrer le planning"}
        </Bouton>
      </div>
    </div>
  );
}
