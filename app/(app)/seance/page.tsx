"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  ID_PERSO,
  MATERIELS,
  exerciceDuCatalogue,
  materielParDefaut,
  type Materiel,
} from "@/convex/data/exercices";
import { dureeConnue, dureeRetenue, estimerKcal } from "@/convex/lib/calories";
import { poidsALaDate } from "@/convex/lib/poids";
import {
  RESSENTIS_APRES,
  RESSENTIS_AVANT,
  type RessentiApres,
  type RessentiAvant,
} from "@/convex/data/ressentis";
import { ChampNombre } from "@/composants/champ-nombre";
import { ChoixExercices, type ExerciceChoisi } from "@/composants/choix-exercices";
import { IconeChevronDroite, IconeChevronGauche, IconeCroix, IconePlus } from "@/composants/icones";
import {
  Bouton,
  BoutonLien,
  Carte,
  Chargement,
  EnTetePage,
  EtatVide,
  GroupeOptions,
  Message,
  TitreSection,
} from "@/composants/ui";
import { aujourdhuiISO, libelleRelatif } from "@/lib/dates";
import { libelleDuree, nombre, type ExerciceSaisi } from "@/lib/seances";

const OPTIONS_AVANT = RESSENTIS_AVANT.map((r) => ({ valeur: r.cle, libelle: r.libelle }));
const OPTIONS_APRES = RESSENTIS_APRES.map((r) => ({ valeur: r.cle, libelle: r.libelle }));

/** Un exercice en cours de saisie ; la clé ne sert qu'à React et n'est pas enregistrée. */
type Ligne = ExerciceSaisi & { cle: string };

let compteur = 0;
const nouvelleCle = () => `l${++compteur}`;

export default function PageSeance() {
  // L'adresse porte l'identifiant de la séance à modifier : la lire oblige à
  // attendre le navigateur, d'où la frontière de chargement.
  return (
    <Suspense fallback={<Chargement />}>
      <Formulaire />
    </Suspense>
  );
}

function Formulaire() {
  const id = useSearchParams().get("id");
  const router = useRouter();

  const pesees = useQuery(api.pesees.mesPesees);
  const existante = useQuery(api.seances.seance, id ? { id } : "skip");
  const enregistrer = useMutation(api.seances.enregistrer);
  const supprimer = useMutation(api.seances.supprimer);

  const [date, setDate] = useState("");
  const [dureeMin, setDureeMin] = useState<number | undefined>(undefined);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [notes, setNotes] = useState("");
  const [ressentiAvant, setRessentiAvant] = useState<RessentiAvant | undefined>(undefined);
  const [ressentiApres, setRessentiApres] = useState<RessentiApres | undefined>(undefined);
  const [pret, setPret] = useState(false);
  const [choixOuvert, setChoixOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmerSuppression, setConfirmerSuppression] = useState(false);

  // Le formulaire se remplit une seule fois : recopier la séance à chaque
  // mise à jour de la requête effacerait ce qu'on est en train de corriger.
  useEffect(() => {
    if (pret) return;
    if (!id) {
      setDate(aujourdhuiISO());
      setPret(true);
    } else if (existante) {
      setDate(existante.date);
      setDureeMin(existante.dureeMin);
      setLignes(
        existante.exercices.map((e) => ({
          ...e,
          // Une séance notée avant l'arrivée du matériel n'en a pas : on
          // reprend celui du catalogue plutôt que de laisser la liste vide.
          materiel: e.materiel ?? materielParDefaut(e.exerciceId, e.mesure, e.chargeKg),
          cle: nouvelleCle(),
        })),
      );
      setNotes(existante.notes ?? "");
      setRessentiAvant(existante.ressentiAvant);
      setRessentiApres(existante.ressentiApres);
      setPret(true);
    }
  }, [id, existante, pret]);

  if (pesees === undefined || (id && existante === undefined)) return <Chargement />;
  if (id && existante === null) {
    return (
      <EtatVide
        className="lg:max-w-[640px]"
        titre="Séance introuvable"
        detail="Elle a peut-être été supprimée."
        action={
          <BoutonLien href="/journal" variante="secondaire">
            Retour au journal
          </BoutonLien>
        }
      />
    );
  }
  if (!pret) return <Chargement />;

  const exercices = lignes.map(({ cle: _cle, ...e }) => e);
  const connue = dureeConnue(dureeMin ?? 0, exercices);
  const duree = dureeRetenue(dureeMin ?? 0, exercices);
  // Le poids en vigueur à la date choisie : c'est celui que le serveur prendra.
  const poidsKg = poidsALaDate(pesees, date);
  const kcal = poidsKg === undefined ? 0 : estimerKcal({ dureeMin: duree, exercices }, poidsKg);

  function modifier(cle: string, champs: Partial<ExerciceSaisi>) {
    setLignes((ls) => ls.map((l) => (l.cle === cle ? { ...l, ...champs } : l)));
  }

  function ajouter(choisis: ExerciceChoisi[]) {
    setLignes((ls) => [
      ...ls,
      ...choisis.map((c) => ({
        ...c,
        materiel: materielParDefaut(c.exerciceId, c.mesure),
        cle: nouvelleCle(),
      })),
    ]);
  }

  async function valider() {
    setErreur(null);
    setEnvoi(true);
    try {
      await enregistrer({
        id: existante?._id,
        date,
        dureeMin: dureeMin ?? 0,
        exercices,
        notes: notes.trim() || undefined,
        ressentiAvant,
        ressentiApres,
      });
      router.push("/journal");
    } catch {
      setErreur("L'enregistrement a échoué. Vérifie ta connexion et réessaie.");
      setEnvoi(false);
    }
  }

  async function effacer(cible: Id<"seances">) {
    setEnvoi(true);
    await supprimer({ id: cible });
    router.push("/journal");
  }

  return (
    <div className="lg:max-w-[640px]">
      <EnTetePage
        avant={
          <Link
            href="/journal"
            className="mb-3 inline-flex items-center gap-1 text-[14px] font-medium text-brume transition-colors hover:text-encre"
          >
            <IconeChevronGauche className="h-4 w-4" />
            Journal
          </Link>
        }
        surtitre={date ? libelleRelatif(date) : undefined}
        titre={existante ? "Modifier la séance" : "Nouvelle séance"}
      />

      <div className="space-y-8">
        <div className="boite p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="surtitre mb-2 block">Date</span>
              <input
                type="date"
                value={date}
                max={aujourdhuiISO()}
                onChange={(e) => setDate(e.target.value)}
                className="champ chiffres"
              />
            </label>
            <ChampNombre
              libelle="Durée"
              suffixe="min"
              placeholder="45"
              valeur={dureeMin}
              max={600}
              onValeur={setDureeMin}
            />
          </div>
          {connue && duree > (dureeMin ?? 0) && (
            <p className="mt-2.5 text-[12px] leading-relaxed text-brume">
              Comptée {libelleDuree(duree)} : les exercices notés prennent plus de
              temps que la durée saisie.
            </p>
          )}
        </div>

        <Carte>
          <TitreSection
            titre="Exercices"
            action={lignes.length > 0 ? <span className="chiffres">{lignes.length}</span> : undefined}
          />

          {lignes.length === 0 ? (
            <p className="boite mb-3 px-4 py-4 text-[13px] leading-relaxed text-brume">
              Ajoute ce que tu as fait. Le détail (séries, charges, distance) est
              facultatif, mais il affine l&apos;estimation des calories.
            </p>
          ) : (
            <ul className="boite mb-3 divide-y divide-trait">
              {lignes.map((l) => (
                <LigneExercice
                  key={l.cle}
                  ligne={l}
                  onModifier={(champs) => modifier(l.cle, champs)}
                  onRetirer={() => setLignes((ls) => ls.filter((x) => x.cle !== l.cle))}
                />
              ))}
            </ul>
          )}

          <Bouton
            variante="secondaire"
            taille="large"
            onClick={() => setChoixOuvert(true)}
          >
            <IconePlus className="h-[18px] w-[18px]" />
            Ajouter des exercices
          </Bouton>
        </Carte>

        <Carte>
          <TitreSection titre="Ressenti" action="facultatif" />
          <div className="boite space-y-4 p-4">
            <GroupeOptions
              libelle="Avant la séance"
              options={OPTIONS_AVANT}
              valeur={ressentiAvant}
              onChange={setRessentiAvant}
              colonnes={5}
              facultatif
            />
            <GroupeOptions
              libelle="Après la séance"
              options={OPTIONS_APRES}
              valeur={ressentiApres}
              onChange={setRessentiApres}
              colonnes={5}
              facultatif
            />
            <p className="text-[12px] text-brume">
              Touche à nouveau un choix pour l&apos;effacer.
            </p>
          </div>
        </Carte>

        <Carte>
          <TitreSection titre="Notes" action="facultatif" />
          <textarea
            aria-label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Sensations, douleur, record…"
            className="champ resize-none !font-sans"
          />
        </Carte>

        <div>
          <div className="boite p-4">
            <p className="text-[13px] font-medium text-brume">Calories dépensées</p>
            <p className="titre mt-1 text-[32px] font-bold leading-none">
              {connue ? kcal.toLocaleString("fr-FR") : "—"}
              <span className="ml-1.5 text-[14px] font-medium text-brume">kcal</span>
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-brume">
              Selon les exercices, les séries, la durée et ton poids à cette date
              {poidsKg !== undefined && ` (${nombre(poidsKg)} kg)`}.
            </p>
          </div>

          {!connue && (
            <Message className="mt-3">Indique la durée de la séance pour l&apos;enregistrer.</Message>
          )}
          {erreur && <Message ton="erreur" className="mt-3">{erreur}</Message>}

          <Bouton
            taille="large"
            className="mt-4"
            disabled={envoi || !connue || !date}
            onClick={valider}
          >
            {envoi ? "Enregistrement…" : existante ? "Enregistrer les modifications" : "Enregistrer la séance"}
          </Bouton>

          {existante && (
            <Bouton
              variante="danger"
              taille="large"
              className="mt-2.5"
              disabled={envoi}
              onClick={() =>
                confirmerSuppression ? effacer(existante._id) : setConfirmerSuppression(true)
              }
            >
              {confirmerSuppression ? "Confirmer la suppression" : "Supprimer la séance"}
            </Bouton>
          )}
        </div>
      </div>

      <ChoixExercices
        ouverte={choixOuvert}
        onFermer={() => setChoixOuvert(false)}
        onAjouter={ajouter}
      />
    </div>
  );
}

/** Un exercice de la séance, avec les seuls champs qui ont un sens pour lui. */
function LigneExercice({
  ligne,
  onModifier,
  onRetirer,
}: {
  ligne: Ligne;
  onModifier: (champs: Partial<ExerciceSaisi>) => void;
  onRetirer: () => void;
}) {
  const catalogue = ligne.exerciceId === ID_PERSO ? undefined : exerciceDuCatalogue(ligne.exerciceId);
  // La distance n'a de sens que pour ce qui avance : une course, une sortie à
  // vélo. Pour un match de foot ou une séance de yoga, le champ serait du bruit.
  const avecDistance = catalogue?.groupe === "Cardio";

  return (
    <li className="px-4 py-3.5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-semibold leading-snug">{ligne.nom}</p>
          <p className="mt-0.5 text-[12px] text-brume">{catalogue?.groupe ?? "Hors liste"}</p>
        </div>
        <button
          type="button"
          onClick={onRetirer}
          aria-label={`Retirer ${ligne.nom}`}
          className="-mr-2 -mt-1 flex h-9 w-9 items-center justify-center rounded-doux text-brume transition-colors hover:bg-creux hover:text-rouge"
        >
          <IconeCroix className="h-4 w-4" />
        </button>
      </div>

      {ligne.mesure === "duree" ? (
        <div className="grid grid-cols-2 gap-2">
          <ChampNombre
            aria-label={`${ligne.nom}, durée`}
            suffixe="min"
            placeholder="Durée"
            valeur={ligne.dureeMin}
            max={600}
            onValeur={(n) => onModifier({ dureeMin: n })}
          />
          {avecDistance && (
            <ChampNombre
              aria-label={`${ligne.nom}, distance`}
              suffixe="km"
              placeholder="Distance"
              decimales
              valeur={ligne.distanceKm}
              max={500}
              onValeur={(n) => onModifier({ distanceKm: n })}
            />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <ChampNombre
            aria-label={`${ligne.nom}, séries`}
            suffixe="séries"
            placeholder="3"
            valeur={ligne.series}
            max={99}
            onValeur={(n) => onModifier({ series: n })}
          />
          {ligne.mesure === "series" ? (
            <ChampNombre
              aria-label={`${ligne.nom}, répétitions`}
              suffixe="reps"
              placeholder="10"
              valeur={ligne.repetitions}
              max={999}
              onValeur={(n) => onModifier({ repetitions: n })}
            />
          ) : (
            <ChampNombre
              aria-label={`${ligne.nom}, secondes par série`}
              suffixe="s"
              placeholder="45"
              valeur={ligne.secondes}
              max={3600}
              onValeur={(n) => onModifier({ secondes: n })}
            />
          )}

          {/* Au poids du corps, il n'y a rien à peser : le champ des kilos
              n'apparaît qu'avec du matériel, et la liste prend alors la
              moitié de la ligne pour le lui laisser. */}
          <ChoixMateriel
            nom={ligne.nom}
            valeur={ligne.materiel ?? "poids-du-corps"}
            className={ligne.materiel === "poids-du-corps" ? "col-span-2" : ""}
            onChange={(materiel) =>
              onModifier(
                materiel === "poids-du-corps"
                  ? { materiel, chargeKg: undefined }
                  : { materiel },
              )
            }
          />
          {ligne.materiel !== "poids-du-corps" && (
            <ChampNombre
              aria-label={`${ligne.nom}, ${ligne.materiel === "lest" ? "lest" : "charge"}`}
              suffixe="kg"
              placeholder={ligne.materiel === "lest" ? "Lest" : "Charge"}
              decimales
              valeur={ligne.chargeKg}
              max={999}
              onValeur={(n) => onModifier({ chargeKg: n })}
            />
          )}
        </div>
      )}
    </li>
  );
}

function ChoixMateriel({
  nom,
  valeur,
  onChange,
  className = "",
}: {
  nom: string;
  valeur: Materiel;
  onChange: (m: Materiel) => void;
  className?: string;
}) {
  return (
    <label className={`relative block ${className}`}>
      <select
        aria-label={`${nom}, matériel`}
        value={valeur}
        onChange={(e) => onChange(e.target.value as Materiel)}
        className="champ appearance-none truncate !pr-9 !font-sans"
      >
        {MATERIELS.map((m) => (
          <option key={m.cle} value={m.cle}>
            {m.libelle}
          </option>
        ))}
      </select>
      <IconeChevronDroite className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-brume" />
    </label>
  );
}
