"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { POIDS_MAX, poidsValide } from "@/convex/lib/poids";
import { ChampNombre } from "@/composants/champ-nombre";
import { ChiffreVedette } from "@/composants/jauges";
import { IconeFleche } from "@/composants/icones";
import { BasculeLangue, useLangue, type Langue } from "@/composants/langue";
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
  const { t } = useLangue();
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
            <TitreSection titre={t("Profil", "Profile")} />
            <div className="boite p-4">
              <Champ
                libelle={t("Prénom", "First name")}
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
                {etat === "envoi" ? t("Enregistrement…", "Saving…") : t("Enregistrer", "Save")}
              </Bouton>
              {etat === "enregistre" && (
                <Message ton="succes" className="mt-3">
                  {t("Profil enregistré.", "Profile saved.")}
                </Message>
              )}
              {etat === "erreur" && (
                <Message ton="erreur" className="mt-3">
                  {t(
                    "L'enregistrement a échoué. Réessaie dans un instant.",
                    "Saving failed. Try again in a moment.",
                  )}
                </Message>
              )}
            </div>
          </Carte>
        </Colonne>

        <Colonne>
          <Carte>
            <TitreSection titre={t("Langue", "Language")} />
            <BasculeLangue />
            <p className="mt-2.5 text-[12px] leading-relaxed text-brume">
              {t(
                "Par défaut, celle du téléphone. Le choix reste sur cet appareil.",
                "By default, your phone's language. The choice stays on this device.",
              )}
            </p>
          </Carte>

          {/* Sur ordinateur la bascule vit dans la barre latérale ; le
              téléphone n'en a pas, il lui faut donc son propre accès. */}
          <Carte className="lg:hidden">
            <TitreSection titre={t("Thème", "Theme")} />
            <BasculeTheme />
            <p className="mt-2.5 text-[12px] leading-relaxed text-brume">
              {t(
                "Le choix reste sur cet appareil, et sur celui-là seulement.",
                "The choice stays on this device, and this one only.",
              )}
            </p>
          </Carte>

          <button
            onClick={async () => {
              await signOut();
              router.replace("/connexion");
            }}
            className="boite flex w-full items-center justify-between px-4 py-3.5 text-[15px] font-medium text-rouge transition-colors hover:bg-creux"
          >
            {t("Se déconnecter", "Sign out")}
            <IconeFleche className="h-4 w-4" />
          </button>
        </Colonne>
      </Colonnes>

      <p className="mt-10 max-w-[62ch] text-[12px] leading-relaxed text-brume">
        {t(
          "MySport · les calories sont une estimation à partir de valeurs moyennes par activité, pas une mesure.",
          "MySport · calories are an estimate based on average values per activity, not a measurement.",
        )}
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
  const { langue, t } = useLangue();
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
      {actuelle && (
        <ChiffreVedette
          libelle={t("Poids actuel", "Current weight")}
          valeur={nombre(actuelle.poidsKg, langue)}
          unite="kg"
        >
          <p className="mt-2 text-[13px] text-brume">
            {t(
              `Pesée du ${libelleJour(actuelle.date, langue)}`,
              `Weighed on ${libelleJour(actuelle.date, langue)}`,
            )}
          </p>
        </ChiffreVedette>
      )}

      <div className="boite mt-6 p-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="surtitre mb-2 block">{t("Date", "Date")}</span>
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
            libelle={t("Poids", "Weight")}
            suffixe="kg"
            decimales
            placeholder={actuelle ? nombre(actuelle.poidsKg, langue) : "80"}
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
            ? t("Enregistrement…", "Saving…")
            : existante
              ? t(
                  `Remplacer la pesée du ${libelleDateCourt(date, langue)}`,
                  `Replace the ${libelleDateCourt(date, langue)} weigh-in`,
                )
              : t("Ajouter la pesée", "Add weigh-in")}
        </Bouton>
        {aSupprimer && pesees.length > 1 && (
          <Bouton
            variante="danger"
            taille="large"
            className="mt-2.5"
            disabled={etat.cle === "envoi"}
            onClick={effacer}
          >
            {t("Supprimer cette pesée", "Delete this weigh-in")}
          </Bouton>
        )}

        {etat.cle === "enregistre" && (
          <Message ton="succes" className="mt-3">
            {t("Pesée enregistrée.", "Weigh-in saved.")}
            {texteRecalcul(etat.recalculees, langue)}
          </Message>
        )}
        {etat.cle === "supprime" && (
          <Message ton="succes" className="mt-3">
            {t("Pesée supprimée.", "Weigh-in deleted.")}
            {texteRecalcul(etat.recalculees, langue)}
          </Message>
        )}
        {etat.cle === "erreur" && (
          <Message ton="erreur" className="mt-3">
            {t(
              "L'enregistrement a échoué. Réessaie dans un instant.",
              "Saving failed. Try again in a moment.",
            )}
          </Message>
        )}

        <p className="mt-3 text-[12px] leading-relaxed text-brume">
          {t(
            "Chaque séance compte avec le poids de sa date : la dernière pesée faite ce jour-là ou avant. Une pesée ajoutée ou corrigée dans le passé recalcule les séances qu'elle concerne.",
            "Each workout uses the weight on its date: the last weigh-in on or before that day. Adding or correcting a past weigh-in recalculates the workouts it affects.",
          )}
        </p>
      </div>

      <div className="mt-8">
        <TitreSection
          titre={t("Historique", "History")}
          action={t("touche une pesée pour la corriger", "tap a weigh-in to correct it")}
        />
        <ul className="boite divide-y divide-trait overflow-hidden">
          {visibles.map((p) => {
            // La suivante dans la liste est la pesée précédente dans le temps.
            const precedente = pesees[pesees.indexOf(p) + 1];
            const ecart = precedente ? p.poidsKg - precedente.poidsKg : null;
            const choisie = p._id === reprise;
            return (
              <li key={p._id}>
                <button
                  type="button"
                  aria-pressed={choisie}
                  onClick={() => reprendre(p)}
                  className={`flex w-full items-baseline gap-4 px-4 py-3 text-left transition-colors hover:bg-creux ${
                    choisie ? "bg-creux" : ""
                  }`}
                >
                  <span className="flex-1 text-[14px]">{libelleJour(p.date, langue)}</span>
                  <span className="chiffres w-14 text-right text-[13px] text-brume">
                    {ecart === null || ecart === 0 ? "" : ecartSigne(ecart, langue)}
                  </span>
                  <span className="titre w-16 text-right text-[15px] font-semibold">
                    {nombre(p.poidsKg, langue)} kg
                  </span>
                </button>
              </li>
            );
          })}
          {pesees.length > PESEES_VISIBLES && (
            <li>
              <button
                type="button"
                onClick={() => setToutVoir((v) => !v)}
                className="w-full px-4 py-3 text-left text-[13px] font-medium text-accent-texte transition-colors hover:bg-creux"
              >
                {toutVoir
                  ? t("Replier", "Show less")
                  : t(
                      `Voir les ${pesees.length - PESEES_VISIBLES} plus anciennes`,
                      `Show ${pesees.length - PESEES_VISIBLES} older`,
                    )}
              </button>
            </li>
          )}
        </ul>
      </div>
    </Carte>
  );
}

/** +0,5 ou −1,2 : le vrai signe moins, de la largeur du plus. */
function ecartSigne(ecart: number, langue: Langue) {
  return `${ecart > 0 ? "+" : "−"}${nombre(Math.abs(ecart), langue)}`;
}

function texteRecalcul(n: number, langue: Langue) {
  if (n === 0) return "";
  if (langue === "en") return n === 1 ? " 1 workout recalculated." : ` ${n} workouts recalculated.`;
  return n === 1 ? " 1 séance recalculée." : ` ${n} séances recalculées.`;
}
