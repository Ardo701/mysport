"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { doseDe } from "@/convex/lib/programme";
import type { Dose } from "@/convex/data/programme";
import type { Doc } from "@/convex/_generated/dataModel";
import { MinuteurRepos } from "@/composants/minuteur";
import {
  Bouton,
  Carte,
  Chargement,
  EtatVide,
  Etiquette,
  Message,
  Onglets,
  TitreSection,
} from "@/composants/ui";
import { Jauge } from "@/composants/jauges";
import { IllustrationExercice } from "@/composants/illustration-exercice";
import { IconeCoche, IconeEclair, IconeHorloge } from "@/composants/icones";
import { aujourdhuiISO, libelleRelatif } from "@/lib/dates";

type Variante = "salle" | "maison";

export default function PageSeance() {
  const [date, setDate] = useState<string | null>(null);
  useEffect(() => setDate(aujourdhuiISO()), []);

  const profil = useQuery(api.profils.monProfil);
  const donnees = useQuery(api.seances.seanceDuJour, date ? { date } : "skip");
  const charges = useQuery(
    api.seances.dernieresCharges,
    date && donnees?.seance ? { seanceId: donnees.seance.id, date } : "skip",
  );

  const demarrer = useMutation(api.seances.demarrerSeance);
  const sauter = useMutation(api.seances.sauterSeance);

  const [varianteParDefaut, setVarianteParDefaut] = useState<Variante>("salle");
  const [repos, setRepos] = useState<number | null>(null);
  const [finalisation, setFinalisation] = useState(false);

  useEffect(() => {
    if (profil?.lieu === "maison") setVarianteParDefaut("maison");
  }, [profil?.lieu]);

  if (!date || donnees === undefined || profil === undefined) return <Chargement />;

  if (!donnees?.seance) {
    return (
      <div className="space-y-8">
        <header className="mb-10 pt-1 lg:mb-12 lg:pt-0">
          <p className="surtitre mb-2.5">{libelleRelatif(date)}</p>
          <h1 className="titre text-[30px] font-bold leading-[0.95] tracking-[-0.03em] lg:text-[38px]">
            Jour de repos
          </h1>
        </header>
        <EtatVide
          className="lg:max-w-[640px]"
          titre="Aucune séance programmée aujourd'hui"
          detail="La récupération fait partie du programme : c'est pendant le repos que le muscle se construit. Une marche de 30 minutes reste une bonne idée."
        />
        <Carte className="lg:max-w-[640px]">
          <TitreSection titre="Ta semaine" />
          <p className="text-[13px] leading-relaxed text-brume">
            Tu peux déplacer tes créneaux d'entraînement depuis l'onglet Planning.
          </p>
        </Carte>
      </div>
    );
  }

  const { seance, log, semaine, dosage, progression } = donnees;

  // La semaine du cycle dit précisément quoi faire ce lundi-là. À défaut — un
  // programme généré par l'IA n'a pas de couche hebdomadaire — on retombe sur
  // le bloc de progression, découpé en quarts du cycle.
  const consigne = dosage
    ? { titre: dosage.bloc, texte: dosage.intention }
    : progression[Math.min(progression.length - 1, Math.floor((semaine - 1) / 4))];

  const seriesFaites = log?.series.filter((s) => s.fait).length ?? 0;
  const seriesTotal = log?.series.length ?? 0;

  return (
    <div className="space-y-5">
      <header className="mb-10 pt-1 lg:mb-12 lg:pt-0">
        <div className="mb-2.5 flex items-center justify-between lg:max-w-[640px]">
          <p className="surtitre">{libelleRelatif(date)}</p>
          <Etiquette ton="jaune">Semaine {semaine} / 12</Etiquette>
        </div>
        <h1 className="titre text-[30px] font-bold leading-[0.95] tracking-[-0.03em] lg:text-[38px]">
          {seance.nom}
        </h1>
        <p className="mt-2 text-[14px] text-brume">{seance.focus}</p>
      </header>

      {log?.statut === "terminee" && (
        <Message ton="succes" className="lg:max-w-[640px]">
          Séance validée : {seriesFaites} séries en {log.dureeMin} minutes. Bien joué.
        </Message>
      )}
      {log?.statut === "sautee" && (
        <Message ton="erreur" className="lg:max-w-[640px]">
          Séance marquée comme sautée. Rattrape-la demain si tu peux.
        </Message>
      )}

      {consigne && (
        <Carte className="border-l-2 border-l-jaune py-1 pl-4 lg:max-w-[640px]">
          <div className="flex items-start gap-3">
            <IconeEclair className="mt-0.5 h-4 w-4 shrink-0 text-jaune" />
            <div>
              <p className="text-[13px] font-semibold">
                {"titre" in consigne ? consigne.titre : consigne.bloc}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-brume">
                {"texte" in consigne ? consigne.texte : consigne.consigne}
              </p>
            </div>
          </div>
        </Carte>
      )}

      {!log && (
        <Carte className="lg:max-w-[640px]">
          <TitreSection titre="Tu t'entraînes où ?" />
          <div className="mb-4 grid grid-cols-2 gap-2">
            {(
              [
                ["salle", "En salle", "Machines et charges libres"],
                ["maison", "À la maison", "Sans machine"],
              ] as const
            ).map(([cle, titre, detail]) => (
              <button
                key={cle}
                onClick={() => setVarianteParDefaut(cle)}
                className={`rounded-doux border px-3 py-3 text-left transition-colors ${
                  varianteParDefaut === cle
                    ? "border-jaune bg-jaune-voile"
                    : "border-trait bg-creux"
                }`}
              >
                <span className="block text-[14px] font-medium">{titre}</span>
                <span className="mt-1 block text-[11px] text-brume-faible">
                  {detail}
                </span>
              </button>
            ))}
          </div>
          <p className="mb-4 text-[12px] leading-relaxed text-brume-faible">
            Tu pourras changer exercice par exercice pendant la séance, si une
            machine est prise ou absente.
          </p>
          <div className="flex gap-2">
            <Bouton
              className="flex-1"
              onClick={() =>
                demarrer({ date, seanceId: seance.id, variante: varianteParDefaut })
              }
            >
              Démarrer la séance
            </Bouton>
            <Bouton
              variante="secondaire"
              onClick={() =>
                sauter({ date, seanceId: seance.id, seanceNom: seance.nom })
              }
            >
              Sauter
            </Bouton>
          </div>

          <div className="mt-5 border-t border-trait pt-4">
            <p className="surtitre mb-2.5">Échauffement</p>
            <ul className="space-y-1.5">
              {seance.echauffement.map((e, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-brume">
                  <span className="chiffres text-brume-faible">{i + 1}.</span>
                  {e}
                </li>
              ))}
            </ul>
          </div>
        </Carte>
      )}

      {log && log.statut !== "sautee" && (
        <>
          <div className="sticky top-0 z-30 -mx-5 border-b border-trait bg-fond/90 px-5 py-3 backdrop-blur-xl lg:-mx-10 lg:px-10 xl:-mx-14 xl:px-14">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="surtitre">Avancement</span>
              <span className="chiffres text-[12px] text-brume">
                {seriesFaites} / {seriesTotal} séries
              </span>
            </div>
            <Jauge pourcent={(seriesFaites / Math.max(1, seriesTotal)) * 100} />
          </div>

          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
            {seance.exercices.map((exercice, i) => {
              const dose = doseDe(exercice, dosage);
              return (
                <BlocExercice
                  key={exercice.id}
                  numero={i + 1}
                  exercice={exercice}
                  dose={dose}
                  log={log}
                  dernieresCharges={charges?.[exercice.id]}
                  verrouille={log.statut === "terminee"}
                  onRepos={() => setRepos(dose.reposSec)}
                />
              );
            })}
          </div>

          {seance.finisher && (
            <Carte className="lg:max-w-[640px]">
              {/* Le cardio de fin ne se fait pas toutes les semaines : il saute
                  pendant les décharges, où l'objectif est de récupérer. */}
              <TitreSection
                titre="Finisher"
                action={
                  dosage ? (
                    <Etiquette ton={dosage.finisherObligatoire ? "jaune" : undefined}>
                      {dosage.finisherObligatoire
                        ? "Prévu cette semaine"
                        : "Facultatif cette semaine"}
                    </Etiquette>
                  ) : undefined
                }
              />
              <p className="text-[13px] leading-relaxed text-brume">
                {seance.finisher}
              </p>
            </Carte>
          )}

          {log.statut === "en_cours" &&
            (finalisation ? (
              <FormulaireFin logId={log._id} onAnnuler={() => setFinalisation(false)} />
            ) : (
              <Bouton
                taille="large"
                className="lg:max-w-[640px]"
                onClick={() => setFinalisation(true)}
              >
                Terminer la séance
              </Bouton>
            ))}
        </>
      )}

      {repos !== null && (
        <MinuteurRepos secondes={repos} onFin={() => setRepos(null)} />
      )}
    </div>
  );
}

function BlocExercice({
  numero,
  exercice,
  dose,
  log,
  dernieresCharges,
  verrouille,
  onRepos,
}: {
  numero: number;
  exercice: Doc<"programmes">["seances"][number]["exercices"][number];
  dose: Dose;
  log: Doc<"seancesLog">;
  dernieresCharges?: { reps?: number; poidsKg?: number };
  verrouille: boolean;
  onRepos: () => void;
}) {
  const enregistrerSerie = useMutation(api.seances.enregistrerSerie);
  const choisirVariante = useMutation(api.seances.choisirVariante);
  const [detailOuvert, setDetailOuvert] = useState(false);

  const series = useMemo(
    () =>
      log.series
        .filter((s) => s.exerciceId === exercice.id)
        .sort((a, b) => a.index - b.index),
    [log.series, exercice.id],
  );

  const variante = (series[0]?.variante ?? "salle") as Variante;
  const detail = variante === "maison" ? exercice.maison : exercice.salle;
  const toutesFaites = series.length > 0 && series.every((s) => s.fait);

  return (
    <Carte className={toutesFaites ? "!border-jaune/30" : undefined}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="surtitre mb-2">
            Exercice {numero} · {exercice.groupes.join(" · ")}
          </p>
          <h3 className="titre text-[17px] font-semibold leading-tight">
            {detail.nom}
          </h3>
          <p className="chiffres mt-1.5 text-[12px] text-brume">
            {dose.series} × {dose.reps} · repos {dose.reposSec}s
          </p>
          {dose.reserve && (
            <p className="mt-1 text-[12px] text-brume-faible">{dose.reserve}</p>
          )}
        </div>
        {toutesFaites && (
          <IconeCoche className="h-4 w-4 shrink-0 text-jaune" />
        )}
      </div>

      {/* Bascule salle / maison */}
      <Onglets
        className="mt-3.5"
        options={[
          { cle: "salle", libelle: "Avec machine", desactive: verrouille },
          { cle: "maison", libelle: "Sans machine", desactive: verrouille },
        ]}
        valeur={variante}
        onChange={(cle) =>
          choisirVariante({ logId: log._id, exerciceId: exercice.id, variante: cle })
        }
      />

      {/* Sous la bascule, pas au-dessus : le dessin change avec la variante,
          et le voir changer dit mieux que le texte ce qui les sépare. */}
      <IllustrationExercice
        exerciceId={exercice.id}
        variante={variante}
        titre={detail.nom}
        className="mx-auto mt-3.5 aspect-[8/5] w-full max-w-[320px] rounded-doux border border-trait bg-creux"
      />

      <button
        onClick={() => setDetailOuvert((v) => !v)}
        className="mt-3 w-full text-left"
      >
        <p className="text-[12px] text-brume-faible">
          {detail.materiel} · {detailOuvert ? "masquer" : "comment faire"}
        </p>
      </button>
      {detailOuvert && (
        <div className="apparition mt-2.5 space-y-2 rounded-doux border border-trait bg-creux p-3.5">
          <p className="text-[13px] leading-relaxed text-brume">{detail.execution}</p>
          <p className="border-t border-trait pt-2.5 text-[12px] leading-relaxed text-brume-faible">
            {exercice.conseil}
          </p>
        </div>
      )}

      {dernieresCharges?.poidsKg !== undefined && (
        <p className="chiffres mt-3 text-[11px] text-brume-faible">
          Dernière fois : {dernieresCharges.poidsKg} kg × {dernieresCharges.reps ?? "?"}{" "}
          reps
        </p>
      )}

      <div className="mt-3.5 space-y-2">
        {series.map((serie) => (
          <LigneSerie
            key={serie.index}
            serie={serie}
            exerciceId={exercice.id}
            logId={log._id}
            verrouille={verrouille}
            suggestion={dernieresCharges}
            onValide={onRepos}
            onEnregistrer={enregistrerSerie}
          />
        ))}
      </div>
    </Carte>
  );
}

function LigneSerie({
  serie,
  exerciceId,
  logId,
  verrouille,
  suggestion,
  onValide,
  onEnregistrer,
}: {
  serie: Doc<"seancesLog">["series"][number];
  exerciceId: string;
  logId: Doc<"seancesLog">["_id"];
  verrouille: boolean;
  suggestion?: { reps?: number; poidsKg?: number };
  onValide: () => void;
  onEnregistrer: ReturnType<typeof useMutation<typeof api.seances.enregistrerSerie>>;
}) {
  const [reps, setReps] = useState(
    serie.reps?.toString() ?? suggestion?.reps?.toString() ?? "",
  );
  const [poids, setPoids] = useState(
    serie.poidsKg?.toString() ?? suggestion?.poidsKg?.toString() ?? "",
  );

  async function basculer() {
    const fait = !serie.fait;
    await onEnregistrer({
      logId,
      exerciceId,
      index: serie.index,
      reps: reps === "" ? undefined : Number(reps),
      poidsKg: poids === "" ? undefined : Number(poids),
      fait,
    });
    if (fait) onValide();
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-doux border px-2.5 py-2 transition-colors ${
        serie.fait ? "border-jaune/30 bg-jaune-voile" : "border-trait bg-creux"
      }`}
    >
      <span className="chiffres w-6 shrink-0 text-center text-[12px] text-brume-faible">
        {serie.index + 1}
      </span>
      <input
        type="number"
        inputMode="decimal"
        step="0.5"
        disabled={verrouille}
        value={poids}
        onChange={(e) => setPoids(e.target.value)}
        placeholder="kg"
        aria-label={`Charge série ${serie.index + 1}`}
        className="chiffres w-full min-w-0 rounded-doux border border-trait bg-fond px-2.5 py-2 text-center text-[15px] outline-none focus:border-jaune"
      />
      <span className="shrink-0 text-[12px] text-brume-faible">×</span>
      <input
        type="number"
        inputMode="numeric"
        disabled={verrouille}
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        placeholder="reps"
        aria-label={`Répétitions série ${serie.index + 1}`}
        className="chiffres w-full min-w-0 rounded-doux border border-trait bg-fond px-2.5 py-2 text-center text-[15px] outline-none focus:border-jaune"
      />
      <button
        onClick={basculer}
        disabled={verrouille}
        aria-label={serie.fait ? "Annuler la série" : "Valider la série"}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-doux border transition-colors disabled:opacity-50 ${
          serie.fait
            ? "border-jaune bg-jaune-vif text-sur-jaune"
            : "border-trait text-brume-faible hover:border-jaune hover:text-jaune"
        }`}
      >
        <IconeCoche className="h-4 w-4" />
      </button>
    </div>
  );
}

function FormulaireFin({
  logId,
  onAnnuler,
}: {
  logId: Doc<"seancesLog">["_id"];
  onAnnuler: () => void;
}) {
  const terminer = useMutation(api.seances.terminerSeance);
  const [duree, setDuree] = useState("55");
  const [ressenti, setRessenti] = useState(3);
  const [notes, setNotes] = useState("");

  return (
    <Carte className="apparition lg:max-w-[640px]">
      <TitreSection titre="Comment c'était ?" />
      <div className="space-y-4">
        <label className="block">
          <span className="surtitre mb-2 block">Durée</span>
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              value={duree}
              onChange={(e) => setDuree(e.target.value)}
              className="champ chiffres"
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-brume-faible">
              min
            </span>
          </div>
        </label>

        <div>
          <span className="surtitre mb-2 block">Intensité ressentie</span>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRessenti(n)}
                className={`chiffres flex-1 rounded-doux border py-3 text-[15px] transition-colors ${
                  ressenti === n
                    ? "border-jaune bg-jaune-vif text-sur-jaune font-semibold"
                    : "border-trait bg-creux text-brume"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-brume-faible">
            1 = trop facile, 5 = à la limite. Sers-t'en pour ajuster les charges la
            prochaine fois.
          </p>
        </div>

        <label className="block">
          <span className="surtitre mb-2 block">Note (facultatif)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Douleur à l'épaule, machine occupée, énergie…"
            className="champ resize-none !font-sans"
          />
        </label>

        <div className="flex gap-2">
          <Bouton variante="secondaire" onClick={onAnnuler}>
            Retour
          </Bouton>
          <Bouton
            className="flex-1"
            onClick={() =>
              terminer({
                logId,
                dureeMin: Number(duree) || 0,
                ressenti,
                notes: notes.trim() || undefined,
              })
            }
          >
            <IconeHorloge className="h-4 w-4" />
            Valider la séance
          </Bouton>
        </div>
      </div>
    </Carte>
  );
}
