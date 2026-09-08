"use client";

import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAction, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import {
  Bouton,
  Carte,
  Champ,
  Chargement,
  Colonne,
  Colonnes,
  Etiquette,
  GroupeOptions,
  Message,
  TitreSection,
} from "@/composants/ui";
import {
  IconeCourbe,
  IconeEclair,
  IconeFleche,
  IconeLune,
  IconeReglages,
} from "@/composants/icones";
import { BasculeTheme } from "@/composants/theme";
import { aujourdhuiISO } from "@/lib/dates";

const LEGUMES = [
  "Salade",
  "Carottes",
  "Courgettes",
  "Chou-fleur",
  "Brocoli",
  "Tomates",
  "Concombre",
  "Pommes de terre",
  "Petits pois",
  "Haricots verts",
  "Poivrons",
  "Épinards",
];

const CONTRAINTES = [
  "Repas en 15 min maximum",
  "Conserves autorisées",
  "Sans porc",
  "Sans lactose",
  "Végétarien",
  "Sans poisson",
];

export default function PageProfil() {
  const profil = useQuery(api.profils.monProfil);
  const programme = useQuery(api.programme.programmeActif);
  const enregistrerProfil = useMutation(api.profils.enregistrerProfil);
  const modifierCibles = useMutation(api.profils.modifierCibles);
  const revenirParDefaut = useMutation(api.programme.revenirAuProgrammeParDefaut);
  const genererProgramme = useAction(api.ia.genererProgramme);
  const { signOut } = useAuthActions();
  const router = useRouter();

  const [ouvert, setOuvert] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [generation, setGeneration] = useState(false);
  const [precisions, setPrecisions] = useState("");

  const [form, setForm] = useState({
    prenom: "",
    age: "",
    sexe: "homme",
    tailleCm: "",
    poidsKg: "",
    objectif: "recomposition",
    niveauActivite: "1.5",
    joursParSemaine: "4",
    lieu: "mixte",
    legumesAimes: [] as string[],
    contraintes: [] as string[],
  });
  const [cibles, setCibles] = useState({
    kcalCible: "",
    proteinesCible: "",
    glucidesCible: "",
    lipidesCible: "",
  });

  useEffect(() => {
    if (!profil) return;
    setForm({
      prenom: profil.prenom,
      age: String(profil.age),
      sexe: profil.sexe,
      tailleCm: String(profil.tailleCm),
      poidsKg: String(profil.poidsKg),
      objectif: profil.objectif,
      niveauActivite: String(profil.niveauActivite),
      joursParSemaine: String(profil.joursParSemaine),
      lieu: profil.lieu,
      legumesAimes: profil.legumesAimes,
      contraintes: profil.contraintes,
    });
    setCibles({
      kcalCible: String(profil.kcalCible),
      proteinesCible: String(profil.proteinesCible),
      glucidesCible: String(profil.glucidesCible),
      lipidesCible: String(profil.lipidesCible),
    });
  }, [profil]);

  if (profil === undefined || programme === undefined) return <Chargement />;
  if (profil === null) return <Chargement />;

  function basculer(cle: "legumesAimes" | "contraintes", valeur: string) {
    setForm((f) => ({
      ...f,
      [cle]: f[cle].includes(valeur)
        ? f[cle].filter((v) => v !== valeur)
        : [...f[cle], valeur],
    }));
  }

  async function sauvegarderProfil() {
    setErreur(null);
    await enregistrerProfil({
      prenom: form.prenom.trim() || "Toi",
      age: Number(form.age),
      sexe: form.sexe,
      tailleCm: Number(form.tailleCm),
      poidsKg: Number(form.poidsKg),
      objectif: form.objectif,
      joursParSemaine: Number(form.joursParSemaine),
      lieu: form.lieu,
      niveauActivite: Number(form.niveauActivite),
      legumesAimes: form.legumesAimes,
      contraintes: form.contraintes,
    });
    setMessage("Profil mis à jour. Les cibles ont été recalculées.");
    setOuvert(null);
  }

  async function sauvegarderCibles() {
    await modifierCibles({
      kcalCible: Number(cibles.kcalCible),
      proteinesCible: Number(cibles.proteinesCible),
      glucidesCible: Number(cibles.glucidesCible),
      lipidesCible: Number(cibles.lipidesCible),
    });
    setMessage("Cibles enregistrées.");
    setOuvert(null);
  }

  async function regenererProgramme() {
    setErreur(null);
    setGeneration(true);
    try {
      const nom = await genererProgramme({
        dateISO: aujourdhuiISO(),
        precisions: precisions.trim() || undefined,
      });
      setMessage(`Nouveau programme en place : ${nom}.`);
      setPrecisions("");
      setOuvert(null);
    } catch {
      setErreur(
        "La génération a échoué. Vérifie que la clé OpenAI est bien configurée côté Convex.",
      );
    }
    setGeneration(false);
  }

  return (
    <div className="space-y-8">
      <header className="mb-10 pt-1 lg:mb-12 lg:pt-0">
        <p className="surtitre mb-2.5">Ton compte</p>
        <h1 className="titre text-[30px] font-bold leading-[0.95] tracking-[-0.03em] lg:text-[38px]">
          {profil.prenom}
        </h1>
        {profil.email && (
          <p className="mt-2 text-[13px] text-brume-faible">{profil.email}</p>
        )}
      </header>

      {message && (
        <Message ton="succes" className="lg:max-w-[640px]">
          {message}
        </Message>
      )}
      {erreur && (
        <Message ton="erreur" className="lg:max-w-[640px]">
          {erreur}
        </Message>
      )}

      <Colonnes>
        <Colonne>
          {/* Programme */}
          <Carte>
            <TitreSection
              titre="Ton programme"
              action={
                <Etiquette ton={programme?.source === "ia" ? "jaune" : "neutre"}>
                  {programme?.source === "ia" ? "Généré par l'IA" : "Programme de base"}
                </Etiquette>
              }
            />
            <p className="text-[14px] font-medium">{programme?.nom}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-brume">
              {programme?.description}
            </p>

            {ouvert === "programme" ? (
              <div className="apparition mt-4 space-y-3">
                <textarea
                  value={precisions}
                  onChange={(e) => setPrecisions(e.target.value)}
                  rows={3}
                  placeholder="Ce que tu veux changer : plus de dos, éviter le squat à cause d'un genou, séances plus courtes…"
                  className="champ resize-none !font-sans !text-[14px]"
                />
                <div className="flex gap-2">
                  <Bouton variante="secondaire" onClick={() => setOuvert(null)}>
                    Annuler
                  </Bouton>
                  <Bouton
                    className="flex-1"
                    disabled={generation}
                    onClick={regenererProgramme}
                  >
                    <IconeEclair className="h-4 w-4" />
                    {generation ? "Génération…" : "Générer"}
                  </Bouton>
                </div>
                <p className="text-[11px] leading-relaxed text-brume-faible">
                  Le nouveau programme garde tes créneaux du planning. Chaque exercice
                  conserve une version avec et une version sans machine.
                </p>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                <Bouton taille="petite" onClick={() => setOuvert("programme")}>
                  <IconeEclair className="h-3.5 w-3.5" />
                  Régénérer par l'IA
                </Bouton>
                {programme?.source === "ia" && (
                  <Bouton
                    taille="petite"
                    variante="secondaire"
                    onClick={async () => {
                      await revenirParDefaut({ dateISO: aujourdhuiISO() });
                      setMessage("Retour au programme de base.");
                    }}
                  >
                    Revenir au programme de base
                  </Bouton>
                )}
              </div>
            )}
          </Carte>

          {/* Cibles */}
          <Carte>
            <TitreSection
              titre="Cibles quotidiennes"
              action={
                <button
                  onClick={() => setOuvert(ouvert === "cibles" ? null : "cibles")}
                  className="text-[12px] text-brume transition-colors hover:text-jaune"
                >
                  {ouvert === "cibles" ? "Fermer" : "Ajuster"}
                </button>
              }
            />
            {ouvert === "cibles" ? (
              <div className="apparition space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Champ
                    libelle="Calories"
                    type="number"
                    inputMode="numeric"
                    suffixe="kcal"
                    value={cibles.kcalCible}
                    onChange={(e) => setCibles({ ...cibles, kcalCible: e.target.value })}
                  />
                  <Champ
                    libelle="Protéines"
                    type="number"
                    inputMode="numeric"
                    suffixe="g"
                    value={cibles.proteinesCible}
                    onChange={(e) =>
                      setCibles({ ...cibles, proteinesCible: e.target.value })
                    }
                  />
                  <Champ
                    libelle="Glucides"
                    type="number"
                    inputMode="numeric"
                    suffixe="g"
                    value={cibles.glucidesCible}
                    onChange={(e) =>
                      setCibles({ ...cibles, glucidesCible: e.target.value })
                    }
                  />
                  <Champ
                    libelle="Lipides"
                    type="number"
                    inputMode="numeric"
                    suffixe="g"
                    value={cibles.lipidesCible}
                    onChange={(e) =>
                      setCibles({ ...cibles, lipidesCible: e.target.value })
                    }
                  />
                </div>
                <Bouton taille="large" onClick={sauvegarderCibles}>
                  Enregistrer les cibles
                </Bouton>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {[
                  ["kcal", profil.kcalCible],
                  ["Prot.", `${profil.proteinesCible} g`],
                  ["Gluc.", `${profil.glucidesCible} g`],
                  ["Lip.", `${profil.lipidesCible} g`],
                ].map(([libelle, valeur]) => (
                  <div
                    key={libelle as string}
                    className="rounded-doux border border-trait bg-creux px-2 py-3 text-center"
                  >
                    <p className="chiffres titre text-[16px] font-semibold leading-none">
                      {valeur}
                    </p>
                    <p className="mt-1.5 text-[10px] uppercase tracking-wider text-brume-faible">
                      {libelle}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Carte>
        </Colonne>

        <Colonne>
          <div className="grid grid-cols-2 gap-2 lg:hidden">
            <Link href="/progression" className="block">
              <div className="flex h-full items-center justify-between border-t border-trait px-4 py-3.5 transition-colors hover:border-trait-vif">
                <span className="text-[14px]">Progression</span>
                <IconeCourbe className="h-4.5 w-4.5 text-jaune" />
              </div>
            </Link>
            <Link href="/sommeil" className="block">
              <div className="flex h-full items-center justify-between border-t border-trait px-4 py-3.5 transition-colors hover:border-trait-vif">
                <span className="text-[14px]">Sommeil</span>
                <IconeLune className="h-4.5 w-4.5 text-jaune" />
              </div>
            </Link>
          </div>

          {/* Profil */}
          <Carte>
            <TitreSection
              titre="Profil et objectif"
              action={
                <button
                  onClick={() => setOuvert(ouvert === "profil" ? null : "profil")}
                  className="flex items-center gap-1.5 text-[12px] text-brume transition-colors hover:text-jaune"
                >
                  <IconeReglages className="h-3.5 w-3.5" />
                  {ouvert === "profil" ? "Fermer" : "Modifier"}
                </button>
              }
            />

            {ouvert === "profil" ? (
              <div className="apparition space-y-4">
                <Champ
                  libelle="Prénom"
                  value={form.prenom}
                  onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                  className="!font-sans"
                />
                <div className="grid grid-cols-3 gap-3">
                  <Champ
                    libelle="Âge"
                    type="number"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                  />
                  <Champ
                    libelle="Taille"
                    type="number"
                    value={form.tailleCm}
                    onChange={(e) => setForm({ ...form, tailleCm: e.target.value })}
                  />
                  <Champ
                    libelle="Poids"
                    type="number"
                    step="0.1"
                    value={form.poidsKg}
                    onChange={(e) => setForm({ ...form, poidsKg: e.target.value })}
                  />
                </div>
                <GroupeOptions
                  libelle="Objectif"
                  colonnes={1}
                  valeur={form.objectif}
                  onChange={(v) => setForm({ ...form, objectif: v })}
                  options={[
                    { valeur: "recomposition", libelle: "Perdre du gras et prendre du muscle" },
                    { valeur: "seche", libelle: "Sécher en priorité" },
                    { valeur: "prise_de_masse", libelle: "Prendre de la masse" },
                  ]}
                />
                <GroupeOptions
                  libelle="Activité hors sport"
                  colonnes={3}
                  valeur={form.niveauActivite}
                  onChange={(v) => setForm({ ...form, niveauActivite: v })}
                  options={[
                    { valeur: "1.35", libelle: "Sédentaire" },
                    { valeur: "1.5", libelle: "Modérée" },
                    { valeur: "1.65", libelle: "Active" },
                  ]}
                />
                <GroupeOptions
                  libelle="Séances par semaine"
                  colonnes={3}
                  valeur={form.joursParSemaine}
                  onChange={(v) => setForm({ ...form, joursParSemaine: v })}
                  options={[
                    { valeur: "3", libelle: "3" },
                    { valeur: "4", libelle: "4" },
                    { valeur: "5", libelle: "5" },
                  ]}
                />
                <GroupeOptions
                  libelle="Lieu principal"
                  colonnes={3}
                  valeur={form.lieu}
                  onChange={(v) => setForm({ ...form, lieu: v })}
                  options={[
                    { valeur: "mixte", libelle: "Mixte" },
                    { valeur: "salle", libelle: "Salle" },
                    { valeur: "maison", libelle: "Maison" },
                  ]}
                />

                <div>
                  <span className="surtitre mb-2 block">Légumes acceptés</span>
                  <div className="flex flex-wrap gap-2">
                    {LEGUMES.map((l) => (
                      <button
                        key={l}
                        onClick={() => basculer("legumesAimes", l)}
                        className={`rounded-doux border px-3 py-2 text-[13px] transition-colors ${
                          form.legumesAimes.includes(l)
                            ? "border-jaune bg-jaune-voile text-encre"
                            : "border-trait bg-creux text-brume-faible"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="surtitre mb-2 block">Contraintes</span>
                  <div className="flex flex-wrap gap-2">
                    {CONTRAINTES.map((c) => (
                      <button
                        key={c}
                        onClick={() => basculer("contraintes", c)}
                        className={`rounded-doux border px-3 py-2 text-[13px] transition-colors ${
                          form.contraintes.includes(c)
                            ? "border-jaune bg-jaune-voile text-encre"
                            : "border-trait bg-creux text-brume-faible"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <Bouton taille="large" onClick={sauvegarderProfil}>
                  Enregistrer le profil
                </Bouton>
                <p className="text-[11px] leading-relaxed text-brume-faible">
                  Modifier ton poids ou ton objectif recalcule automatiquement tes
                  cibles caloriques.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-trait overflow-hidden border-t border-trait">
                {[
                  ["Âge", `${profil.age} ans`],
                  ["Taille", `${profil.tailleCm} cm`],
                  ["Poids", `${profil.poidsKg} kg`],
                  [
                    "Objectif",
                    profil.objectif === "recomposition"
                      ? "Perdre du gras, prendre du muscle"
                      : profil.objectif === "seche"
                        ? "Sèche"
                        : "Prise de masse",
                  ],
                  ["Séances", `${profil.joursParSemaine} par semaine`],
                  [
                    "Lieu",
                    profil.lieu === "mixte"
                      ? "Salle et maison"
                      : profil.lieu === "salle"
                        ? "Salle"
                        : "Maison",
                  ],
                ].map(([libelle, valeur]) => (
                  <li
                    key={libelle}
                    className="flex items-center justify-between gap-3 bg-creux px-3.5 py-2.5 text-[13px]"
                  >
                    <span className="text-brume">{libelle}</span>
                    <span className="chiffres">{valeur}</span>
                  </li>
                ))}
              </ul>
            )}
          </Carte>

          {/* Sur ordinateur la bascule vit dans la barre latérale ; le
              téléphone n'en a pas, il lui faut donc son propre accès. */}
          <Carte>
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

      <p className="max-w-[62ch] pb-2 text-center text-[11px] leading-relaxed text-brume-faible lg:text-left">
        Cadence · les estimations nutritionnelles et les programmes sont des
        repères, pas un avis médical.
      </p>
    </div>
  );
}
