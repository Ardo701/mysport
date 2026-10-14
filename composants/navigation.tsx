"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconeAccueil,
  IconeCalendrier,
  IconeChrono,
  IconeCourbe,
  IconeProfil,
} from "./icones";
import { BasculeTheme } from "./theme";

type Onglet = {
  href: string;
  libelle: string;
  Icone: (p: { className?: string }) => React.ReactElement;
};

/** Les cinq destinations du pouce : toute l'application tient dans la barre. */
const ONGLETS: Onglet[] = [
  { href: "/", libelle: "Aujourd'hui", Icone: IconeAccueil },
  { href: "/journal", libelle: "Journal", Icone: IconeCalendrier },
  { href: "/statistiques", libelle: "Stats", Icone: IconeCourbe },
  { href: "/chronometre", libelle: "Chrono", Icone: IconeChrono },
  { href: "/profil", libelle: "Profil", Icone: IconeProfil },
];

/**
 * Sur grand écran, les mêmes pages, rangées par usage : ce qu'on fait pendant
 * l'entraînement, et ce qu'on relit après.
 */
const GROUPES: { titre: string; onglets: Onglet[] }[] = [
  {
    titre: "Entraînement",
    onglets: [
      { href: "/", libelle: "Tableau de bord", Icone: IconeAccueil },
      { href: "/journal", libelle: "Journal", Icone: IconeCalendrier },
      { href: "/chronometre", libelle: "Chronomètre", Icone: IconeChrono },
    ],
  },
  {
    titre: "Suivi",
    onglets: [
      { href: "/statistiques", libelle: "Statistiques", Icone: IconeCourbe },
      { href: "/profil", libelle: "Profil", Icone: IconeProfil },
    ],
  },
];

function estActif(chemin: string, href: string) {
  if (href === "/") return chemin === "/";
  // La saisie d'une séance n'a pas d'onglet à elle : c'est une page du journal.
  if (href === "/journal" && chemin.startsWith("/seance")) return true;
  return chemin.startsWith(href);
}

/** Navigation basse, réservée au téléphone et à la tablette en portrait. */
export function BarreNavigation() {
  const chemin = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-trait bg-surface/95 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-[560px] items-stretch px-2">
        {ONGLETS.map(({ href, libelle, Icone }) => {
          const actif = estActif(chemin, href);
          return (
            <li key={href} className="flex-1">
              {/* L'onglet courant se reconnaît à son icône en couleur et à
                  son libellé en gras, sans pastille ni trait autour. */}
              <Link
                href={href}
                aria-current={actif ? "page" : undefined}
                className="flex flex-col items-center gap-1 px-1 pb-2 pt-2.5"
              >
                <Icone
                  className={`h-[22px] w-[22px] transition-colors ${
                    actif ? "text-accent-texte" : "text-brume"
                  }`}
                />
                <span
                  className={`text-[11px] leading-none transition-colors ${
                    actif ? "font-semibold text-encre" : "font-medium text-brume"
                  }`}
                >
                  {libelle}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Colonne de navigation fixe, affichée à partir du format ordinateur. */
export function BarreLaterale({ prenom }: { prenom?: string }) {
  const chemin = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-trait bg-surface lg:flex">
      <div className="px-6 pb-6 pt-8">
        <p className="titre text-[22px] font-bold leading-none">MySport</p>
        <p className="mt-1.5 text-[12px] text-brume">Journal d&apos;entraînement</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {GROUPES.map((groupe) => (
          <div key={groupe.titre} className="mb-6 last:mb-0">
            <p className="surtitre mb-1.5 px-3">{groupe.titre}</p>
            <ul className="space-y-0.5">
              {groupe.onglets.map(({ href, libelle, Icone }) => {
                const actif = estActif(chemin, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={actif ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-doux px-3 py-2.5 text-[14px] leading-none transition-colors ${
                        actif
                          ? "bg-creux font-semibold text-encre"
                          : "font-medium text-brume hover:bg-creux hover:text-encre"
                      }`}
                    >
                      <Icone
                        className={`h-[18px] w-[18px] shrink-0 ${actif ? "text-accent-texte" : ""}`}
                      />
                      {libelle}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-trait px-6 py-5">
        {prenom && <p className="mb-3 text-[14px] font-semibold leading-none">{prenom}</p>}
        <BasculeTheme />
      </div>
    </aside>
  );
}
