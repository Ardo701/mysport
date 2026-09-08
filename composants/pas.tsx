"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Bouton, Carte, Etiquette, TitreSection } from "@/composants/ui";
import { Jauge } from "@/composants/jauges";
import { IconeHaltere, IconePas, IconePlus } from "@/composants/icones";
import { effortDuJour, objectifPas, type ProfilEffort } from "@/lib/effort";

const AJOUTS = [500, 1000, 2000];

/**
 * Saisie des pas du jour et récapitulatif de l'effort.
 *
 * Le téléphone et la montre donnent un cumul depuis minuit : le champ contient
 * donc le total de la journée, pas un ajout. Les boutons rapides restent utiles
 * pour compléter de tête une sortie qu'on vient de faire.
 */
export function CartePas({
  date,
  profil,
  seanceDureeMin = null,
}: {
  date: string;
  profil: ProfilEffort;
  seanceDureeMin?: number | null;
}) {
  const ligne = useQuery(api.pas.pasDuJour, { date });
  const enregistrer = useMutation(api.pas.enregistrerPas);

  const enregistres = ligne?.pas ?? null;
  const [saisie, setSaisie] = useState("");
  const [modifie, setModifie] = useState(false);

  // Tant que rien n'est en cours de saisie, le champ suit la base : le compteur
  // peut être mis à jour depuis un autre appareil.
  useEffect(() => {
    if (!modifie) setSaisie(enregistres === null ? "" : String(enregistres));
  }, [enregistres, modifie]);

  const effort = effortDuJour(profil, enregistres, seanceDureeMin);
  const objectif = objectifPas(profil.niveauActivite);

  async function envoyer(total: number) {
    setModifie(false);
    await enregistrer({ date, pas: total });
  }

  return (
    <section>
      <TitreSection
        surtitre="Activité"
        titre="Effort du jour"
        action={
          effort.kcalTotal > 0 ? (
            <Etiquette ton="jaune">{effort.kcalTotal} kcal</Etiquette>
          ) : null
        }
      />
      <Carte>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="chiffres titre text-[30px] font-bold leading-none">
              {enregistres === null ? (
                <span className="text-brume-sombre">—</span>
              ) : (
                enregistres.toLocaleString("fr-FR")
              )}
              <span className="ml-1.5 text-[13px] font-normal text-brume-sombre">
                pas
              </span>
            </p>
            <p className="chiffres mt-2 text-[12px] text-brume-sombre">
              {enregistres === null
                ? `Objectif ${objectif.toLocaleString("fr-FR")} pas`
                : `${effort.distanceKm.toFixed(1)} km · ${effort.kcalMarche} kcal`}
            </p>
          </div>
          <IconePas className="h-5 w-5 shrink-0 text-jaune" />
        </div>

        <div className="mt-4">
          <Jauge pourcent={((enregistres ?? 0) / objectif) * 100} />
        </div>

        <div className="mt-4 flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            value={saisie}
            onChange={(e) => {
              setSaisie(e.target.value);
              setModifie(true);
            }}
            placeholder="Total de la journée"
            aria-label="Nombre de pas de la journée"
            className="champ chiffres flex-1"
          />
          <Bouton
            disabled={!modifie || saisie.trim() === ""}
            onClick={() => envoyer(Number(saisie) || 0)}
          >
            Noter
          </Bouton>
        </div>

        <div className="mt-2 flex gap-2">
          {AJOUTS.map((ajout) => (
            <button
              key={ajout}
              onClick={() => envoyer((enregistres ?? 0) + ajout)}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-trait bg-ardoise py-2 text-[12px] text-brume transition hover:border-jaune hover:text-craie"
            >
              <IconePlus className="h-3.5 w-3.5" />
              <span className="chiffres">{ajout.toLocaleString("fr-FR")}</span>
            </button>
          ))}
        </div>

        {(effort.kcalSeance > 0 || enregistres !== null) && (
          <div className="mt-4 space-y-2 border-t border-trait pt-3.5">
            {effort.kcalSeance > 0 && (
              <p className="flex items-center gap-2 text-[12px] text-brume">
                <IconeHaltere className="h-3.5 w-3.5 shrink-0 text-brume-sombre" />
                Séance : <span className="chiffres">{effort.kcalSeance} kcal</span>
              </p>
            )}
            {enregistres !== null && (
              <p className="text-[11px] leading-relaxed text-brume-sombre">
                {effort.ecartPas > 0 ? (
                  <>
                    Au-dessus de ton rythme habituel (
                    {effort.pasReference.toLocaleString("fr-FR")} pas) :{" "}
                    <span className="chiffres text-jaune">
                      +{effort.ecartPas} kcal
                    </span>{" "}
                    ajoutées à ta cible du jour.
                  </>
                ) : effort.ecartPas < 0 ? (
                  <>
                    Sous ton rythme habituel (
                    {effort.pasReference.toLocaleString("fr-FR")} pas) :{" "}
                    <span className="chiffres">{effort.ecartPas} kcal</span> sur ta
                    cible du jour.
                  </>
                ) : (
                  <>
                    Pile sur ton rythme habituel : la cible du jour ne bouge pas.
                  </>
                )}
              </p>
            )}
          </div>
        )}
      </Carte>
    </section>
  );
}
