"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { ChampNombre } from "@/composants/champ-nombre";
import { IconeFleche } from "@/composants/icones";
import { BasculeTheme } from "@/composants/theme";
import {
  Bouton,
  Carte,
  Champ,
  Chargement,
  Colonne,
  Colonnes,
  EnTetePage,
  Message,
  TitreSection,
} from "@/composants/ui";

export default function PageProfil() {
  const profil = useQuery(api.profils.monProfil);
  const enregistrerProfil = useMutation(api.profils.enregistrerProfil);
  const { signOut } = useAuthActions();
  const router = useRouter();

  const [prenom, setPrenom] = useState("");
  const [poidsKg, setPoidsKg] = useState<number | undefined>(undefined);
  const [etat, setEtat] = useState<"repos" | "envoi" | "enregistre" | "erreur">("repos");

  useEffect(() => {
    if (!profil) return;
    setPrenom(profil.prenom);
    setPoidsKg(profil.poidsKg);
  }, [profil]);

  if (!profil) return <Chargement />;

  const poidsValide = poidsKg !== undefined && poidsKg >= 30 && poidsKg <= 250;
  const modifie = prenom.trim() !== profil.prenom || poidsKg !== profil.poidsKg;

  async function sauvegarder() {
    if (!poidsValide) return;
    setEtat("envoi");
    try {
      await enregistrerProfil({ prenom: prenom.trim() || profil!.prenom, poidsKg });
      setEtat("enregistre");
    } catch {
      setEtat("erreur");
    }
  }

  return (
    <div>
      <EnTetePage surtitre={profil.email ?? undefined} titre={profil.prenom} />

      <Colonnes>
        <Colonne>
          <Carte>
            <TitreSection titre="Profil" />
            <div className="space-y-3.5">
              <Champ
                libelle="Prénom"
                value={prenom}
                onChange={(e) => {
                  setPrenom(e.target.value);
                  setEtat("repos");
                }}
                className="!font-sans"
              />
              <ChampNombre
                libelle="Poids"
                suffixe="kg"
                decimales
                valeur={poidsKg}
                max={250}
                onValeur={(n) => {
                  setPoidsKg(n);
                  setEtat("repos");
                }}
              />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-brume-faible">
              Le poids sert à estimer les calories des prochaines séances. Celles
              déjà notées gardent l&apos;estimation faite avec le poids du moment.
            </p>

            <Bouton
              taille="large"
              className="mt-5"
              disabled={!modifie || !poidsValide || etat === "envoi"}
              onClick={sauvegarder}
            >
              {etat === "envoi" ? "Enregistrement…" : "Enregistrer"}
            </Bouton>
            {etat === "enregistre" && (
              <Message ton="succes" className="mt-3">Profil enregistré.</Message>
            )}
            {etat === "erreur" && (
              <Message ton="erreur" className="mt-3">
                L&apos;enregistrement a échoué. Réessaie dans un instant.
              </Message>
            )}
          </Carte>
        </Colonne>

        <Colonne>
          {/* Sur ordinateur la bascule vit dans la barre latérale ; le
              téléphone n'en a pas, il lui faut donc son propre accès. */}
          <Carte className="lg:hidden">
            <TitreSection titre="Thème" />
            <BasculeTheme />
            <p className="mt-3 text-[11px] leading-relaxed text-brume-faible">
              Le choix reste sur cet appareil, et sur celui-là seulement.
            </p>
          </Carte>

          <button
            onClick={async () => {
              await signOut();
              router.replace("/connexion");
            }}
            className="flex w-full items-center justify-between border-t border-trait px-4 py-3.5 text-[14px] text-brume transition-colors hover:border-rouge/40 hover:text-rouge"
          >
            Se déconnecter
            <IconeFleche className="h-4 w-4" />
          </button>
        </Colonne>
      </Colonnes>

      <p className="mt-12 max-w-[62ch] text-[11px] leading-relaxed text-brume-faible">
        Cadence · les calories sont une estimation à partir de valeurs moyennes
        par activité, pas une mesure.
      </p>
    </div>
  );
}
