"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconeAccueil,
  IconeAssiette,
  IconeCalendrier,
  IconeCourbe,
  IconeHaltere,
  IconeLune,
  IconePanier,
  IconeProfil,
} from "./icones";
import { BasculeTheme } from "./theme";

type Onglet = {
  href: string;
  libelle: string;
  Icone: (p: { className?: string }) => React.ReactElement;
};

/** Les cinq destinations du pouce : ce sont les gestes quotidiens. */
const ONGLETS: Onglet[] = [
  { href: "/", libelle: "Aujourd'hui", Icone: IconeAccueil },
  { href: "/seance", libelle: "Séance", Icone: IconeHaltere },
  { href: "/repas", libelle: "Repas", Icone: IconeAssiette },
  { href: "/planning", libelle: "Planning", Icone: IconeCalendrier },
  { href: "/profil", libelle: "Profil", Icone: IconeProfil },
];

/**
 * Sur grand écran, la place ne manque plus : tout est atteignable en un clic,
 * y compris les pages que le téléphone range derrière un lien de contenu.
 */
const GROUPES: { titre: string; onglets: Onglet[] }[] = [
  {
    titre: "Aujourd'hui",
    onglets: [
      { href: "/", libelle: "Tableau de bord", Icone: IconeAccueil },
      { href: "/seance", libelle: "Séance", Icone: IconeHaltere },
      { href: "/repas", libelle: "Repas", Icone: IconeAssiette },
    ],
  },
  {
    titre: "Organisation",
    onglets: [
      { href: "/planning", libelle: "Planning", Icone: IconeCalendrier },
      { href: "/courses", libelle: "Courses", Icone: IconePanier },
    ],
  },
  {
    titre: "Suivi",
    onglets: [
      { href: "/sommeil", libelle: "Sommeil", Icone: IconeLune },
      { href: "/progression", libelle: "Progression", Icone: IconeCourbe },
      { href: "/profil", libelle: "Profil", Icone: IconeProfil },
    ],
  },
];

function estActif(chemin: string, href: string) {
  return href === "/" ? chemin === "/" : chemin.startsWith(href);
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
                  className={`absolute inset-x-5 top-0 h-[2px] rounded-full transition-opacity ${
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
      <div className="px-6 pb-7 pt-8">
        <div className="mb-4 h-1 w-9 rounded-full bg-jaune-vif" />
        <p className="titre text-[22px] font-bold leading-none">Cadence</p>
        <p className="mt-2 text-[12px] text-brume-faible">
          Sport, repas et sommeil
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-6">
        {GROUPES.map((groupe) => (
          <div key={groupe.titre} className="mb-6 last:mb-0">
            <p className="surtitre mb-2 px-3">{groupe.titre}</p>
            <ul className="space-y-0.5">
              {groupe.onglets.map(({ href, libelle, Icone }) => {
                const actif = estActif(chemin, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={actif ? "page" : undefined}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] leading-none transition ${
                        actif
                          ? "bg-jaune-voile text-encre"
                          : "text-brume hover:bg-creux hover:text-encre"
                      }`}
                    >
                      <Icone
                        className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                          actif
                            ? "text-jaune"
                            : "text-brume-faible group-hover:text-brume"
                        }`}
                      />
                      {libelle}
                      {actif && (
                        <span
                          aria-hidden="true"
                          className="ml-auto h-1.5 w-1.5 rounded-full bg-jaune-vif"
                        />
                      )}
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
