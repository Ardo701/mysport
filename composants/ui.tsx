"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Carte({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`carte p-4 ${className}`}>{children}</section>;
}

export function TitreSection({
  surtitre,
  titre,
  action,
}: {
  surtitre?: string;
  titre: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        {surtitre && <p className="surtitre mb-2">{surtitre}</p>}
        <h2 className="titre text-lg font-semibold leading-none">{titre}</h2>
      </div>
      {action}
    </div>
  );
}

type VarianteBouton = "primaire" | "secondaire" | "fantome" | "danger";

const styleBouton: Record<VarianteBouton, string> = {
  primaire:
    "bg-jaune text-noir hover:bg-jaune-sombre active:scale-[.985] font-semibold",
  secondaire:
    "bg-ardoise text-craie border border-trait hover:border-trait-clair active:scale-[.985]",
  fantome: "text-brume hover:text-craie",
  danger: "bg-transparent text-rouge border border-rouge/40 hover:bg-rouge/10",
};

export function Bouton({
  variante = "primaire",
  taille = "normale",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBouton;
  taille?: "normale" | "petite" | "large";
}) {
  const tailles = {
    petite: "px-3 py-1.5 text-[13px] rounded-lg",
    normale: "px-4 py-2.5 text-[14px] rounded-lg",
    large: "px-5 py-3.5 text-[15px] rounded-xl w-full",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${tailles[taille]} ${styleBouton[variante]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Champ({
  libelle,
  suffixe,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  libelle?: string;
  suffixe?: string;
}) {
  return (
    <label className="block">
      {libelle && <span className="surtitre mb-2 block">{libelle}</span>}
      <span className="relative block">
        <input className={`champ chiffres ${className}`} {...props} />
        {suffixe && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-brume-sombre">
            {suffixe}
          </span>
        )}
      </span>
    </label>
  );
}

export function GroupeOptions<T extends string>({
  libelle,
  options,
  valeur,
  onChange,
  colonnes = 2,
}: {
  libelle?: string;
  options: { valeur: T; libelle: string; detail?: string }[];
  valeur: T;
  onChange: (v: T) => void;
  colonnes?: 1 | 2 | 3;
}) {
  const grille = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" }[colonnes];
  return (
    <div>
      {libelle && <span className="surtitre mb-2 block">{libelle}</span>}
      <div className={`grid ${grille} gap-2`}>
        {options.map((o) => {
          const actif = o.valeur === valeur;
          return (
            <button
              key={o.valeur}
              type="button"
              onClick={() => onChange(o.valeur)}
              className={`rounded-lg border px-3 py-3 text-left transition ${
                actif
                  ? "border-jaune bg-jaune-voile text-craie"
                  : "border-trait bg-ardoise text-brume hover:border-trait-clair"
              }`}
            >
              <span className="block text-[14px] font-medium leading-tight">
                {o.libelle}
              </span>
              {o.detail && (
                <span className="mt-1 block text-[11px] leading-snug text-brume-sombre">
                  {o.detail}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Etiquette({
  children,
  ton = "neutre",
}: {
  children: ReactNode;
  ton?: "neutre" | "jaune" | "vert" | "rouge";
}) {
  const tons = {
    neutre: "border-trait text-brume",
    jaune: "border-jaune/40 text-jaune bg-jaune-voile",
    vert: "border-vert/40 text-vert",
    rouge: "border-rouge/40 text-rouge",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none ${tons[ton]}`}
    >
      {children}
    </span>
  );
}

export function Chargement({ texte = "Chargement" }: { texte?: string }) {
  return (
    <div className="flex items-center gap-2 py-8 text-sm text-brume-sombre">
      <span className="pulsation h-1.5 w-1.5 rounded-full bg-jaune" />
      {texte}…
    </div>
  );
}

export function EtatVide({
  titre,
  detail,
  action,
  className = "",
}: {
  titre: string;
  detail?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-net border border-dashed border-trait px-4 py-8 text-center ${className}`}
    >
      <p className="titre text-[15px] font-medium">{titre}</p>
      {detail && (
        <p className="mx-auto mt-1.5 max-w-[34ch] text-[13px] leading-relaxed text-brume-sombre">
          {detail}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Message({
  ton = "info",
  className = "",
  children,
}: {
  ton?: "info" | "erreur" | "succes";
  className?: string;
  children: ReactNode;
}) {
  const tons = {
    info: "border-trait bg-ardoise text-brume",
    erreur: "border-rouge/40 bg-rouge/10 text-rouge",
    succes: "border-vert/40 bg-vert/10 text-vert",
  };
  return (
    <p
      className={`rounded-lg border px-3.5 py-3 text-[13px] leading-relaxed ${tons[ton]} ${className}`}
    >
      {children}
    </p>
  );
}

/**
 * Répartit une page en deux colonnes à partir du format ordinateur.
 *
 * `items-start` est essentiel : sans lui, les deux colonnes prendraient la
 * hauteur de la plus longue et les cartes s'étireraient dans le vide.
 */
export function Colonnes({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid items-start gap-5 lg:grid-cols-2 ${className}`}>
      {children}
    </div>
  );
}

/** Pile verticale de sections, destinée à remplir une colonne. */
export function Colonne({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`space-y-5 ${className}`}>{children}</div>;
}

/** En-tête de page : même respiration partout, plus généreuse sur ordinateur. */
export function EnTetePage({
  surtitre,
  titre,
  detail,
  action,
  avant,
}: {
  surtitre?: string;
  titre: ReactNode;
  detail?: ReactNode;
  action?: ReactNode;
  avant?: ReactNode;
}) {
  return (
    <header className="pt-2 lg:pt-0">
      {avant}
      <div className="flex items-end justify-between gap-4">
        <div>
          {surtitre && <p className="surtitre mb-2.5">{surtitre}</p>}
          <h1 className="titre text-[28px] font-bold leading-none lg:text-[34px]">
            {titre}
          </h1>
          {detail && (
            <p className="mt-2.5 max-w-[62ch] text-[14px] leading-relaxed text-brume">
              {detail}
            </p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}
