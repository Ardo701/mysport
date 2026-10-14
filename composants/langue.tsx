"use client";

import { useCallback, useLayoutEffect, useSyncExternalStore } from "react";
import type { Langue } from "@/convex/data/langues";

export type { Langue };

/** Lue par le script d'amorçage comme par la bascule : une seule vérité. */
export const CLE_LANGUE = "mysport-langue";

/**
 * Posée sur <html> tant que la page affiche le français du rendu serveur
 * alors que la langue choisie est l'anglais. La feuille de style masque la
 * page le temps que React la réécrive, plutôt que de laisser passer un
 * éclair de français.
 */
const ATTRIBUT_ATTENTE = "data-attente-langue";

/**
 * Script exécuté avant le premier rendu, en tête de <body>.
 *
 * La langue choisie dans le profil, sinon celle de l'appareil : le français
 * pour un téléphone réglé en français, l'anglais pour tout le reste. Elle est
 * écrite dans l'attribut lang de <html>, qui sert ensuite de référence.
 */
export const SCRIPT_LANGUE = `(function(){var c=null;
try{c=localStorage.getItem(${JSON.stringify(CLE_LANGUE)});}catch(e){}
var l=c==="fr"||c==="en"?c:/^fr/i.test(navigator.language||"")?"fr":"en";
document.documentElement.lang=l;
if(l!=="fr")document.documentElement.setAttribute(${JSON.stringify(ATTRIBUT_ATTENTE)},"");})()`;

/*
 * Comme le thème, la langue vit dans le document : l'attribut lang de <html>
 * est la seule vérité, et tout le monde s'y abonne.
 */
const abonnes = new Set<() => void>();

function abonner(rappel: () => void) {
  abonnes.add(rappel);
  return () => {
    abonnes.delete(rappel);
  };
}

function instantane(): Langue {
  return document.documentElement.lang === "en" ? "en" : "fr";
}

/** Rendu serveur et hydratation : la langue est encore inconnue. */
function instantaneServeur(): null {
  return null;
}

/**
 * La langue de l'interface, `t` pour choisir le texte qui lui correspond, et
 * de quoi en changer.
 *
 * `t` prend le français puis l'anglais, côte à côte à l'endroit où le texte
 * s'affiche : la traduction se relit avec l'original sous les yeux, et un
 * texte sans sa traduction ne compile pas.
 */
export function useLangue() {
  // Le rendu serveur est en français ; il le reste le temps de l'hydratation,
  // puis React réécrit la page dans la langue de l'appareil.
  const langue: Langue = useSyncExternalStore(abonner, instantane, instantaneServeur) ?? "fr";

  const t = useCallback(<T,>(fr: T, en: T): T => (langue === "fr" ? fr : en), [langue]);

  const choisir = useCallback((choix: Langue) => {
    document.documentElement.lang = choix;
    try {
      localStorage.setItem(CLE_LANGUE, choix);
    } catch {
      // Stockage refusé : la langue vaut pour la session, c'est déjà ça.
    }
    for (const rappel of abonnes) rappel();
  }, []);

  return { langue, t, choisir };
}

/**
 * Lève le masque posé par le script d'amorçage, une fois la page réécrite
 * dans sa langue. À appeler une seule fois, tout en haut de l'arbre.
 *
 * Pendant l'hydratation, l'instantané vaut null : la page affiche encore le
 * français du serveur. Au rendu suivant il vaut la vraie langue, et l'effet,
 * synchrone, retire le masque avant que le navigateur ne peigne.
 */
export function useLeverMasqueLangue() {
  const connue = useSyncExternalStore(abonner, instantane, instantaneServeur) !== null;
  useLayoutEffect(() => {
    if (connue) document.documentElement.removeAttribute(ATTRIBUT_ATTENTE);
  }, [connue]);
}

const OPTIONS: { cle: Langue; libelle: string }[] = [
  { cle: "fr", libelle: "Français" },
  { cle: "en", libelle: "English" },
];

/**
 * Bascule français / anglais, dessinée comme la bascule du thème. Chaque
 * langue s'écrit dans sa propre langue : on reconnaît la sienne même quand
 * on ne lit pas celle qui est affichée.
 */
export function BasculeLangue({ className = "" }: { className?: string }) {
  const { langue, t, choisir } = useLangue();

  return (
    <div
      role="group"
      aria-label={t("Langue de l'application", "App language")}
      className={`flex gap-[2px] rounded-boite bg-creux p-[3px] ${className}`}
    >
      {OPTIONS.map(({ cle, libelle }) => {
        const actif = langue === cle;
        return (
          <button
            key={cle}
            type="button"
            lang={cle}
            onClick={() => choisir(cle)}
            aria-pressed={actif}
            className={`flex h-9 flex-1 items-center justify-center rounded-doux text-[13px] transition-colors ${
              actif
                ? "bg-accent font-semibold text-sur-accent"
                : "font-medium text-brume hover:text-encre"
            }`}
          >
            {libelle}
          </button>
        );
      })}
    </div>
  );
}
