"use client";

import { useCallback, useSyncExternalStore } from "react";
import { IconeLune, IconeSoleil } from "./icones";

export type Theme = "clair" | "sombre";

/** Lue par le script d'amorçage comme par la bascule : une seule vérité. */
export const CLE_THEME = "mysport-theme";

/**
 * La clé du temps où l'application s'appelait Cadence : relue tant que le
 * thème n'a pas été rechoisi, pour que le renommage ne le remette pas à zéro.
 */
const ANCIENNE_CLE_THEME = "cadence-theme";

/**
 * Aligne la barre d'état du téléphone sur le fond de page.
 *
 * La couleur est relue dans la feuille de style plutôt que recopiée ici : une
 * valeur en double finirait par mentir le jour où la palette bouge. Le
 * navigateur retarde les scripts jusqu'au chargement des feuilles, elle est
 * donc déjà connue quand le script d'amorçage s'exécute.
 *
 * Cette fonction sert deux fois : appelée directement au changement de thème,
 * et recopiée telle quelle dans le script d'amorçage plus bas. Elle ne doit
 * donc rien emprunter à sa portée, sinon la copie ne trouverait rien.
 */
function alignerBarreEtat() {
  const meta = document.querySelector('meta[name="theme-color"]');
  const fond = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-fond")
    .trim();
  if (meta && fond) meta.setAttribute("content", fond);
}

/**
 * Script exécuté avant le premier rendu, en tête de <body>.
 *
 * Il pose data-theme lui-même plutôt que d'attendre React : le CSS est déjà
 * chargé quand il s'exécute, donc celui qui a choisi le clair ne voit pas
 * passer l'éclair noir du thème par défaut.
 *
 * Le défaut reste le sombre, y compris quand le système est en clair : c'est
 * l'apparence de l'application depuis toujours, et basculer un matin sans que
 * personne l'ait demandé serait la vraie surprise. Toute erreur (stockage
 * refusé, navigation privée) y retombe aussi, c'est le CSS de base.
 */
export const SCRIPT_THEME = `(function(){try{
document.documentElement.setAttribute("data-theme",
  (localStorage.getItem(${JSON.stringify(CLE_THEME)})||localStorage.getItem(${JSON.stringify(ANCIENNE_CLE_THEME)}))==="clair"?"clair":"sombre");
(${alignerBarreEtat.toString()})();
}catch(e){document.documentElement.setAttribute("data-theme","sombre");}})()`;

/*
 * Le thème vit dans le document, pas dans un composant.
 *
 * Sur ordinateur la page Profil affiche deux bascules à la fois, celle de la
 * barre latérale et la sienne : avec un état par composant, cliquer sur l'une
 * laissait l'autre afficher le thème précédent. L'attribut posé sur <html> est
 * la seule vérité, et tout le monde s'y abonne.
 */
const abonnes = new Set<() => void>();

function abonner(rappel: () => void) {
  abonnes.add(rappel);
  return () => {
    abonnes.delete(rappel);
  };
}

function instantane(): Theme {
  return document.documentElement.getAttribute("data-theme") === "clair"
    ? "clair"
    : "sombre";
}

/**
 * Rendu serveur : le thème est inconnu, et parier sur le sombre ferait
 * clignoter la bascule chez ceux qui sont en clair. On n'allume rien.
 */
function instantaneServeur(): null {
  return null;
}

/** Thème courant — null le temps de l'hydratation — et moyen d'en changer. */
export function useTheme() {
  const theme = useSyncExternalStore(abonner, instantane, instantaneServeur);

  const choisir = useCallback((choix: Theme) => {
    document.documentElement.setAttribute("data-theme", choix);
    alignerBarreEtat();
    try {
      localStorage.setItem(CLE_THEME, choix);
    } catch {
      // Stockage refusé : le thème vaut pour la session, c'est déjà ça.
    }
    for (const rappel of abonnes) rappel();
  }, []);

  return { theme, choisir };
}

const OPTIONS: { cle: Theme; libelle: string; Icone: typeof IconeLune }[] = [
  { cle: "sombre", libelle: "Sombre", Icone: IconeLune },
  { cle: "clair", libelle: "Clair", Icone: IconeSoleil },
];

/** Bascule sombre / clair, dessinée comme les autres sélecteurs de l'application. */
export function BasculeTheme({ className = "" }: { className?: string }) {
  const { theme, choisir } = useTheme();

  return (
    <div
      role="group"
      aria-label="Thème de l'application"
      className={`flex gap-5 ${className}`}
    >
      {OPTIONS.map(({ cle, libelle, Icone }) => {
        const actif = theme === cle;
        return (
          <button
            key={cle}
            type="button"
            onClick={() => choisir(cle)}
            aria-pressed={actif}
            className={`flex items-center gap-1.5 border-b-2 pb-1 text-[12px] font-medium transition-colors ${
              actif
                ? "border-b-jaune-vif text-encre"
                : "border-b-transparent text-brume-faible hover:text-brume"
            }`}
          >
            <Icone className="h-3.5 w-3.5" />
            {libelle}
          </button>
        );
      })}
    </div>
  );
}
