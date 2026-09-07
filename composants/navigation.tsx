"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconeAccueil,
  IconeAssiette,
  IconeCalendrier,
  IconeHaltere,
  IconeProfil,
} from "./icones";

const ONGLETS = [
  { href: "/", libelle: "Aujourd'hui", Icone: IconeAccueil },
  { href: "/seance", libelle: "Séance", Icone: IconeHaltere },
  { href: "/repas", libelle: "Repas", Icone: IconeAssiette },
  { href: "/planning", libelle: "Planning", Icone: IconeCalendrier },
  { href: "/profil", libelle: "Profil", Icone: IconeProfil },
];

export function BarreNavigation() {
  const chemin = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-trait bg-noir/85 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-[560px] items-stretch">
        {ONGLETS.map(({ href, libelle, Icone }) => {
          const actif =
            href === "/" ? chemin === "/" : chemin.startsWith(href);
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
                    actif ? "bg-jaune opacity-100" : "opacity-0"
                  }`}
                />
                <Icone
                  className={`h-[21px] w-[21px] transition-colors ${
                    actif ? "text-jaune" : "text-brume-sombre"
                  }`}
                />
                <span
                  className={`text-[10px] leading-none transition-colors ${
                    actif ? "text-craie" : "text-brume-sombre"
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
