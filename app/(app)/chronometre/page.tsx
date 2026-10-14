"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Bouton, Carte, Champ, EnTetePage, Message, TitreSection } from "@/composants/ui";
import { IconeChevronGauche } from "@/composants/icones";
import {
  LIMITES,
  PREPARATION_S,
  REGLAGES_PAR_DEFAUT,
  bornerReglages,
  construirePhases,
  dureeTotale,
  formaterDuree,
  secondesAffichees,
  situer,
  type Phase,
  type Reglages,
  type TypePhase,
} from "@/lib/intervalles";
import { Sonnerie } from "@/lib/sonnerie";

/** Les derniers réglages reviennent à la visite suivante : on refait souvent le même circuit. */
const CLE_REGLAGES = "cadence-chronometre";

type Course = {
  phases: Phase[];
  tours: number;
  /** Temps écoulé cumulé jusqu'à la dernière pause ou au dernier saut. */
  accumuleMs: number;
  /** Instant de la dernière reprise ; null tant que le minuteur est arrêté. */
  repere: number | null;
  termine: boolean;
};

function ecoule(course: Course, maintenant: number) {
  return course.accumuleMs + (course.repere === null ? 0 : maintenant - course.repere);
}

export default function PageChronometre() {
  const [reglages, setReglages] = useState<Reglages>(REGLAGES_PAR_DEFAUT);
  const [course, setCourse] = useState<Course | null>(null);
  const [maintenant, setMaintenant] = useState(() => Date.now());

  const sonnerie = useRef<Sonnerie | null>(null);
  if (sonnerie.current === null) sonnerie.current = new Sonnerie();

  useEffect(() => {
    try {
      const brut = localStorage.getItem(CLE_REGLAGES);
      if (brut) setReglages(bornerReglages(JSON.parse(brut)));
    } catch {
      // Stockage refusé ou valeur illisible : les réglages par défaut font l'affaire.
    }
    const sortie = sonnerie.current;
    return () => sortie?.fermer();
  }, []);

  const enMarche = course !== null && course.repere !== null;
  const actif = course !== null && !course.termine;

  // Affichage, et détection de la fin. Les sons, eux, sont déjà programmés et
  // ne dépendent pas de cette boucle, que le navigateur suspend en arrière-plan.
  useEffect(() => {
    if (!enMarche) return;
    let image = 0;
    const boucle = () => {
      const t = Date.now();
      setMaintenant(t);
      setCourse((c) => {
        if (!c || c.repere === null) return c;
        const totalMs = dureeTotale(c.phases) * 1000;
        return ecoule(c, t) >= totalMs
          ? { ...c, accumuleMs: totalMs, repere: null, termine: true }
          : c;
      });
      image = requestAnimationFrame(boucle);
    };
    image = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(image);
  }, [enMarche]);

  // Safari suspend la sortie audio quand la page passe en arrière-plan, et son
  // horloge s'arrête avec elle : au retour, les signaux restants seraient tous
  // décalés d'autant. On les reprogramme sur le temps réel.
  useEffect(() => {
    if (!enMarche || !course) return;
    const surRetour = () => {
      if (document.visibilityState !== "visible") return;
      sonnerie.current?.activer();
      sonnerie.current?.programmer(course.phases, ecoule(course, Date.now()));
    };
    document.addEventListener("visibilitychange", surRetour);
    return () => document.removeEventListener("visibilitychange", surRetour);
  }, [enMarche, course]);

  // L'écran reste allumé du départ à la fin, pause comprise : un téléphone posé
  // par terre pendant les pompes s'éteindrait au bout de trente secondes, et
  // le minuteur avec lui.
  useEffect(() => {
    if (!actif || !("wakeLock" in navigator)) return;
    let verrou: WakeLockSentinel | null = null;
    let vivant = true;
    const demander = async () => {
      try {
        const obtenu = await navigator.wakeLock.request("screen");
        if (vivant) verrou = obtenu;
        else obtenu.release().catch(() => {});
      } catch {
        // Refusé (batterie faible, onglet masqué) : le minuteur marche sans.
      }
    };
    // Le système lâche le verrou dès que la page est masquée ; il faut le
    // redemander au retour.
    const surRetour = () => {
      if (document.visibilityState === "visible") demander();
    };
    demander();
    document.addEventListener("visibilitychange", surRetour);
    return () => {
      vivant = false;
      document.removeEventListener("visibilitychange", surRetour);
      verrou?.release().catch(() => {});
    };
  }, [actif]);

  function demarrer() {
    const valides = bornerReglages(reglages);
    try {
      localStorage.setItem(CLE_REGLAGES, JSON.stringify(valides));
    } catch {
      // Stockage refusé : les réglages vaudront pour cette visite seulement.
    }
    const phases = construirePhases(valides);
    sonnerie.current?.activer();
    sonnerie.current?.programmer(phases, 0);
    const t = Date.now();
    setMaintenant(t);
    setCourse({ phases, tours: valides.tours, accumuleMs: 0, repere: t, termine: false });
  }

  function basculerPause() {
    if (!course) return;
    const t = Date.now();
    if (course.repere !== null) {
      sonnerie.current?.annuler();
      setCourse({ ...course, accumuleMs: ecoule(course, t), repere: null });
    } else {
      sonnerie.current?.activer();
      sonnerie.current?.programmer(course.phases, course.accumuleMs);
      setCourse({ ...course, repere: t });
    }
    setMaintenant(t);
  }

  /** Saute au début de la phase suivante, en gardant l'état de marche ou de pause. */
  function passer() {
    if (!course) return;
    const t = Date.now();
    const position = situer(course.phases, ecoule(course, t));
    if (!position) return;
    const phase = course.phases[position.index];
    const cible = (phase.debut + phase.duree) * 1000;
    const termine = cible >= dureeTotale(course.phases) * 1000;

    if (termine) {
      sonnerie.current?.annuler();
    } else if (course.repere !== null) {
      sonnerie.current?.programmer(course.phases, cible);
    }
    setCourse({
      ...course,
      accumuleMs: cible,
      repere: course.repere !== null && !termine ? t : null,
      termine,
    });
    setMaintenant(t);
  }

  function arreter() {
    sonnerie.current?.annuler();
    setCourse(null);
  }

  if (course === null) {
    return <Reglage reglages={reglages} onChange={setReglages} onDemarrer={demarrer} />;
  }
  if (course.termine) {
    return (
      <Fin
        course={course}
        onRecommencer={demarrer}
        onModifier={() => setCourse(null)}
      />
    );
  }
  return (
    <Decompte
      course={course}
      ecouleMs={ecoule(course, maintenant)}
      onPause={basculerPause}
      onPasser={passer}
      onArreter={arreter}
    />
  );
}

function Reglage({
  reglages,
  onChange,
  onDemarrer,
}: {
  reglages: Reglages;
  onChange: (r: Reglages) => void;
  onDemarrer: () => void;
}) {
  const { effort, pause, tours } = reglages;
  const total = tours * effort + Math.max(0, tours - 1) * pause;
  const probleme =
    effort === 0
      ? "Donne au moins une seconde à l'effort."
      : tours === 0
        ? "Il faut au moins un tour."
        : null;

  return (
    <div>
      <EnTetePage
        avant={<RetourProfil />}
        surtitre="Minuteur d'intervalles"
        titre="Chronomètre"
        detail="Un temps d'effort, un temps de pause, autant de tours que tu veux. Ça sonne à chaque changement, avec un décompte sur les trois dernières secondes."
      />

      <Carte className="lg:max-w-[560px]">
        <TitreSection titre="Réglages" />

        <div className="space-y-5">
          <ChampDuree
            libelle="Effort"
            secondes={effort}
            onChange={(s) => onChange({ ...reglages, effort: s })}
          />
          <ChampDuree
            libelle="Pause"
            secondes={pause}
            onChange={(s) => onChange({ ...reglages, pause: s })}
          />
          <ChampNombre
            libelle="Tours"
            suffixe="tours"
            valeur={tours}
            max={LIMITES.toursMax}
            onValeur={(n) => onChange({ ...reglages, tours: n })}
          />
        </div>

        <div className="mt-7 flex items-end justify-between gap-4 border-t border-trait pt-4">
          <div>
            <p className="surtitre mb-2">Durée totale</p>
            <p className="chiffres titre text-[28px] font-semibold leading-none">
              {formaterDuree(total)}
            </p>
          </div>
          {/* Les deux écarts au calcul de tête, dits avant qu'on les découvre. */}
          <p className="text-right text-[12px] leading-relaxed text-brume-faible">
            + {PREPARATION_S} s pour te mettre en place
            <br />
            pas de pause après le dernier tour
          </p>
        </div>

        {probleme && <Message ton="erreur" className="mt-4">{probleme}</Message>}

        <Bouton
          taille="large"
          className="mt-5"
          disabled={probleme !== null}
          onClick={onDemarrer}
        >
          Démarrer
        </Bouton>

        <p className="mt-3 text-[11px] leading-relaxed text-brume-faible">
          Sur iPhone, le son suit le bouton silencieux : s&apos;il est enclenché, le
          minuteur ne sonnera pas. L&apos;écran reste allumé jusqu&apos;à la fin.
        </p>
      </Carte>
    </div>
  );
}

const LIBELLES: Record<TypePhase, string> = {
  preparation: "En place",
  effort: "Effort",
  pause: "Pause",
};

/**
 * Le jaune est réservé à l'effort : posé par terre à deux mètres, le
 * téléphone doit dire d'un coup d'œil s'il faut pousser ou souffler.
 */
const COULEURS: Record<TypePhase, { texte: string; barre: string }> = {
  preparation: { texte: "text-encre", barre: "var(--color-trait-vif)" },
  effort: { texte: "text-jaune", barre: "var(--color-jaune-vif)" },
  pause: { texte: "text-brume", barre: "var(--color-brume-faible)" },
};

function Decompte({
  course,
  ecouleMs,
  onPause,
  onPasser,
  onArreter,
}: {
  course: Course;
  ecouleMs: number;
  onPause: () => void;
  onPasser: () => void;
  onArreter: () => void;
}) {
  const position = situer(course.phases, ecouleMs);
  if (!position) return null;

  const phase = course.phases[position.index];
  const suivante = course.phases[position.index + 1];
  const enPause = course.repere === null;
  const avancement = 1 - position.restantMs / (phase.duree * 1000);
  const totalRestant = dureeTotale(course.phases) - ecouleMs / 1000;

  return (
    <div className="mx-auto max-w-[640px] lg:pt-4">
      <div className="flex items-center justify-between gap-4">
        <p className="surtitre">
          {phase.type === "preparation"
            ? "Avant le premier tour"
            : `Tour ${phase.tour} / ${course.tours}`}
        </p>
        <p className="chiffres text-[12px] text-brume">
          reste {formaterDuree(Math.ceil(totalRestant))}
        </p>
      </div>

      <p
        aria-live="polite"
        className={`titre mt-10 text-[44px] font-bold leading-none tracking-[-0.03em] lg:text-[56px] ${COULEURS[phase.type].texte}`}
      >
        {enPause ? "En pause" : LIBELLES[phase.type]}
      </p>

      <p
        role="timer"
        className={`chiffres titre mt-4 text-[clamp(72px,30vw,176px)] font-bold leading-[0.85] tracking-[-0.05em] ${
          enPause ? "pulsation" : ""
        }`}
      >
        {formaterDuree(secondesAffichees(position.restantMs))}
      </p>

      <div className="mt-7 h-1 w-full bg-trait">
        <div
          className="h-full"
          style={{
            width: `${Math.min(1, Math.max(0, avancement)) * 100}%`,
            backgroundColor: COULEURS[phase.type].barre,
          }}
        />
      </div>

      {/* Un trait par tour, rempli au fil de l'effort : où on en est du
          circuit, sans avoir à lire le « 3 / 5 ». */}
      {course.tours > 1 && (
        <div className="mt-4 flex gap-1" aria-hidden="true">
          {course.phases
            .filter((p) => p.type === "effort")
            .map((p) => {
              const rempli = (ecouleMs / 1000 - p.debut) / p.duree;
              return (
                <div key={p.tour} className="h-[3px] flex-1 bg-trait">
                  <div
                    className="h-full bg-jaune-vif"
                    style={{ width: `${Math.min(1, Math.max(0, rempli)) * 100}%` }}
                  />
                </div>
              );
            })}
        </div>
      )}

      <p className="mt-5 text-[13px] text-brume">
        {suivante
          ? `Ensuite : ${LIBELLES[suivante.type].toLowerCase()}, ${formaterDuree(suivante.duree)}`
          : "Dernière ligne droite."}
      </p>

      <div className="mt-10 grid grid-cols-[1.4fr_1fr_1fr] gap-2">
        <Bouton taille="large" onClick={onPause}>
          {enPause ? "Reprendre" : "Pause"}
        </Bouton>
        <Bouton taille="large" variante="secondaire" onClick={onPasser}>
          Passer
        </Bouton>
        <Bouton taille="large" variante="fantome" onClick={onArreter}>
          Arrêter
        </Bouton>
      </div>
    </div>
  );
}

function Fin({
  course,
  onRecommencer,
  onModifier,
}: {
  course: Course;
  onRecommencer: () => void;
  onModifier: () => void;
}) {
  const effort = course.phases.find((p) => p.type === "effort");
  const total = dureeTotale(course.phases) - PREPARATION_S;

  return (
    <div className="mx-auto max-w-[640px] lg:pt-4">
      <p className="surtitre">Terminé</p>
      <p className="titre mt-10 text-[44px] font-bold leading-none tracking-[-0.03em] text-jaune lg:text-[56px]">
        Bien joué.
      </p>
      <p className="mt-4 text-[15px] leading-relaxed text-brume">
        {course.tours} {course.tours > 1 ? "tours" : "tour"}
        {effort ? ` de ${formaterDuree(effort.duree)} d'effort` : ""}, {formaterDuree(total)}{" "}
        au total.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-2">
        <Bouton taille="large" onClick={onRecommencer}>
          Recommencer
        </Bouton>
        <Bouton taille="large" variante="secondaire" onClick={onModifier}>
          Modifier
        </Bouton>
      </div>
    </div>
  );
}

/** Sur téléphone, la page s'ouvre depuis le profil : c'est là qu'on revient. */
function RetourProfil() {
  return (
    <Link
      href="/profil"
      className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-brume transition-colors hover:text-encre lg:hidden"
    >
      <IconeChevronGauche className="h-4 w-4" />
      Profil
    </Link>
  );
}

function ChampDuree({
  libelle,
  secondes,
  onChange,
}: {
  libelle: string;
  secondes: number;
  onChange: (secondes: number) => void;
}) {
  const minutes = Math.floor(secondes / 60);
  const reste = secondes % 60;
  return (
    <div>
      <span className="surtitre mb-2 block">{libelle}</span>
      <div className="grid grid-cols-2 gap-2">
        <ChampNombre
          aria-label={`${libelle}, minutes`}
          suffixe="min"
          valeur={minutes}
          max={59}
          onValeur={(m) => onChange(m * 60 + reste)}
        />
        <ChampNombre
          aria-label={`${libelle}, secondes`}
          suffixe="s"
          valeur={reste}
          max={59}
          onValeur={(s) => onChange(minutes * 60 + s)}
        />
      </div>
    </div>
  );
}

/**
 * Champ d'entier qui tolère d'être vide le temps de la saisie.
 *
 * Calé directement sur la valeur, il réécrirait « 0 » dès qu'on efface le
 * chiffre en place, et taper « 8 » donnerait « 08 ». Le texte tapé vit donc à
 * part, et ne se recale sur la valeur que lorsqu'elle change pour une autre
 * raison : réglages relus en mémoire, ou nombre ramené sous son plafond.
 */
function ChampNombre({
  valeur,
  max,
  onValeur,
  ...props
}: Omit<ComponentProps<typeof Champ>, "value" | "onChange"> & {
  valeur: number;
  max: number;
  onValeur: (n: number) => void;
}) {
  const [texte, setTexte] = useState(String(valeur));

  useEffect(() => {
    setTexte((t) => (lireEntier(t) === valeur ? t : String(valeur)));
  }, [valeur]);

  return (
    <Champ
      {...props}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={texte}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        const chiffres = e.target.value.replace(/\D/g, "").slice(0, 2);
        setTexte(chiffres);
        onValeur(Math.min(max, lireEntier(chiffres)));
      }}
    />
  );
}

function lireEntier(texte: string) {
  const n = parseInt(texte, 10);
  return Number.isFinite(n) ? n : 0;
}
