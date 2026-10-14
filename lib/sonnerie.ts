/**
 * Signaux sonores du chronomètre, joués par Web Audio.
 *
 * Les bips sont programmés d'avance sur l'horloge audio plutôt que déclenchés
 * au moment où la page s'aperçoit d'un changement de phase. Un onglet en
 * arrière-plan ne fait plus tourner ses minuteries qu'une fois par seconde —
 * une fois par minute au bout d'un moment —, alors que l'horloge audio ne
 * ralentit jamais : le signal tombe à l'heure même quand on a changé de
 * fenêtre.
 *
 * Aucun fichier son. Trois hauteurs suffisent à tout dire sans regarder
 * l'écran : un tic aigu et court pour les trois dernières secondes, un long
 * aigu pour repartir à l'effort, un long grave pour souffler.
 */

import type { Phase } from "./intervalles";

type Bip = { frequence: number; duree: number };

const TIC: Bip = { frequence: 880, duree: 0.09 };
const DEPART_EFFORT: Bip = { frequence: 1320, duree: 0.5 };
const DEPART_PAUSE: Bip = { frequence: 587, duree: 0.5 };
/** Trois notes montantes : la fin ne doit ressembler à aucun départ. */
const FIN: { bip: Bip; decalage: number }[] = [
  { bip: { frequence: 880, duree: 0.14 }, decalage: 0 },
  { bip: { frequence: 1175, duree: 0.14 }, decalage: 0.17 },
  { bip: { frequence: 1568, duree: 0.6 }, decalage: 0.34 },
];

const VOLUME = 0.5;

export class Sonnerie {
  private contexte: AudioContext | null = null;
  private programmes = new Set<{ oscillateur: OscillatorNode; gain: GainNode }>();

  /**
   * Ouvre la sortie audio. À appeler pendant un geste de l'utilisateur :
   * Safari ne laisse une page produire du son qu'à cette condition.
   */
  activer() {
    if (!this.contexte) {
      const Contexte =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Contexte) return;
      this.contexte = new Contexte();
    }
    if (this.contexte.state !== "running") {
      this.contexte.resume().catch(() => {
        // Refusé hors geste de l'utilisateur : le prochain clic réessaiera.
      });
    }
  }

  /**
   * Programme tous les signaux restants à partir d'un temps écoulé.
   *
   * Remplace la programmation précédente : après une pause ou un saut de
   * phase, les anciens horaires ne valent plus rien.
   */
  programmer(phases: Phase[], ecouleMs: number) {
    this.annuler();
    const contexte = this.contexte;
    if (!contexte) return;

    const origine = contexte.currentTime - ecouleMs / 1000;
    const passe = (instantS: number) => instantS * 1000 < ecouleMs;

    phases.forEach((phase, index) => {
      const fin = phase.debut + phase.duree;

      // Le décompte ne déborde pas sur la phase : dans une pause de deux
      // secondes, le « 3 » tomberait sur le signal de départ.
      for (const avant of [3, 2, 1]) {
        const instant = fin - avant;
        if (instant > phase.debut && !passe(instant)) {
          this.bip(TIC, origine + instant);
        }
      }

      if (passe(fin)) return;
      const suivante = phases[index + 1];
      if (!suivante) {
        for (const { bip, decalage } of FIN) this.bip(bip, origine + fin + decalage);
      } else {
        this.bip(suivante.type === "pause" ? DEPART_PAUSE : DEPART_EFFORT, origine + fin);
      }
    });
  }

  annuler() {
    for (const { oscillateur, gain } of this.programmes) {
      oscillateur.onended = null;
      try {
        oscillateur.stop();
      } catch {
        // Déjà arrêté : rien à faire.
      }
      gain.disconnect();
    }
    this.programmes.clear();
  }

  fermer() {
    this.annuler();
    this.contexte?.close().catch(() => {});
    this.contexte = null;
  }

  private bip({ frequence, duree }: Bip, quand: number) {
    const contexte = this.contexte;
    if (!contexte) return;
    const debut = Math.max(quand, contexte.currentTime);

    const oscillateur = contexte.createOscillator();
    oscillateur.type = "sine";
    oscillateur.frequency.value = frequence;

    // Attaque et extinction en rampe : un sinus coupé net claque.
    const gain = contexte.createGain();
    gain.gain.setValueAtTime(0.0001, debut);
    gain.gain.exponentialRampToValueAtTime(VOLUME, debut + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, debut + duree);

    oscillateur.connect(gain).connect(contexte.destination);
    oscillateur.start(debut);
    oscillateur.stop(debut + duree + 0.02);

    const entree = { oscillateur, gain };
    this.programmes.add(entree);
    oscillateur.onended = () => {
      gain.disconnect();
      this.programmes.delete(entree);
    };
  }
}
