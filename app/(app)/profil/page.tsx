"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { POIDS_MAX, poidsValide } from "@/convex/lib/poids";
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
import { aujourdhuiISO, libelleDateCourt, libelleJour } from "@/lib/dates";
import { nombre } from "@/lib/seances";

export default function PageProfil() {
  const profil = useQuery(api.profils.monProfil);
  const pesees = useQuery(api.pesees.mesPesees);
  const enregistrerProfil = useMutation(api.profils.enregistrerProfil);
  const { signOut } = useAuthActions();
  const router = useRouter();

  const [prenom, setPrenom] = useState("");
  const [etat, setEtat] = useState<"repos" | "envoi" | "enregistre" | "erreur">("repos");

  useEffect(() => {
    if (!profil) return;
    setPrenom(profil.prenom);
  }, [profil]);

  if (!profil || pesees === undefined) return <Chargement />;

  const modifie = prenom.trim() !== "" && prenom.trim() !== profil.prenom;

  async function sauvegarder() {
    setEtat("envoi");
    try {
      await enregistrerProfil({ prenom: prenom.trim() });
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
          <CartePoids pesees={pesees} />

          <Carte>
            <TitreSection titre="Profil" />
            <Champ
              libelle="Prénom"
              value={prenom}
              onChange={(e) => {
                setPrenom(e.target.value);
                setEtat("repos");
              }}
              className="!font-sans"
            />

            <Bouton
              taille="large"
              className="mt-5"
              disabled={!modifie || etat === "envoi"}
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
        MySport · les calories sont une estimation à partir de valeurs moyennes
        par activité, pas une mesure.
      </p>
    </div>
  );
}

/** Au-delà, l'historique se replie : la dernière pesée compte plus que celle d'il y a un an. */
const PESEES_VISIBLES = 6;

/**
 * Le poids au fil du temps : le dernier en date, de quoi en noter un nouveau,
 * et l'historique. Toucher une ligne la remet dans le formulaire pour la
 * corriger ou la supprimer.
 */
function CartePoids({ pesees }: { pesees: Doc<"pesees">[] }) {
  const enregistrer = useMutation(api.pesees.enregistrer);
  const supprimer = useMutation(api.pesees.supprimer);

  const [date, setDate] = useState(() => aujourdhuiISO());
  const [poidsKg, setPoidsKg] = useState<number | undefined>(undefined);
  // La pesée reprise depuis l'historique : seule elle peut se supprimer, pour
  // qu'un bouton de suppression n'apparaisse pas sur une pesée qu'on n'a pas
  // touchée, du seul fait que la date du jour en a déjà une.
  const [reprise, setReprise] = useState<Doc<"pesees">["_id"] | null>(null);
  const [toutVoir, setToutVoir] = useState(false);
  const [etat, setEtat] = useState<
    | { cle: "repos" | "envoi" | "erreur" }
    | { cle: "enregistre" | "supprime"; recalculees: number }
  >({ cle: "repos" });

  // La requête renvoie la plus récente en premier.
  const actuelle = pesees[0];
  const existante = pesees.find((p) => p.date === date);
  const aSupprimer = existante && existante._id === reprise ? existante : undefined;
  const visibles = toutVoir ? pesees : pesees.slice(0, PESEES_VISIBLES);

  function reprendre(p: Doc<"pesees">) {
    setReprise(p._id);
    setDate(p.date);
    setPoidsKg(p.poidsKg);
    setEtat({ cle: "repos" });
  }

  async function valider() {
    if (!poidsValide(poidsKg) || !date) return;
    setEtat({ cle: "envoi" });
    try {
      const recalculees = await enregistrer({ date, poidsKg });
      setEtat({ cle: "enregistre", recalculees });
      setReprise(null);
      setDate(aujourdhuiISO());
      setPoidsKg(undefined);
    } catch {
      setEtat({ cle: "erreur" });
    }
  }

  async function effacer() {
    if (!aSupprimer) return;
    setEtat({ cle: "envoi" });
    try {
      const recalculees = await supprimer({ id: aSupprimer._id });
      setEtat({ cle: "supprime", recalculees });
      setReprise(null);
      setDate(aujourdhuiISO());
      setPoidsKg(undefined);
    } catch {
      setEtat({ cle: "erreur" });
    }
  }

  return (
    <Carte>
      <TitreSection titre="Poids" />

      {actuelle && (
        <div className="mb-6 flex items-end justify-between gap-4">
          <p className="chiffres titre text-[34px] font-semibold leading-none">
            {nombre(actuelle.poidsKg)}
            <span className="ml-1.5 text-[14px] font-normal text-brume-faible">kg</span>
          </p>
          <p className="pb-0.5 text-right text-[12px] text-brume-faible">
            pesée du {libelleJour(actuelle.date)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="surtitre mb-2 block">Date</span>
          <input
            type="date"
            value={date}
            max={aujourdhuiISO()}
            onChange={(e) => {
              setDate(e.target.value);
              setEtat({ cle: "repos" });
            }}
            className="champ chiffres"
          />
        </label>
        <ChampNombre
          libelle="Poids"
          suffixe="kg"
          decimales
          placeholder={actuelle ? nombre(actuelle.poidsKg) : "80"}
          valeur={poidsKg}
          max={POIDS_MAX}
          onValeur={(n) => {
            setPoidsKg(n);
            setEtat({ cle: "repos" });
          }}
        />
      </div>

      <Bouton
        taille="large"
        className="mt-4"
        disabled={!poidsValide(poidsKg) || !date || etat.cle === "envoi"}
        onClick={valider}
      >
        {etat.cle === "envoi"
          ? "Enregistrement…"
          : existante
            ? `Remplacer la pesée du ${libelleDateCourt(date)}`
            : "Ajouter la pesée"}
      </Bouton>
      {aSupprimer && pesees.length > 1 && (
        <Bouton
          variante="fantome"
          taille="large"
          className="mt-1"
          disabled={etat.cle === "envoi"}
          onClick={effacer}
        >
          Supprimer cette pesée
        </Bouton>
      )}

      {etat.cle === "enregistre" && (
        <Message ton="succes" className="mt-3">
          Pesée enregistrée.{texteRecalcul(etat.recalculees)}
        </Message>
      )}
      {etat.cle === "supprime" && (
        <Message ton="succes" className="mt-3">
          Pesée supprimée.{texteRecalcul(etat.recalculees)}
        </Message>
      )}
      {etat.cle === "erreur" && (
        <Message ton="erreur" className="mt-3">
          L&apos;enregistrement a échoué. Réessaie dans un instant.
        </Message>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-brume-faible">
        Chaque séance compte avec le poids de sa date : la dernière pesée faite
        ce jour-là ou avant. Une pesée ajoutée ou corrigée dans le passé
        recalcule les séances qu&apos;elle concerne.
      </p>

      <ul className="mt-6">
        {visibles.map((p, i) => {
          // La suivante dans la liste est la pesée précédente dans le temps.
          const precedente = pesees[pesees.indexOf(p) + 1];
          const ecart = precedente ? p.poidsKg - precedente.poidsKg : null;
          const choisie = p._id === reprise;
          return (
            <li key={p._id}>
              <button
                type="button"
                onClick={() => reprendre(p)}
                className={`flex w-full items-baseline gap-4 py-3 text-left transition-colors hover:text-encre ${
                  i === 0 ? "" : "border-t border-trait"
                } ${choisie ? "text-encre" : "text-brume"}`}
              >
                <span className="flex-1 text-[13px]">{libelleJour(p.date)}</span>
                <span className="chiffres w-14 text-right text-[12px] text-brume-faible">
                  {ecart === null || ecart === 0 ? "" : ecartSigne(ecart)}
                </span>
                <span className="chiffres w-16 text-right text-[14px] font-medium text-encre">
                  {nombre(p.poidsKg)} kg
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {pesees.length > PESEES_VISIBLES && (
        <button
          type="button"
          onClick={() => setToutVoir((v) => !v)}
          className="w-full border-t border-trait pt-3 text-left text-[12px] text-brume transition-colors hover:text-encre"
        >
          {toutVoir ? "Replier" : `Voir les ${pesees.length - PESEES_VISIBLES} plus anciennes`}
        </button>
      )}
    </Carte>
  );
}

/** +0,5 ou −1,2 : le vrai signe moins, de la largeur du plus. */
function ecartSigne(ecart: number) {
  return `${ecart > 0 ? "+" : "−"}${nombre(Math.abs(ecart))}`;
}

function texteRecalcul(n: number) {
  if (n === 0) return "";
  return n === 1 ? " 1 séance recalculée." : ` ${n} séances recalculées.`;
}
