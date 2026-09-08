"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Bouton, Champ, Chargement, GroupeOptions, Message } from "@/composants/ui";
import { Stat } from "@/composants/jauges";
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

/** Estimation des cibles, reprise de la formule utilisée côté serveur. */
function apercuCibles(p: {
  poidsKg: number;
  tailleCm: number;
  age: number;
  sexe: string;
  niveauActivite: number;
  objectif: string;
}) {
  const base =
    10 * p.poidsKg + 6.25 * p.tailleCm - 5 * p.age + (p.sexe === "femme" ? -161 : 5);
  const ajustement =
    p.objectif === "seche" ? -0.22 : p.objectif === "prise_de_masse" ? 0.1 : -0.13;
  const parKg =
    p.objectif === "seche" ? 2.2 : p.objectif === "prise_de_masse" ? 1.8 : 2.0;
  const kcal = Math.round((base * p.niveauActivite * (1 + ajustement)) / 10) * 10;
  const proteines = Math.round(p.poidsKg * parKg);
  const lipides = Math.round(p.poidsKg * 0.8);
  const glucides = Math.max(80, Math.round((kcal - proteines * 4 - lipides * 9) / 4));
  return { kcal, proteines, glucides, lipides };
}

export default function PageBienvenue() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const profil = useQuery(api.profils.monProfil, isAuthenticated ? {} : "skip");
  const enregistrerProfil = useMutation(api.profils.enregistrerProfil);
  const installerProgramme = useMutation(api.programme.installerProgrammeParDefaut);
  const creerPlanning = useMutation(api.planning.creerPlanningParDefaut);
  const router = useRouter();

  const [etape, setEtape] = useState(0);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [prenom, setPrenom] = useState("");
  const [age, setAge] = useState("21");
  const [sexe, setSexe] = useState("homme");
  const [tailleCm, setTailleCm] = useState("188");
  const [poidsKg, setPoidsKg] = useState("82");
  const [objectif, setObjectif] = useState("recomposition");
  const [niveauActivite, setNiveauActivite] = useState("1.5");
  const [joursParSemaine, setJoursParSemaine] = useState("4");
  const [lieu, setLieu] = useState("mixte");
  const [legumes, setLegumes] = useState<string[]>(LEGUMES.slice(0, 9));
  const [contraintes, setContraintes] = useState<string[]>(CONTRAINTES.slice(0, 2));

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/connexion");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (profil) router.replace("/");
  }, [profil, router]);

  const chiffres = useMemo(
    () => ({
      poidsKg: Number(poidsKg) || 0,
      tailleCm: Number(tailleCm) || 0,
      age: Number(age) || 0,
      sexe,
      niveauActivite: Number(niveauActivite),
      objectif,
    }),
    [poidsKg, tailleCm, age, sexe, niveauActivite, objectif],
  );
  const cibles = apercuCibles(chiffres);

  function basculer(liste: string[], setter: (v: string[]) => void, valeur: string) {
    setter(
      liste.includes(valeur) ? liste.filter((v) => v !== valeur) : [...liste, valeur],
    );
  }

  async function terminer() {
    setErreur(null);
    setEnCours(true);
    try {
      await enregistrerProfil({
        prenom: prenom.trim() || "Toi",
        age: Number(age),
        sexe,
        tailleCm: Number(tailleCm),
        poidsKg: Number(poidsKg),
        objectif,
        joursParSemaine: Number(joursParSemaine),
        lieu,
        niveauActivite: Number(niveauActivite),
        legumesAimes: legumes,
        contraintes,
      });
      await creerPlanning({});
      await installerProgramme({ dateISO: aujourdhuiISO() });
      router.replace("/");
    } catch {
      setErreur("L'enregistrement a échoué. Réessaie dans un instant.");
      setEnCours(false);
    }
  }

  if (isLoading || !isAuthenticated || profil === undefined) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[560px] items-center justify-center px-5">
        <Chargement />
      </main>
    );
  }

  const etapes = [
    {
      surtitre: "Étape 1 sur 4",
      titre: "Toi, en cinq chiffres",
      contenu: (
        <div className="space-y-3.5">
          <Champ
            libelle="Prénom"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            placeholder="Comment on t'appelle ?"
            className="!font-sans"
          />
          <div className="grid grid-cols-2 gap-3">
            <Champ
              libelle="Âge"
              type="number"
              inputMode="numeric"
              suffixe="ans"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
            <Champ
              libelle="Taille"
              type="number"
              inputMode="numeric"
              suffixe="cm"
              value={tailleCm}
              onChange={(e) => setTailleCm(e.target.value)}
            />
          </div>
          <Champ
            libelle="Poids actuel"
            type="number"
            inputMode="decimal"
            step="0.1"
            suffixe="kg"
            value={poidsKg}
            onChange={(e) => setPoidsKg(e.target.value)}
          />
          <GroupeOptions
            libelle="Sexe (pour le calcul du métabolisme)"
            valeur={sexe}
            onChange={setSexe}
            options={[
              { valeur: "homme", libelle: "Homme" },
              { valeur: "femme", libelle: "Femme" },
            ]}
          />
        </div>
      ),
    },
    {
      surtitre: "Étape 2 sur 4",
      titre: "Ce que tu vises",
      contenu: (
        <div className="space-y-5">
          <GroupeOptions
            libelle="Objectif"
            colonnes={1}
            valeur={objectif}
            onChange={setObjectif}
            options={[
              {
                valeur: "recomposition",
                libelle: "Perdre du gras et prendre du muscle",
                detail: "Léger déficit, protéines hautes. Le plus adapté pour partir de zéro.",
              },
              {
                valeur: "seche",
                libelle: "Sécher en priorité",
                detail: "Déficit marqué, perte plus rapide mais progression en force plus lente.",
              },
              {
                valeur: "prise_de_masse",
                libelle: "Prendre de la masse",
                detail: "Léger surplus, muscle plus rapide mais un peu de gras avec.",
              },
            ]}
          />
          <GroupeOptions
            libelle="Activité en dehors du sport"
            colonnes={1}
            valeur={niveauActivite}
            onChange={setNiveauActivite}
            options={[
              { valeur: "1.35", libelle: "Sédentaire", detail: "Assis la majorité de la journée." },
              { valeur: "1.5", libelle: "Modérée", detail: "Tu bouges un peu, quelques marches." },
              { valeur: "1.65", libelle: "Active", detail: "Debout ou en déplacement toute la journée." },
            ]}
          />
        </div>
      ),
    },
    {
      surtitre: "Étape 3 sur 4",
      titre: "Comment tu t'entraînes",
      contenu: (
        <div className="space-y-5">
          <GroupeOptions
            libelle="Séances par semaine"
            colonnes={3}
            valeur={joursParSemaine}
            onChange={setJoursParSemaine}
            options={[
              { valeur: "3", libelle: "3" },
              { valeur: "4", libelle: "4" },
              { valeur: "5", libelle: "5" },
            ]}
          />
          <GroupeOptions
            libelle="Lieu"
            colonnes={1}
            valeur={lieu}
            onChange={setLieu}
            options={[
              {
                valeur: "mixte",
                libelle: "Les deux, ça dépend des jours",
                detail: "Chaque exercice t'est proposé en version machine et en version sans matériel.",
              },
              { valeur: "salle", libelle: "Surtout en salle", detail: "La variante machine est affichée en premier." },
              { valeur: "maison", libelle: "Surtout à la maison", detail: "La variante sans machine est affichée en premier." },
            ]}
          />
        </div>
      ),
    },
    {
      surtitre: "Étape 4 sur 4",
      titre: "Ce que tu manges",
      contenu: (
        <div className="space-y-5">
          <div>
            <span className="surtitre mb-2 block">Légumes que tu acceptes</span>
            <div className="flex flex-wrap gap-2">
              {LEGUMES.map((l) => {
                const actif = legumes.includes(l);
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => basculer(legumes, setLegumes, l)}
                    className={`rounded-full border px-3 py-2 text-[13px] transition ${
                      actif
                        ? "border-jaune bg-jaune-voile text-encre"
                        : "border-trait bg-creux text-brume-faible"
                    }`}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
            <p className="mt-2.5 text-[11px] leading-relaxed text-brume-faible">
              Seuls ces légumes apparaîtront dans tes menus. Tu pourras les changer
              plus tard depuis ton profil.
            </p>
          </div>
          <div>
            <span className="surtitre mb-2 block">Contraintes</span>
            <div className="flex flex-wrap gap-2">
              {CONTRAINTES.map((c) => {
                const actif = contraintes.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => basculer(contraintes, setContraintes, c)}
                    className={`rounded-full border px-3 py-2 text-[13px] transition ${
                      actif
                        ? "border-jaune bg-jaune-voile text-encre"
                        : "border-trait bg-creux text-brume-faible"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-net border border-trait bg-creux p-4">
            <p className="surtitre mb-3">Tes cibles quotidiennes</p>
            <div className="grid grid-cols-2 gap-2">
              <Stat libelle="Calories" valeur={cibles.kcal} unite="kcal" />
              <Stat libelle="Protéines" valeur={cibles.proteines} unite="g" />
              <Stat libelle="Glucides" valeur={cibles.glucides} unite="g" />
              <Stat libelle="Lipides" valeur={cibles.lipides} unite="g" />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-brume-faible">
              Calculées à partir de ton métabolisme et de ton objectif. Ajustables
              à tout moment.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const courante = etapes[etape];
  const derniere = etape === etapes.length - 1;

  return (
    <main className="mx-auto min-h-dvh max-w-[560px] px-6 pb-10 pt-[max(2rem,env(safe-area-inset-top))] lg:pb-16 lg:pt-16">
      <div className="mb-8 flex gap-1.5">
        {etapes.map((_, i) => (
          <span
            key={i}
            className={`h-[3px] flex-1 rounded-full transition-colors ${
              i <= etape ? "bg-jaune-vif" : "bg-trait"
            }`}
          />
        ))}
      </div>

      <header className="mb-7">
        <p className="surtitre mb-3">{courante.surtitre}</p>
        <h1 className="titre text-[30px] font-bold leading-[1.05]">
          {courante.titre}
        </h1>
      </header>

      <div key={etape} className="apparition">{courante.contenu}</div>

      {erreur && <div className="mt-5"><Message ton="erreur">{erreur}</Message></div>}

      <div className="mt-8 flex gap-3">
        {etape > 0 && (
          <Bouton variante="secondaire" onClick={() => setEtape(etape - 1)}>
            Retour
          </Bouton>
        )}
        <Bouton
          className="flex-1"
          disabled={enCours}
          onClick={() => (derniere ? terminer() : setEtape(etape + 1))}
        >
          {derniere ? (enCours ? "Préparation…" : "Lancer le programme") : "Continuer"}
        </Bouton>
      </div>
    </main>
  );
}
