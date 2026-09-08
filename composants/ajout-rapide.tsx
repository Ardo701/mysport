"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { BOISSONS, GRIGNOTAGES, type Extra } from "@/lib/extras";
import { heureCourante } from "@/lib/dates";
import { Bouton, Message } from "./ui";
import { Feuille } from "./feuille";
import { IconeCoche, IconePlus, IconeTexte } from "./icones";

/**
 * Ajout en un geste de ce qui se grignote ou se boit entre les repas.
 * Tout ce qui n'est pas dans la liste passe par l'estimation IA.
 */
export function AjoutRapide({
  ouvert,
  onFermer,
  date,
  onDecrire,
}: {
  ouvert: boolean;
  onFermer: () => void;
  date: string;
  onDecrire: () => void;
}) {
  const enregistrer = useMutation(api.repas.enregistrerRepas);
  const [onglet, setOnglet] = useState<"grignotage" | "boisson">("grignotage");
  const [ajoutes, setAjoutes] = useState<string[]>([]);
  const [quantites, setQuantites] = useState<Record<string, number>>({});

  const liste = onglet === "grignotage" ? GRIGNOTAGES : BOISSONS;

  async function ajouter(extra: Extra) {
    const quantite = quantites[extra.id] ?? 1;
    await enregistrer({
      date,
      type: "extra",
      source: "manuel",
      nom: quantite > 1 ? `${extra.nom} ×${quantite}` : extra.nom,
      kcal: Math.round(extra.kcal * quantite),
      proteines: Math.round(extra.proteines * quantite),
      glucides: Math.round(extra.glucides * quantite),
      lipides: Math.round(extra.lipides * quantite),
      heure: heureCourante(),
    });
    setAjoutes((a) => [...a, extra.id]);
    setTimeout(() => setAjoutes((a) => a.filter((id) => id !== extra.id)), 1400);
  }

  return (
    <Feuille
      ouverte={ouvert}
      onFermer={onFermer}
      surtitre="Entre les repas"
      titre="Grignotage et boissons"
    >
      <div className="space-y-5">
        <div className="flex gap-1 rounded-lg border border-trait bg-creux p-1">
          {(
            [
              ["grignotage", "À grignoter"],
              ["boisson", "À boire"],
            ] as const
          ).map(([cle, libelle]) => (
            <button
              key={cle}
              onClick={() => setOnglet(cle)}
              className={`flex-1 rounded-md py-2.5 text-[13px] font-medium transition ${
                onglet === cle ? "bg-jaune-vif text-sur-jaune" : "text-brume"
              }`}
            >
              {libelle}
            </button>
          ))}
        </div>

        <ul className="divide-y divide-trait overflow-hidden rounded-net border border-trait">
          {liste.map((extra) => {
            const quantite = quantites[extra.id] ?? 1;
            const vientDEtreAjoute = ajoutes.includes(extra.id);
            return (
              <li
                key={extra.id}
                className="flex items-center gap-2.5 bg-creux px-3.5 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px]">{extra.nom}</p>
                  <p className="chiffres text-[11px] text-brume-faible">
                    {extra.portion} · {extra.kcal} kcal
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1 rounded-md border border-trait">
                  <button
                    onClick={() =>
                      setQuantites((q) => ({
                        ...q,
                        [extra.id]: Math.max(1, quantite - 1),
                      }))
                    }
                    aria-label={`Diminuer la quantité de ${extra.nom}`}
                    className="px-2 py-1.5 text-brume-faible transition hover:text-encre"
                  >
                    −
                  </button>
                  <span className="chiffres w-4 text-center text-[13px]">
                    {quantite}
                  </span>
                  <button
                    onClick={() =>
                      setQuantites((q) => ({ ...q, [extra.id]: quantite + 1 }))
                    }
                    aria-label={`Augmenter la quantité de ${extra.nom}`}
                    className="px-2 py-1.5 text-brume-faible transition hover:text-encre"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => ajouter(extra)}
                  aria-label={`Ajouter ${extra.nom}`}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition ${
                    vientDEtreAjoute
                      ? "border-jaune bg-jaune-vif text-sur-jaune"
                      : "border-trait text-brume-faible hover:border-jaune hover:text-jaune"
                  }`}
                >
                  {vientDEtreAjoute ? (
                    <IconeCoche className="h-4 w-4" />
                  ) : (
                    <IconePlus className="h-4 w-4" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <Message>
          Rien ne correspond ? Décris ce que tu as pris et l'IA estime le reste.
        </Message>

        <Bouton
          variante="secondaire"
          taille="large"
          onClick={() => {
            onFermer();
            onDecrire();
          }}
        >
          <IconeTexte className="h-4 w-4" />
          Décrire autre chose
        </Bouton>
      </div>
    </Feuille>
  );
}
