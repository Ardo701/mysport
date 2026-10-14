"use client";

import { useEffect, useMemo, useState } from "react";
import { Feuille } from "./feuille";
import { IconeCoche } from "./icones";
import { Bouton } from "./ui";
import {
  EXERCICES,
  GROUPES,
  ID_PERSO,
  type Groupe,
  type Mesure,
} from "@/convex/data/exercices";

export type ExerciceChoisi = { exerciceId: string; nom: string; mesure: Mesure };

const LIBELLE_MESURE: Record<Mesure, string> = {
  series: "séries",
  maintien: "en secondes",
  duree: "durée",
};

/** Sans accents ni majuscules : « developpe » doit trouver « Développé ». */
function normaliser(texte: string) {
  return texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/**
 * Choix des exercices d'une séance.
 *
 * On coche plusieurs exercices d'un coup avant de valider : une séance de
 * salle en compte cinq ou six, et rouvrir la liste pour chacun serait le
 * geste le plus répété de toute l'application.
 */
export function ChoixExercices({
  ouverte,
  onFermer,
  onAjouter,
}: {
  ouverte: boolean;
  onFermer: () => void;
  onAjouter: (exercices: ExerciceChoisi[]) => void;
}) {
  const [recherche, setRecherche] = useState("");
  const [groupe, setGroupe] = useState<Groupe | null>(null);
  const [selection, setSelection] = useState<ExerciceChoisi[]>([]);

  useEffect(() => {
    if (!ouverte) return;
    setRecherche("");
    setGroupe(null);
    setSelection([]);
  }, [ouverte]);

  const trouves = useMemo(() => {
    const mots = normaliser(recherche).split(/\s+/).filter(Boolean);
    return EXERCICES.filter(
      (e) =>
        (groupe === null || e.groupe === groupe) &&
        mots.every((m) => normaliser(e.nom).includes(m)),
    );
  }, [recherche, groupe]);

  // Regroupés dans l'ordre du catalogue, pour qu'on parcoure la liste comme
  // on parcourt une salle : les pectoraux ensemble, le cardio ensemble.
  const parGroupe = GROUPES.map((g) => ({
    groupe: g,
    exercices: trouves.filter((e) => e.groupe === g),
  })).filter((g) => g.exercices.length > 0);

  const choisi = (id: string, nom: string) =>
    selection.some((s) => s.exerciceId === id && s.nom === nom);

  function basculer(e: ExerciceChoisi) {
    setSelection((s) =>
      choisi(e.exerciceId, e.nom)
        ? s.filter((x) => !(x.exerciceId === e.exerciceId && x.nom === e.nom))
        : [...s, e],
    );
  }

  const nomLibre = recherche.trim();

  return (
    <Feuille ouverte={ouverte} onFermer={onFermer} titre="Ajouter des exercices">
      <input
        type="search"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder="Rechercher : squat, course, pompes…"
        className="champ !font-sans"
        aria-label="Rechercher un exercice"
      />

      <div className="-mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5 pb-1">
        {[null, ...GROUPES].map((g) => (
          <button
            key={g ?? "tous"}
            type="button"
            onClick={() => setGroupe(g)}
            aria-pressed={groupe === g}
            className={`h-9 shrink-0 rounded-doux px-3.5 text-[13px] transition-colors ${
              groupe === g
                ? "bg-accent font-semibold text-sur-accent"
                : "bg-creux font-medium text-brume hover:text-encre"
            }`}
          >
            {g ?? "Tous"}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-6">
        {parGroupe.map(({ groupe: g, exercices }) => (
          <div key={g}>
            <p className="mb-1 text-[13px] font-semibold">{g}</p>
            <ul>
              {exercices.map((e) => {
                const actif = choisi(e.id, e.nom);
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      aria-pressed={actif}
                      onClick={() => basculer({ exerciceId: e.id, nom: e.nom, mesure: e.mesure })}
                      className="flex w-full items-center gap-3 border-t border-trait py-3 text-left"
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition-colors ${
                          actif ? "border-accent bg-accent text-sur-accent" : "border-trait-vif"
                        }`}
                      >
                        {actif && <IconeCoche className="h-3.5 w-3.5" />}
                      </span>
                      <span className={`flex-1 text-[15px] ${actif ? "font-semibold" : ""}`}>
                        {e.nom}
                      </span>
                      <span className="text-[12px] text-brume">
                        {LIBELLE_MESURE[e.mesure]}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {nomLibre && (
          <div className="rounded-boite bg-creux px-4 py-4">
            <p className="text-[13px] text-brume">
              {trouves.length === 0 ? "Rien dans la liste pour " : "Pas tout à fait ça ? Ajoute "}
              <span className="text-encre">« {nomLibre} »</span> tel quel.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["series", "duree"] as const).map((mesure) => (
                <Bouton
                  key={mesure}
                  variante="secondaire"
                  taille="petite"
                  onClick={() => {
                    basculer({ exerciceId: ID_PERSO, nom: nomLibre, mesure });
                    setRecherche("");
                  }}
                >
                  {mesure === "series" ? "En séries" : "En durée"}
                </Bouton>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Un exercice hors liste n'a pas de ligne à cocher : sans ce rappel, on
          ne le verrait plus qu'au compteur du bouton. */}
      {selection.some((s) => s.exerciceId === ID_PERSO) && (
        <div className="mt-6">
          <p className="mb-1 text-[13px] font-semibold">Hors liste</p>
          <ul>
            {selection
              .filter((s) => s.exerciceId === ID_PERSO)
              .map((s) => (
                <li key={`${s.nom}-${s.mesure}`}>
                  <button
                    type="button"
                    aria-pressed
                    onClick={() => basculer(s)}
                    className="flex w-full items-center gap-3 border-t border-trait py-3 text-left"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border-[1.5px] border-accent bg-accent text-sur-accent">
                      <IconeCoche className="h-3.5 w-3.5" />
                    </span>
                    <span className="flex-1 text-[15px] font-semibold">{s.nom}</span>
                    <span className="text-[12px] text-brume">
                      {LIBELLE_MESURE[s.mesure]}
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="sticky -bottom-5 -mx-5 mt-6 border-t border-trait bg-surface px-5 py-4">
        <Bouton
          taille="large"
          disabled={selection.length === 0}
          onClick={() => {
            onAjouter(selection);
            onFermer();
          }}
        >
          {selection.length === 0
            ? "Coche un ou plusieurs exercices"
            : `Ajouter ${selection.length} exercice${selection.length > 1 ? "s" : ""}`}
        </Bouton>
      </div>
    </Feuille>
  );
}
