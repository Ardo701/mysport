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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-trait bg-fond/85 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-[560px] items-stretch">
        {ONGLETS.map(({ href, libelle, Icone }) => {
          const actif = estActif(chemin, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={actif ? "page" : undefined}
                className="relative flex flex-col items-center gap-1.5 px-1 pb-2.5 pt-3"
              >
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 top-0 h-[2px] transition-opacity ${
                    actif ? "bg-jaune-vif opacity-100" : "opacity-0"
                  }`}
                />
                <Icone
                  className={`h-[21px] w-[21px] transition-colors ${
                    actif ? "text-jaune" : "text-brume-faible"
                  }`}
                />
                <span
                  className={`text-[10px] leading-none transition-colors ${
                    actif ? "text-encre" : "text-brume-faible"
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
      <div className="border-b border-trait px-6 pb-6 pt-8">
        <p className="titre text-[21px] font-bold leading-none tracking-[-0.03em]">
          MySport
        </p>
        <p className="mt-2 text-[11px] text-brume-faible">
          Journal d'entraînement
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-6">
        {GROUPES.map((groupe) => (
          <div key={groupe.titre} className="mb-7 last:mb-0">
            <p className="surtitre mb-2.5 px-6">{groupe.titre}</p>
            <ul>
              {groupe.onglets.map(({ href, libelle, Icone }) => {
                const actif = estActif(chemin, href);
                return (
                  <li key={href}>
                    {/* La page courante se marque au filet, dans la marge :
                        un aplat de couleur derrière chaque ligne active
                        alourdit une colonne qu'on lit en permanence. */}
                    <Link
                      href={href}
                      aria-current={actif ? "page" : undefined}
                      className={`group flex items-center gap-3 border-l-2 py-2.5 pl-[22px] pr-6 text-[13.5px] leading-none transition-colors ${
                        actif
                          ? "border-l-jaune-vif text-encre"
                          : "border-l-transparent text-brume hover:text-encre"
                      }`}
                    >
                      <Icone
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          actif
                            ? "text-encre"
                            : "text-brume-faible group-hover:text-brume"
                        }`}
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

      <div className="border-t border-trait px-4 py-4">
        {prenom && (
          <div className="mb-3.5 px-2">
            <p className="surtitre mb-2">Connecté</p>
            <p className="text-[14px] font-medium leading-none">{prenom}</p>
          </div>
        )}
        <BasculeTheme />
      </div>
    </aside>
  );
}
