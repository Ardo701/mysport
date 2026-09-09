"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { dureeEstimeeMin } from "@/convex/lib/programme";
import type { Doc } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { AjoutRapide } from "@/composants/ajout-rapide";
import { AnalyseurRepas } from "@/composants/analyseur-repas";
import { BarreMacro } from "@/composants/jauges";
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
import {
  IconeAppareilPhoto,
  IconeChevronDroite,
  IconeChevronGauche,
  IconeCorbeille,
  IconeEclair,
  IconeHorloge,
  IconePanier,
  IconePlus,
  IconeTexte,
} from "@/composants/icones";
import {
  ajouterJours,
  aujourdhuiISO,
  heureCourante,
  libelleRelatif,
} from "@/lib/dates";
import { effortDuJour } from "@/lib/effort";
import { libelleTypeRepas } from "@/lib/repas";

const TYPES_PROGRAMMES = ["petit_dejeuner", "collation", "diner"] as const;

export default function PageRepas() {
  const [date, setDate] = useState<string | null>(null);
  useEffect(() => setDate(aujourdhuiISO()), []);

  const profil = useQuery(api.profils.monProfil);
  const menu = useQuery(api.repas.menuDuJour, date ? { date } : "skip");
  const journal = useQuery(api.repas.journalDuJour, date ? { date } : "skip");
  const pas = useQuery(api.pas.pasDuJour, date ? { date } : "skip");
  const seance = useQuery(api.seances.seanceDuJour, date ? { date } : "skip");
  const enregistrer = useMutation(api.repas.enregistrerRepas);
  const supprimer = useMutation(api.repas.supprimerRepas);
  const reinitialiserMenu = useMutation(api.repas.reinitialiserMenu);
  const genererMenu = useAction(api.ia.genererMenu);

  const [analyseurOuvert, setAnalyseurOuvert] = useState(false);
  const [typeAnalyse, setTypeAnalyse] = useState("dejeuner");
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [generation, setGeneration] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  if (!date || !profil || !menu || journal === undefined) return <Chargement />;

  const totaux = journal.reduce(
    (acc, r) => ({
      kcal: acc.kcal + r.kcal,
      proteines: acc.proteines + r.proteines,
      glucides: acc.glucides + r.glucides,
      lipides: acc.lipides + r.lipides,
    }),
    { kcal: 0, proteines: 0, glucides: 0, lipides: 0 },
  );

  // Même cible que sur le tableau de bord : la marche du jour la fait bouger.
  const effort = effortDuJour(
    profil,
    pas?.pas ?? null,
    seance?.log?.statut === "terminee"
      ? (seance.log.dureeMin ??
        (seance.seance ? dureeEstimeeMin(seance.seance, seance.dosage) : null))
      : null,
  );
  const restantes = Math.max(0, effort.kcalCible - totaux.kcal);
  const extras = journal.filter((r) => r.type === "extra");

  async function regenerer() {
    if (!date) return;
    setErreur(null);
    setGeneration(true);
    try {
      await genererMenu({ dates: [date] });
    } catch {
      setErreur(
        "La génération a échoué. Vérifie que la clé OpenAI est configurée côté Convex.",
      );
    }
    setGeneration(false);
  }

  function ouvrirAnalyseur(type: string) {
    setTypeAnalyse(type);
    setAnalyseurOuvert(true);
  }

  return (
    <div className="space-y-8">
      {/* Navigation par jour */}
      <header className="flex items-center justify-between pt-2 lg:pt-0">
        <button
          onClick={() => setDate(ajouterJours(date, -1))}
          aria-label="Jour précédent"
          className="rounded-doux border border-trait bg-creux p-2 text-brume transition-colors hover:text-encre"
        >
          <IconeChevronGauche className="h-4 w-4" />
        </button>
        <div className="text-center lg:order-first lg:mr-auto lg:text-left">
          <p className="surtitre mb-1.5">Journal alimentaire</p>
          <h1 className="titre text-[20px] font-bold leading-none lg:text-[34px]">
            {libelleRelatif(date)}
          </h1>
        </div>
        <button
          onClick={() => setDate(ajouterJours(date, 1))}
          aria-label="Jour suivant"
          disabled={date >= aujourdhuiISO()}
          className="rounded-doux border border-trait bg-creux p-2 text-brume transition-colors hover:text-encre disabled:opacity-30"
        >
          <IconeChevronDroite className="h-4 w-4" />
        </button>
      </header>

      <Colonnes>
        <Colonne>
          {/* Bilan du jour */}
          <Carte>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="surtitre mb-2">Consommé</p>
                <p className="chiffres titre text-[30px] font-bold leading-none">
                  {Math.round(totaux.kcal)}
                  <span className="ml-1.5 text-[13px] font-normal text-brume-faible">
                    / {effort.kcalCible} kcal
                  </span>
                </p>
              </div>
              <Etiquette ton={restantes > 0 ? "jaune" : "rouge"}>
                {restantes > 0 ? `${restantes} restantes` : "Cible atteinte"}
              </Etiquette>
            </div>
            <div className="space-y-3">
              <BarreMacro
                libelle="Protéines"
                valeur={totaux.proteines}
                cible={profil.proteinesCible}
              />
              <BarreMacro
                libelle="Glucides"
                valeur={totaux.glucides}
                cible={profil.glucidesCible}
                couleur="var(--color-brume)"
              />
              <BarreMacro
                libelle="Lipides"
                valeur={totaux.lipides}
                cible={profil.lipidesCible}
                couleur="var(--color-brume)"
              />
            </div>
          </Carte>

          {/* Le déjeuner : photo ou description */}
          <section>
            <TitreSection titre="Repas libre" />
            <Carte className="border-l-2 border-l-jaune py-1 pl-4">
              <p className="text-[13px] leading-relaxed text-brume">
                Tu ne suis pas de menu à midi. Prends une photo de ton assiette, ou
                décris-la en une phrase : l'IA estime les calories et les macros, et le
                reste de la journée s'ajuste autour.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Bouton onClick={() => ouvrirAnalyseur("dejeuner")}>
                  <IconeAppareilPhoto className="h-4 w-4" />
                  Photo
                </Bouton>
                <Bouton variante="secondaire" onClick={() => ouvrirAnalyseur("dejeuner")}>
                  <IconeTexte className="h-4 w-4" />
                  Décrire
                </Bouton>
              </div>
            </Carte>
          </section>

          {/* Grignotage et boissons */}
          <section>
            <TitreSection
              titre="Grignotage et boissons"
              action={
                <span className="chiffres text-[12px] text-brume-faible">
                  {extras.reduce((s, r) => s + r.kcal, 0)} kcal
                </span>
              }
            />
            <button
              onClick={() => setAjoutOuvert(true)}
              className="flex w-full items-center gap-3.5 border-t border-trait px-4 py-4 text-left transition-colors hover:border-trait-vif"
            >
              <IconePlus className="h-4 w-4 shrink-0 text-jaune" />
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium">
                  Ajouter ce que tu as pris à côté
                </span>
                <span className="mt-0.5 block text-[12px] leading-snug text-brume-faible">
                  Café, soda, bière, chips, chocolat… tout ce qui n'est pas de l'eau
                  compte dans la journée.
                </span>
              </span>
            </button>
          </section>
        </Colonne>

        <Colonne>
          {/* Menu programmé */}
          <section>
            <TitreSection
              titre="Matin, collation, soir"
              action={
                <span className="flex items-center gap-3">
                  {menu.source === "ia" && <Etiquette ton="jaune">IA</Etiquette>}
                  <button
                    onClick={regenerer}
                    disabled={generation}
                    className="flex items-center gap-1.5 text-[12px] text-brume transition-colors hover:text-jaune disabled:opacity-50"
                  >
                    <IconeEclair className="h-3.5 w-3.5" />
                    {generation ? "Génération…" : "Régénérer"}
                  </button>
                </span>
              }
            />

            {erreur && <div className="mb-3"><Message ton="erreur">{erreur}</Message></div>}

            <div className="space-y-3">
              {TYPES_PROGRAMMES.map((type) => {
                const plat = menu.repas.find((r) => r.type === type);
                const dejaMange = journal.some((r) => r.type === type);
                if (!plat) return null;
                return (
                  <CartePlat
                    key={type}
                    plat={plat}
                    dejaMange={dejaMange}
                    onManger={async () => {
                      await enregistrer({
                        date,
                        type,
                        source: "menu",
                        nom: plat.nom,
                        kcal: plat.kcal,
                        proteines: plat.proteines,
                        glucides: plat.glucides,
                        lipides: plat.lipides,
                        heure: heureCourante(),
                      });
                    }}
                    onAutre={() => ouvrirAnalyseur(type)}
                  />
                );
              })}
            </div>

            {menu.source === "ia" && (
              <button
                onClick={() => reinitialiserMenu({ date })}
                className="mt-3 text-[12px] text-brume-faible transition-colors hover:text-encre"
              >
                Revenir au menu par défaut
              </button>
            )}
          </section>

          {/* Journal */}
          <section>
            <TitreSection titre="Journal du jour" />
            {journal.length === 0 ? (
              <p className="border border-dashed border-trait px-4 py-7 text-center text-[13px] text-brume-faible">
                Rien d'enregistré pour l'instant.
              </p>
            ) : (
              <ul className="space-y-2">
                {journal
                  .slice()
                  .sort((a, b) => a.heure.localeCompare(b.heure))
                  .map((ligne) => (
                    <LigneJournal
                      key={ligne._id}
                      ligne={ligne}
                      onSupprimer={() => supprimer({ id: ligne._id })}
                    />
                  ))}
              </ul>
            )}
          </section>

          {/* Liste de courses */}
          <Link href="/courses" className="block">
            <div className="flex items-center gap-3.5 border-t border-trait px-4 py-3.5 transition-colors hover:border-trait-vif">
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium">Liste de courses</span>
                <span className="mt-0.5 block text-[12px] text-brume-faible">
                  Construite depuis tes menus, avec les dates d'achat
                </span>
              </span>
              <IconeChevronDroite className="h-4 w-4 shrink-0 text-brume-faible" />
            </div>
          </Link>
        </Colonne>
      </Colonnes>

      <AjoutRapide
        ouvert={ajoutOuvert}
        onFermer={() => setAjoutOuvert(false)}
        date={date}
        onDecrire={() => ouvrirAnalyseur("extra")}
      />

      <AnalyseurRepas
        ouvert={analyseurOuvert}
        onFermer={() => setAnalyseurOuvert(false)}
        date={date}
        typeParDefaut={typeAnalyse}
      />
    </div>
  );
}

function CartePlat({
  plat,
  dejaMange,
  onManger,
  onAutre,
}: {
  plat: Doc<"menus">["repas"][number];
  dejaMange: boolean;
  onManger: () => Promise<void>;
  onAutre: () => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);

  return (
    <Carte className={dejaMange ? "!border-jaune/30" : undefined}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="surtitre mb-2">{libelleTypeRepas(plat.type)}</p>
          <h3 className="titre text-[16px] font-semibold leading-tight">
            {plat.nom}
          </h3>
          <div className="chiffres mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-brume">
            <span className="flex items-center gap-1">
              <IconeHorloge className="h-3.5 w-3.5" />
              {plat.tempsMin} min
            </span>
            <span>{plat.kcal} kcal</span>
            <span>{plat.proteines} g de protéines</span>
          </div>
        </div>
        {dejaMange && <Etiquette ton="jaune">Mangé</Etiquette>}
      </div>

      <button
        onClick={() => setOuvert((v) => !v)}
        className="mt-3 text-[12px] text-brume-faible transition-colors hover:text-encre"
      >
        {ouvert ? "Masquer la recette" : "Voir la recette"}
      </button>

      {ouvert && (
        <div className="apparition mt-3 space-y-4 rounded-doux border border-trait bg-creux p-3.5">
          <div>
            <p className="surtitre mb-2.5">Ingrédients</p>
            <ul className="space-y-1.5">
              {plat.ingredients.map((ing, i) => (
                <li
                  key={i}
                  className="flex justify-between gap-3 text-[13px] text-brume"
                >
                  <span>{ing.nom}</span>
                  <span className="chiffres shrink-0 text-brume-faible">
                    {ing.quantite}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-trait pt-3">
            <p className="surtitre mb-2.5">Préparation</p>
            <ol className="space-y-2">
              {plat.etapes.map((e, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-brume">
                  <span className="chiffres text-jaune">{i + 1}.</span>
                  {e}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {!dejaMange && (
        <div className="mt-4 flex gap-2">
          <Bouton
            className="flex-1"
            disabled={enCours}
            onClick={async () => {
              setEnCours(true);
              await onManger();
              setEnCours(false);
            }}
          >
            J'ai mangé ça
          </Bouton>
          <Bouton variante="secondaire" onClick={onAutre}>
            Autre chose
          </Bouton>
        </div>
      )}
    </Carte>
  );
}

function LigneJournal({
  ligne,
  onSupprimer,
}: {
  ligne: Doc<"repasLog">;
  onSupprimer: () => void;
}) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <li className="overflow-hidden border-t border-trait">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setOuvert((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-baseline gap-2">
            <span className="chiffres text-[11px] text-brume-faible">
              {ligne.heure}
            </span>
            <span className="surtitre !text-brume-faible">
              {libelleTypeRepas(ligne.type)}
            </span>
            {ligne.source === "photo" && (
              <IconeAppareilPhoto className="h-3.5 w-3.5 text-jaune" />
            )}
          </div>
          <p className="mt-1 truncate text-[14px]">{ligne.nom}</p>
        </button>
        <span className="chiffres shrink-0 text-[14px] font-medium">
          {ligne.kcal}
        </span>
        <button
          onClick={onSupprimer}
          aria-label="Supprimer ce repas"
          className="shrink-0 p-1 text-brume-faible transition-colors hover:text-rouge"
        >
          <IconeCorbeille className="h-4 w-4" />
        </button>
      </div>

      {ouvert && (
        <div className="apparition space-y-3 border-t border-trait bg-creux px-4 py-3.5">
          {ligne.photoId && <PhotoRepas photoId={ligne.photoId} nom={ligne.nom} />}
          <div className="chiffres flex gap-4 text-[12px] text-brume">
            <span>{ligne.proteines} g prot.</span>
            <span>{ligne.glucides} g gluc.</span>
            <span>{ligne.lipides} g lip.</span>
          </div>
          {ligne.detail && ligne.detail.length > 0 && (
            <ul className="space-y-1">
              {ligne.detail.map((d, i) => (
                <li
                  key={i}
                  className="flex justify-between gap-3 text-[12px] text-brume-faible"
                >
                  <span>
                    {d.aliment}{" "}
                    <span className="text-brume-faible/70">({d.quantiteEstimee})</span>
                  </span>
                  <span className="chiffres shrink-0">{d.kcal} kcal</span>
                </li>
              ))}
            </ul>
          )}
          {ligne.commentaireIA && (
            <p className="border-t border-trait pt-3 text-[12px] leading-relaxed text-brume">
              {ligne.commentaireIA}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

/** Photo enregistrée avec le repas, servie par le stockage Convex. */
function PhotoRepas({
  photoId,
  nom,
}: {
  photoId: NonNullable<Doc<"repasLog">["photoId"]>;
  nom: string;
}) {
  const url = useQuery(api.repas.urlPhoto, { photoId });
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={nom}
      className="max-h-48 w-full rounded-doux border border-trait object-cover"
    />
  );
}
