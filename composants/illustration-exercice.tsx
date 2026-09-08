"use client";

/**
 * Le dessin d'un exercice, dans la variante choisie.
 *
 * Rien à charger : le dessin est du SVG écrit dans le code, il suit donc le
 * thème et reste net à n'importe quelle taille. Il n'y en a que pour les
 * exercices du programme préréglé — un programme généré par l'IA invente ses
 * propres exercices, et on ne peut pas dessiner ce qu'on ne connaît pas. Dans
 * ce cas la fonction ne rend rien plutôt qu'un cadre vide.
 */

import { SCENES } from "./illustrations/scenes";

export function IllustrationExercice({
  exerciceId,
  variante,
  titre,
  className,
}: {
  exerciceId: string;
  variante: string;
  /** Ce que le dessin montre, pour qui ne le voit pas. */
  titre: string;
  className?: string;
}) {
  const Scene = SCENES[`${exerciceId}/${variante}`];
  if (!Scene) return null;

  return (
    <svg
      viewBox="0 0 240 150"
      role="img"
      aria-label={`Schéma : ${titre}`}
      className={className}
    >
      <Scene />
    </svg>
  );
}
