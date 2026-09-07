"use client";

import { useAction, useMutation } from "convex/react";
import { useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Bouton, Etiquette, Message } from "./ui";
import { Feuille } from "./feuille";
import { IconeAppareilPhoto, IconeEclair, IconeTexte } from "./icones";
import { heureCourante } from "@/lib/dates";
import { TYPES_REPAS, libelleTypeRepas } from "@/lib/repas";

type Analyse = {
  nom: string;
  aliments: {
    aliment: string;
    quantiteEstimee: string;
    kcal: number;
    proteines: number;
    glucides: number;
    lipides: number;
  }[];
  total: { kcal: number; proteines: number; glucides: number; lipides: number };
  confiance: string;
  commentaire: string;
};

/**
 * Estimation d'un repas non programmé : par photo, ou par description écrite
 * quand la photo n'est pas possible.
 */
export function AnalyseurRepas({
  ouvert,
  onFermer,
  date,
  typeParDefaut = "dejeuner",
}: {
  ouvert: boolean;
  onFermer: () => void;
  date: string;
  typeParDefaut?: string;
}) {
  const urlDEnvoi = useMutation(api.fichiers.urlDEnvoi);
  const analyserPhoto = useAction(api.ia.analyserPhotoRepas);
  const analyserTexte = useAction(api.ia.analyserTexteRepas);
  const enregistrer = useMutation(api.repas.enregistrerRepas);

  const [onglet, setOnglet] = useState<"photo" | "texte">("photo");
  const [type, setType] = useState(typeParDefaut);
  const [apercu, setApercu] = useState<string | null>(null);
  const [photoId, setPhotoId] = useState<Id<"_storage"> | null>(null);
  const [precision, setPrecision] = useState("");
  const [description, setDescription] = useState("");
  const [analyse, setAnalyse] = useState<Analyse | null>(null);
  const [etat, setEtat] = useState<"repos" | "envoi" | "analyse" | "enregistrement">(
    "repos",
  );
  const [erreur, setErreur] = useState<string | null>(null);
  const champFichier = useRef<HTMLInputElement>(null);

  function reinitialiser() {
    setApercu(null);
    setPhotoId(null);
    setPrecision("");
    setDescription("");
    setAnalyse(null);
    setErreur(null);
    setEtat("repos");
  }

  function fermer() {
    reinitialiser();
    onFermer();
  }

  async function surFichier(fichier: File) {
    setErreur(null);
    setAnalyse(null);
    setApercu(URL.createObjectURL(fichier));
    setEtat("envoi");
    try {
      const url = await urlDEnvoi({});
      const reponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": fichier.type },
        body: fichier,
      });
      if (!reponse.ok) throw new Error("Envoi impossible");
      const { storageId } = (await reponse.json()) as { storageId: Id<"_storage"> };
      setPhotoId(storageId);
      setEtat("repos");
    } catch {
      setErreur("L'envoi de la photo a échoué. Vérifie ta connexion.");
      setEtat("repos");
    }
  }

  async function lancerAnalyse() {
    setErreur(null);
    setEtat("analyse");
    try {
      const resultat =
        onglet === "photo"
          ? await analyserPhoto({
              photoId: photoId!,
              contexte: precision.trim() || undefined,
            })
          : await analyserTexte({ description });
      setAnalyse(resultat as Analyse);
      setEtat("repos");
    } catch (e) {
      setErreur(
        e instanceof Error && e.message.includes("OPENAI_API_KEY")
          ? "La clé OpenAI n'est pas configurée sur le serveur."
          : "L'analyse a échoué. Réessaie, ou décris ton repas à l'écrit.",
      );
      setEtat("repos");
    }
  }

  async function confirmer() {
    if (!analyse) return;
    setEtat("enregistrement");
    try {
      await enregistrer({
        date,
        type,
        source: onglet === "photo" ? "photo" : "manuel",
        nom: analyse.nom,
        kcal: Math.round(analyse.total.kcal),
        proteines: Math.round(analyse.total.proteines),
        glucides: Math.round(analyse.total.glucides),
        lipides: Math.round(analyse.total.lipides),
        heure: heureCourante(),
        photoId: onglet === "photo" && photoId ? photoId : undefined,
        detail: analyse.aliments.map((a) => ({
          aliment: a.aliment,
          quantiteEstimee: a.quantiteEstimee,
          kcal: Math.round(a.kcal),
          proteines: Math.round(a.proteines),
          glucides: Math.round(a.glucides),
          lipides: Math.round(a.lipides),
        })),
        commentaireIA: analyse.commentaire,
        confiance: analyse.confiance,
      });
      fermer();
    } catch {
      setErreur("Enregistrement impossible. Réessaie.");
      setEtat("repos");
    }
  }

  const peutAnalyser =
    onglet === "photo" ? photoId !== null : description.trim().length > 3;

  return (
    <Feuille
      ouverte={ouvert}
      onFermer={fermer}
      surtitre="Estimation par IA"
      titre={analyse ? analyse.nom : "Qu'est-ce que tu as mangé ?"}
    >
      {!analyse && (
        <div className="space-y-5">
          <div className="flex gap-1 rounded-lg border border-trait bg-ardoise p-1">
            {(
              [
                ["photo", "Photo", IconeAppareilPhoto],
                ["texte", "Décrire", IconeTexte],
              ] as const
            ).map(([cle, libelle, Icone]) => (
              <button
                key={cle}
                onClick={() => {
                  setOnglet(cle);
                  setErreur(null);
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-[13px] font-medium transition ${
                  onglet === cle ? "bg-jaune text-noir" : "text-brume"
                }`}
              >
                <Icone className="h-4 w-4" />
                {libelle}
              </button>
            ))}
          </div>

          <div>
            <span className="surtitre mb-2 block">Quel repas ?</span>
            <div className="grid grid-cols-5 gap-1.5">
              {TYPES_REPAS.map((t) => (
                <button
                  key={t.cle}
                  onClick={() => setType(t.cle)}
                  className={`rounded-lg border px-1 py-2.5 text-[11px] leading-tight transition ${
                    type === t.cle
                      ? "border-jaune bg-jaune-voile text-craie"
                      : "border-trait bg-ardoise text-brume-sombre"
                  }`}
                >
                  {t.court}
                </button>
              ))}
            </div>
          </div>

          {onglet === "photo" ? (
            <div className="space-y-3">
              <input
                ref={champFichier}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) surFichier(f);
                }}
              />
              <button
                onClick={() => champFichier.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-3 rounded-net border border-dashed border-trait bg-ardoise px-4 py-10 transition hover:border-jaune"
              >
                {apercu ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={apercu}
                    alt="Aperçu du repas"
                    className="max-h-56 w-full rounded-lg object-cover"
                  />
                ) : (
                  <>
                    <IconeAppareilPhoto className="h-8 w-8 text-jaune" />
                    <span className="text-[14px] font-medium">
                      Prendre une photo du repas
                    </span>
                    <span className="text-[12px] text-brume-sombre">
                      Cadre l'assiette entière, de trois quarts si possible
                    </span>
                  </>
                )}
              </button>
              {apercu && (
                <button
                  onClick={() => champFichier.current?.click()}
                  className="text-[12px] text-brume transition hover:text-jaune"
                >
                  Reprendre la photo
                </button>
              )}
              <textarea
                value={precision}
                onChange={(e) => setPrecision(e.target.value)}
                rows={2}
                placeholder="Précision utile (facultatif) : « frites cuites au four », « double portion de riz »…"
                className="champ resize-none !font-sans !text-[14px]"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                autoFocus
                placeholder="Ex. : un kebab galette avec frites et sauce blanche, un coca 33 cl et deux carrés de chocolat."
                className="champ resize-none !font-sans !text-[14px]"
              />
              <p className="text-[11px] leading-relaxed text-brume-sombre">
                Donne les quantités si tu les connais (grammes, nombre de parts,
                taille du plat) : l'estimation sera bien plus juste.
              </p>
            </div>
          )}

          {etat === "envoi" && <Message>Envoi de la photo…</Message>}
          {erreur && <Message ton="erreur">{erreur}</Message>}

          <Bouton
            taille="large"
            disabled={!peutAnalyser || etat !== "repos"}
            onClick={lancerAnalyse}
          >
            <IconeEclair className="h-4 w-4" />
            {etat === "analyse" ? "L'IA analyse…" : "Analyser"}
          </Bouton>
        </div>
      )}

      {analyse && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Etiquette ton="jaune">{libelleTypeRepas(type)}</Etiquette>
            <Etiquette
              ton={
                analyse.confiance === "haute"
                  ? "vert"
                  : analyse.confiance === "basse"
                    ? "rouge"
                    : "neutre"
              }
            >
              Confiance {analyse.confiance}
            </Etiquette>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              ["kcal", Math.round(analyse.total.kcal), ""],
              ["Prot.", Math.round(analyse.total.proteines), "g"],
              ["Gluc.", Math.round(analyse.total.glucides), "g"],
              ["Lip.", Math.round(analyse.total.lipides), "g"],
            ].map(([libelle, valeur, unite]) => (
              <div
                key={libelle as string}
                className="rounded-lg border border-trait bg-ardoise px-2 py-3 text-center"
              >
                <p className="chiffres titre text-[19px] font-semibold leading-none">
                  {valeur}
                  {unite}
                </p>
                <p className="mt-1.5 text-[10px] uppercase tracking-wider text-brume-sombre">
                  {libelle}
                </p>
              </div>
            ))}
          </div>

          <div>
            <p className="surtitre mb-2.5">Ce que l'IA a reconnu</p>
            <ul className="divide-y divide-trait overflow-hidden rounded-net border border-trait">
              {analyse.aliments.map((a, i) => (
                <li
                  key={i}
                  className="flex items-baseline justify-between gap-3 bg-ardoise px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px]">{a.aliment}</p>
                    <p className="text-[11px] text-brume-sombre">
                      {a.quantiteEstimee}
                    </p>
                  </div>
                  <span className="chiffres shrink-0 text-[13px] text-brume">
                    {Math.round(a.kcal)} kcal
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {analyse.commentaire && (
            <Message>{analyse.commentaire}</Message>
          )}

          {erreur && <Message ton="erreur">{erreur}</Message>}

          <div className="flex gap-2">
            <Bouton variante="secondaire" onClick={reinitialiser}>
              Refaire
            </Bouton>
            <Bouton
              className="flex-1"
              disabled={etat === "enregistrement"}
              onClick={confirmer}
            >
              {etat === "enregistrement" ? "Enregistrement…" : "Ajouter au journal"}
            </Bouton>
          </div>
          <p className="text-[11px] leading-relaxed text-brume-sombre">
            Une estimation reste une estimation. Elle suffit largement pour piloter
            une semaine, pas pour compter au gramme près.
          </p>
        </div>
      )}
    </Feuille>
  );
}
