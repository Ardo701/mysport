"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  Bouton,
  Carte,
  Chargement,
  Etiquette,
  EtatVide,
  TitreSection,
} from "@/composants/ui";
import { Jauge } from "@/composants/jauges";
import {
  IconeChevronGauche,
  IconeCoche,
  IconeCorbeille,
  IconePlus,
} from "@/composants/icones";
import {
  ajouterJours,
  aujourdhuiISO,
  libelleDateCourt,
  libelleRelatif,
} from "@/lib/dates";

const ORDRE_RAYONS = [
  "Fruits et légumes",
  "Boucherie et poissonnerie",
  "Crèmerie",
  "Épicerie",
  "Boissons",
  "Autres",
];

/** Regroupement par urgence, à partir de la date d'achat conseillée. */
function urgence(ligne: Doc<"courses">, aujourdhui: string) {
  if (ligne.dateAchatConseillee <= aujourdhui) return 0;
  if (ligne.dateAchatConseillee <= ajouterJours(aujourdhui, 1)) return 1;
  if (ligne.dateAchatConseillee <= ajouterJours(aujourdhui, 3)) return 2;
  return 3;
}

const LIBELLES_URGENCE = [
  { titre: "À acheter maintenant", detail: "Nécessaire pour les repas qui arrivent." },
  { titre: "Demain", detail: "Tu peux attendre un jour de plus." },
  { titre: "Dans les trois jours", detail: "Pas urgent, mais à ne pas oublier." },
  { titre: "Plus tard", detail: "Pour la fin de la période." },
];

export default function PageCourses() {
  const [date, setDate] = useState<string | null>(null);
  const [jours, setJours] = useState(7);
  const [pret, setPret] = useState(false);

  const lignes = useQuery(api.courses.maListe);
  const regenerer = useMutation(api.courses.regenerer);
  const basculer = useMutation(api.courses.basculerAchat);
  const supprimer = useMutation(api.courses.supprimerLigne);
  const decocherTout = useMutation(api.courses.decocherTout);
  const ajouterLigne = useMutation(api.courses.ajouterLigne);

  const [nom, setNom] = useState("");
  const [quantite, setQuantite] = useState("");
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);

  useEffect(() => setDate(aujourdhuiISO()), []);

  // La liste se reconstruit à chaque ouverture : les menus à venir font foi.
  useEffect(() => {
    if (!date) return;
    let annule = false;
    setPret(false);
    regenerer({ depuis: date, jours }).finally(() => {
      if (!annule) setPret(true);
    });
    return () => {
      annule = true;
    };
  }, [date, jours, regenerer]);

  if (!date || lignes === undefined || !pret) return <Chargement texte="Mise à jour de la liste" />;

  const aAcheter = lignes.filter((l) => !l.achete);
  const achetes = lignes.filter((l) => l.achete);
  const progression =
    lignes.length > 0 ? (achetes.length / lignes.length) * 100 : 0;

  const groupes = LIBELLES_URGENCE.map((libelle, niveau) => ({
    ...libelle,
    niveau,
    lignes: aAcheter
      .filter((l) => urgence(l, date) === niveau)
      .sort(
        (a, b) =>
          ORDRE_RAYONS.indexOf(a.rayon) - ORDRE_RAYONS.indexOf(b.rayon) ||
          a.nom.localeCompare(b.nom),
      ),
  })).filter((g) => g.lignes.length > 0);

  return (
    <div className="space-y-5">
      <header className="pt-2 lg:pt-0">
        <Link
          href="/repas"
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-brume transition hover:text-encre lg:hidden"
        >
          <IconeChevronGauche className="h-4 w-4" />
          Repas
        </Link>
        <p className="surtitre mb-2.5">D'après tes menus à venir</p>
        <h1 className="titre text-[28px] font-bold leading-none lg:text-[34px]">
          Liste de courses
        </h1>
      </header>

      {/* Les réglages restent sous les yeux pendant qu'on coche la liste. */}
      <div className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-5 lg:sticky lg:top-9">
          {/* Période et avancement */}
          <Carte>
            <div className="mb-4 flex gap-1 rounded-lg border border-trait bg-creux p-1">
              {[3, 7, 14].map((n) => (
                <button
                  key={n}
                  onClick={() => setJours(n)}
                  className={`flex-1 rounded-md py-2.5 text-[13px] font-medium transition ${
                    jours === n ? "bg-jaune-vif text-sur-jaune" : "text-brume"
                  }`}
                >
                  {n} jours
                </button>
              ))}
            </div>

            <div className="mb-2 flex items-baseline justify-between">
              <span className="surtitre">Avancement</span>
              <span className="chiffres text-[12px] text-brume">
                {achetes.length} / {lignes.length} achetés
              </span>
            </div>
            <Jauge pourcent={progression} />
            <p className="mt-3 text-[12px] leading-relaxed text-brume-faible">
              Du {libelleDateCourt(date)} au {libelleDateCourt(ajouterJours(date, jours - 1))}.
              Le déjeuner n'y figure pas : c'est ton repas libre.
            </p>
          </Carte>

          {/* Ajout manuel */}
          {formulaireOuvert ? (
            <Carte className="apparition">
              <TitreSection surtitre="Ajout" titre="Autre chose à prendre" />
              <div className="space-y-3">
                <input
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Produit (lessive, sac poubelle, café…)"
                  className="champ !font-sans !text-[14px]"
                />
                <input
                  value={quantite}
                  onChange={(e) => setQuantite(e.target.value)}
                  placeholder="Quantité (facultatif)"
                  className="champ !font-sans !text-[14px]"
                />
                <div className="flex gap-2">
                  <Bouton
                    variante="secondaire"
                    onClick={() => {
                      setFormulaireOuvert(false);
                      setNom("");
                      setQuantite("");
                    }}
                  >
                    Annuler
                  </Bouton>
                  <Bouton
                    className="flex-1"
                    disabled={nom.trim() === ""}
                    onClick={async () => {
                      await ajouterLigne({ nom, quantite, dateBesoin: date });
                      setNom("");
                      setQuantite("");
                      setFormulaireOuvert(false);
                    }}
                  >
                    Ajouter
                  </Bouton>
                </div>
              </div>
            </Carte>
          ) : (
            <button
              onClick={() => setFormulaireOuvert(true)}
              className="flex w-full items-center gap-3 rounded-net border border-dashed border-trait bg-surface px-4 py-3.5 text-left transition hover:border-jaune"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-trait text-brume-faible">
                <IconePlus className="h-4 w-4" />
              </span>
              <span className="text-[14px] text-brume">
                Ajouter un produit à la main
              </span>
            </button>
          )}
        </div>

        <div className="space-y-5">
          {/* Ce qu'il reste à acheter */}
          {aAcheter.length === 0 ? (
            <EtatVide
              titre="Tout est coché"
              detail="Rien à acheter pour la période choisie. La liste se remplira à nouveau quand de nouveaux menus arriveront."
            />
          ) : (
            groupes.map((groupe) => (
              <section key={groupe.niveau}>
                <TitreSection
                  surtitre={`${groupe.lignes.length} produit${groupe.lignes.length > 1 ? "s" : ""}`}
                  titre={groupe.titre}
                  action={
                    groupe.niveau === 0 ? <Etiquette ton="jaune">Priorité</Etiquette> : null
                  }
                />
                <p className="mb-3 -mt-1 text-[12px] text-brume-faible">
                  {groupe.detail}
                </p>
                <ul className="divide-y divide-trait overflow-hidden rounded-net border border-trait">
                  {groupe.lignes.map((ligne) => (
                    <LigneCourse
                      key={ligne._id}
                      ligne={ligne}
                      onBasculer={() => basculer({ id: ligne._id, date })}
                      onSupprimer={
                        ligne.source === "manuel"
                          ? () => supprimer({ id: ligne._id })
                          : undefined
                      }
                    />
                  ))}
                </ul>
              </section>
            ))
          )}

          {/* Déjà acheté */}
          {achetes.length > 0 && (
            <section>
              <TitreSection
                surtitre={`${achetes.length} produit${achetes.length > 1 ? "s" : ""}`}
                titre="Déjà acheté"
                action={
                  <button
                    onClick={() => decocherTout({})}
                    className="text-[12px] text-brume transition hover:text-jaune"
                  >
                    Tout décocher
                  </button>
                }
              />
              <ul className="divide-y divide-trait overflow-hidden rounded-net border border-trait opacity-60">
                {achetes
                  .sort((a, b) => a.nom.localeCompare(b.nom))
                  .map((ligne) => (
                    <LigneCourse
                      key={ligne._id}
                      ligne={ligne}
                      onBasculer={() => basculer({ id: ligne._id, date })}
                      onSupprimer={
                        ligne.source === "manuel"
                          ? () => supprimer({ id: ligne._id })
                          : undefined
                      }
                    />
                  ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function LigneCourse({
  ligne,
  onBasculer,
  onSupprimer,
}: {
  ligne: Doc<"courses">;
  onBasculer: () => void;
  onSupprimer?: () => void;
}) {
  return (
    <li className="flex items-center gap-3 bg-surface px-3.5 py-3">
      <button
        onClick={onBasculer}
        aria-pressed={ligne.achete}
        aria-label={ligne.achete ? `Décocher ${ligne.nom}` : `Marquer ${ligne.nom} comme acheté`}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition ${
          ligne.achete
            ? "border-jaune bg-jaune-vif text-sur-jaune"
            : "border-trait text-transparent hover:border-jaune"
        }`}
      >
        <IconeCoche className="h-4 w-4" />
      </button>

      <button onClick={onBasculer} className="min-w-0 flex-1 text-left">
        <p
          className={`truncate text-[14px] ${ligne.achete ? "text-brume-faible line-through" : ""}`}
        >
          {ligne.nom}
        </p>
        <p className="chiffres mt-0.5 text-[11px] text-brume-faible">
          {ligne.quantite} · {ligne.rayon.toLowerCase()} · pour{" "}
          {libelleRelatif(ligne.dateBesoin).toLowerCase()}
        </p>
      </button>

      {onSupprimer && (
        <button
          onClick={onSupprimer}
          aria-label={`Supprimer ${ligne.nom}`}
          className="shrink-0 p-1 text-brume-faible transition hover:text-rouge"
        >
          <IconeCorbeille className="h-4 w-4" />
        </button>
      )}
    </li>
  );
}
