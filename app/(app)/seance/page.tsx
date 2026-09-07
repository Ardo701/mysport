"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { MinuteurRepos } from "@/composants/minuteur";
import {
  Bouton,
  Carte,
  Chargement,
  Etiquette,
  EtatVide,
  Message,
  TitreSection,
} from "@/composants/ui";
import { Jauge } from "@/composants/jauges";
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
      <div className="space-y-5">
        <header className="pt-2">
          <p className="surtitre mb-2.5">{libelleRelatif(date)}</p>
          <h1 className="titre text-[28px] font-bold leading-none">Jour de repos</h1>
        </header>
        <EtatVide
          titre="Aucune séance programmée aujourd'hui"
          detail="La récupération fait partie du programme : c'est pendant le repos que le muscle se construit. Une marche de 30 minutes reste une bonne idée."
        />
        <Carte>
          <TitreSection surtitre="Rappel" titre="Ta semaine" />
          <p className="text-[13px] leading-relaxed text-brume">
            Tu peux déplacer tes créneaux d'entraînement depuis l'onglet Planning.
          </p>
        </Carte>
      </div>
    );
  }

  const { seance, log, semaine, progression } = donnees;
  const blocCourant =
    progression[Math.min(progression.length - 1, Math.floor((semaine - 1) / 4))];

  const seriesFaites = log?.series.filter((s) => s.fait).length ?? 0;
  const seriesTotal = log?.series.length ?? 0;

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="surtitre">{libelleRelatif(date)}</p>
          <Etiquette ton="jaune">Semaine {semaine} / 12</Etiquette>
        </div>
        <h1 className="titre text-[28px] font-bold leading-none">{seance.nom}</h1>
        <p className="mt-2 text-[14px] text-brume">{seance.focus}</p>
      </header>

      {log?.statut === "terminee" && (
        <Message ton="succes">
          Séance validée : {seriesFaites} séries en {log.dureeMin} minutes. Bien joué.
        </Message>
      )}
      {log?.statut === "sautee" && (
        <Message ton="erreur">
          Séance marquée comme sautée. Rattrape-la demain si tu peux.
        </Message>
      )}

      {blocCourant && (
        <Carte className="!border-jaune/25 !bg-jaune-voile">
          <div className="flex items-start gap-3">
            <IconeEclair className="mt-0.5 h-4 w-4 shrink-0 text-jaune" />
            <div>
              <p className="text-[13px] font-semibold">{blocCourant.bloc}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-brume">
                {blocCourant.consigne}
              </p>
            </div>
          </div>
        </Carte>
      )}

      {!log && (
        <Carte>
          <TitreSection surtitre="Avant de commencer" titre="Tu t'entraînes où ?" />
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
                className={`rounded-lg border px-3 py-3 text-left transition ${
                  varianteParDefaut === cle
                    ? "border-jaune bg-jaune-voile"
                    : "border-trait bg-ardoise"
                }`}
              >
                <span className="block text-[14px] font-medium">{titre}</span>
                <span className="mt-1 block text-[11px] text-brume-sombre">
                  {detail}
                </span>
              </button>
            ))}
          </div>
          <p className="mb-4 text-[12px] leading-relaxed text-brume-sombre">
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
                  <span className="chiffres text-brume-sombre">{i + 1}.</span>
                  {e}
                </li>
              ))}
            </ul>
          </div>
        </Carte>
      )}

      {log && log.statut !== "sautee" && (
        <>
          <div className="sticky top-0 z-30 -mx-5 border-b border-trait bg-noir/90 px-5 py-3 backdrop-blur-xl">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="surtitre">Avancement</span>
              <span className="chiffres text-[12px] text-brume">
                {seriesFaites} / {seriesTotal} séries
              </span>
            </div>
            <Jauge pourcent={(seriesFaites / Math.max(1, seriesTotal)) * 100} />
          </div>

          <div className="space-y-3">
            {seance.exercices.map((exercice, i) => (
              <BlocExercice
                key={exercice.id}
                numero={i + 1}
                exercice={exercice}
                log={log}
                dernieresCharges={charges?.[exercice.id]}
                verrouille={log.statut === "terminee"}
                onRepos={() => setRepos(exercice.reposSec)}
              />
            ))}
          </div>

          {seance.finisher && (
            <Carte>
              <TitreSection surtitre="Pour finir" titre="Finisher" />
              <p className="text-[13px] leading-relaxed text-brume">
                {seance.finisher}
              </p>
            </Carte>
          )}

          {log.statut === "en_cours" &&
            (finalisation ? (
              <FormulaireFin logId={log._id} onAnnuler={() => setFinalisation(false)} />
            ) : (
              <Bouton taille="large" onClick={() => setFinalisation(true)}>
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
  log,
  dernieresCharges,
  verrouille,
  onRepos,
}: {
  numero: number;
  exercice: Doc<"programmes">["seances"][number]["exercices"][number];
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
            {exercice.series} × {exercice.reps} · repos {exercice.reposSec}s
          </p>
        </div>
        {toutesFaites && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-jaune text-noir">
            <IconeCoche className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      {/* Bascule salle / maison */}
      <div className="mt-3.5 flex gap-1 rounded-lg border border-trait bg-ardoise p-1">
        {(
          [
            ["salle", "Avec machine"],
            ["maison", "Sans machine"],
          ] as const
        ).map(([cle, libelle]) => (
          <button
            key={cle}
            disabled={verrouille}
            onClick={() =>
              choisirVariante({ logId: log._id, exerciceId: exercice.id, variante: cle })
            }
            className={`flex-1 rounded-md py-2 text-[12px] font-medium transition disabled:opacity-50 ${
              variante === cle ? "bg-jaune text-noir" : "text-brume"
            }`}
          >
            {libelle}
          </button>
        ))}
      </div>

      <button
        onClick={() => setDetailOuvert((v) => !v)}
        className="mt-3 w-full text-left"
      >
        <p className="text-[12px] text-brume-sombre">
          {detail.materiel} · {detailOuvert ? "masquer" : "comment faire"}
        </p>
      </button>
      {detailOuvert && (
        <div className="apparition mt-2.5 space-y-2 rounded-lg border border-trait bg-ardoise p-3.5">
          <p className="text-[13px] leading-relaxed text-brume">{detail.execution}</p>
          <p className="border-t border-trait pt-2.5 text-[12px] leading-relaxed text-brume-sombre">
            {exercice.conseil}
          </p>
        </div>
      )}

      {dernieresCharges?.poidsKg !== undefined && (
        <p className="chiffres mt-3 text-[11px] text-brume-sombre">
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
      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 transition ${
        serie.fait ? "border-jaune/30 bg-jaune-voile" : "border-trait bg-ardoise"
      }`}
    >
      <span className="chiffres w-6 shrink-0 text-center text-[12px] text-brume-sombre">
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
        className="chiffres w-full min-w-0 rounded-md border border-trait bg-noir px-2.5 py-2 text-center text-[15px] outline-none focus:border-jaune"
      />
      <span className="shrink-0 text-[12px] text-brume-sombre">×</span>
      <input
        type="number"
        inputMode="numeric"
        disabled={verrouille}
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        placeholder="reps"
        aria-label={`Répétitions série ${serie.index + 1}`}
        className="chiffres w-full min-w-0 rounded-md border border-trait bg-noir px-2.5 py-2 text-center text-[15px] outline-none focus:border-jaune"
      />
      <button
        onClick={basculer}
        disabled={verrouille}
        aria-label={serie.fait ? "Annuler la série" : "Valider la série"}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition disabled:opacity-50 ${
          serie.fait
            ? "border-jaune bg-jaune text-noir"
            : "border-trait text-brume-sombre hover:border-jaune hover:text-jaune"
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
    <Carte className="apparition">
      <TitreSection surtitre="Bilan" titre="Comment c'était ?" />
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
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-brume-sombre">
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
                className={`chiffres flex-1 rounded-lg border py-3 text-[15px] transition ${
                  ressenti === n
                    ? "border-jaune bg-jaune text-noir font-semibold"
                    : "border-trait bg-ardoise text-brume"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-brume-sombre">
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
