"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { useLangue } from "./langue";

/**
 * Groupe de contenu : un titre, puis ce qu'il annonce. Ne dessine rien
 * lui-même ; ce qui doit se lire d'un bloc va dans une `.boite`.
 */
export function Carte({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`carte ${className}`}>{children}</section>;
}

/**
 * Titre de bloc, posé au-dessus de sa boîte comme dans les réglages d'un
 * téléphone : un libellé court en gras, et à droite une valeur d'appoint ou
 * une action.
 */
export function TitreSection({
  titre,
  action,
}: {
  titre: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <h2 className="text-[15px] font-semibold first-letter:uppercase">{titre}</h2>
      {action && <div className="shrink-0 text-[13px] text-brume">{action}</div>}
    </div>
  );
}

type VarianteBouton = "primaire" | "secondaire" | "fantome" | "danger";

const styleBouton: Record<VarianteBouton, string> = {
  primaire: "bg-accent text-sur-accent hover:bg-accent-appui font-semibold",
  secondaire: "border border-trait bg-surface text-encre font-medium hover:bg-creux",
  fantome: "text-brume font-medium hover:text-encre",
  danger: "border border-rouge/40 text-rouge font-medium hover:border-rouge",
};

const tailles = {
  petite: "h-9 px-3.5 text-[13px]",
  normale: "h-11 px-4 text-[14px]",
  large: "h-12 px-5 text-[15px] w-full",
};

type TailleBouton = keyof typeof tailles;

function classesBouton(variante: VarianteBouton, taille: TailleBouton, className: string) {
  return `inline-flex items-center justify-center gap-2 rounded-doux transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${tailles[taille]} ${styleBouton[variante]} ${className}`;
}

export function Bouton({
  variante = "primaire",
  taille = "normale",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBouton;
  taille?: TailleBouton;
}) {
  return (
    <button className={classesBouton(variante, taille, className)} {...props}>
      {children}
    </button>
  );
}

/**
 * Un lien qui a l'air d'un bouton : pour aller vers une autre page. Un vrai
 * bouton glissé dans un lien ferait deux arrêts au clavier pour une action.
 */
export function BoutonLien({
  href,
  variante = "primaire",
  taille = "normale",
  className = "",
  children,
}: {
  href: string;
  variante?: VarianteBouton;
  taille?: TailleBouton;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={classesBouton(variante, taille, className)}>
      {children}
    </Link>
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
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] text-brume">
            {suffixe}
          </span>
        )}
      </span>
    </label>
  );
}

/**
 * Choix exclusif, dessiné en sélecteur segmenté : un rail en creux, et
 * l'option retenue remplie d'accent. Le choix doit se voir de loin, y
 * compris sur fond sombre.
 *
 * Facultatif, un choix se retire en touchant à nouveau l'option retenue. À
 * cinq colonnes, une échelle tenue sur une ligne de téléphone, les libellés
 * se centrent et les marges se resserrent.
 */
export function GroupeOptions<T extends string>({
  libelle,
  options,
  valeur,
  onChange,
  colonnes = 2,
  facultatif = false,
}: {
  libelle?: string;
  options: readonly { valeur: T; libelle: string; detail?: string }[];
  valeur: T | undefined;
  onChange: (v: T | undefined) => void;
  colonnes?: 1 | 2 | 3 | 5;
  facultatif?: boolean;
}) {
  const grille = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 5: "grid-cols-5" }[colonnes];
  const serre = colonnes === 5;
  return (
    <div>
      {libelle && <span className="surtitre mb-2 block">{libelle}</span>}
      <div className={`grid ${grille} gap-[3px] rounded-boite bg-creux p-[3px]`}>
        {options.map((o) => {
          const actif = o.valeur === valeur;
          return (
            <button
              key={o.valeur}
              type="button"
              aria-pressed={actif}
              onClick={() => onChange(facultatif && actif ? undefined : o.valeur)}
              className={`min-h-10 rounded-doux transition-colors ${serre ? "px-1 py-2 text-center" : "px-3 py-2.5 text-left"} ${
                actif ? "bg-accent text-sur-accent" : "text-brume hover:bg-creux-vif hover:text-encre"
              }`}
            >
              <span
                className={`block leading-tight ${actif ? "font-semibold" : "font-medium"} ${serre ? "text-[12px]" : "text-[13px]"}`}
              >
                {o.libelle}
              </span>
              {o.detail && (
                <span
                  className={`chiffres mt-1 block text-[11px] leading-snug ${actif ? "text-sur-accent/75" : "text-brume-faible"}`}
                >
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

/**
 * Barre d'onglets, au même dessin que le choix exclusif : les onglets se
 * partagent la largeur, le courant est rempli d'accent.
 */
export function Onglets<T extends string>({
  options,
  valeur,
  onChange,
  className = "",
}: {
  options: {
    cle: T;
    libelle: string;
    Icone?: (p: { className?: string }) => ReactNode;
    desactive?: boolean;
  }[];
  valeur: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={`flex gap-[2px] rounded-boite bg-creux p-[3px] ${className}`}>
      {options.map(({ cle, libelle, Icone, desactive }) => {
        const actif = valeur === cle;
        return (
          <button
            key={cle}
            type="button"
            disabled={desactive}
            aria-pressed={actif}
            onClick={() => onChange(cle)}
            className={`flex h-[38px] min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-doux px-1 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              actif
                ? "bg-accent font-semibold text-sur-accent"
                : "font-medium text-brume hover:text-encre"
            }`}
          >
            {Icone && <Icone className="h-4 w-4" />}
            {libelle}
          </button>
        );
      })}
    </div>
  );
}

/** Valeur d'appoint posée en bout de titre : du texte coloré, pas une pastille. */
export function Etiquette({
  children,
  ton = "neutre",
}: {
  children: ReactNode;
  ton?: "neutre" | "accent" | "vert" | "rouge";
}) {
  const tons = {
    neutre: "text-brume",
    accent: "text-accent-texte",
    vert: "text-vert",
    rouge: "text-rouge",
  };
  return (
    <span className={`chiffres text-[12px] font-medium ${tons[ton]}`}>
      {children}
    </span>
  );
}

export function Chargement({ texte }: { texte?: string }) {
  const { t } = useLangue();
  return (
    <div className="flex items-center gap-2.5 py-8 text-[13px] text-brume">
      <span className="pulsation h-2 w-2 rounded-full bg-accent" />
      {texte ?? t("Chargement", "Loading")}…
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
    <div className={`boite px-5 py-9 text-center ${className}`}>
      <p className="text-[15px] font-semibold">{titre}</p>
      {detail && (
        <p className="mx-auto mt-1.5 max-w-[34ch] text-[13px] leading-relaxed text-brume">
          {detail}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
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
    info: "bg-creux text-brume",
    erreur: "bg-rouge/10 text-rouge",
    succes: "bg-vert/10 text-vert",
  };
  return (
    <p className={`rounded-doux px-3.5 py-2.5 text-[13px] leading-relaxed ${tons[ton]} ${className}`}>
      {children}
    </p>
  );
}

/**
 * Deux colonnes à partir du format ordinateur, volontairement inégales.
 *
 * Deux moitiés strictement égales n'arrivent jamais à contenu égal : elles
 * donnent une page qui se lit de haut en bas deux fois plutôt qu'une colonne
 * principale et sa marge. Le rapport 1,4 place la lecture à gauche et
 * l'appoint à droite.
 *
 * `items-start` est essentiel : sans lui, les deux colonnes prendraient la
 * hauteur de la plus longue et les blocs s'étireraient dans le vide.
 */
export function Colonnes({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-1 items-start gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] ${className}`}
    >
      {children}
    </div>
  );
}

/** Pile verticale de blocs, destinée à remplir une colonne. */
export function Colonne({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`space-y-8 ${className}`}>{children}</div>;
}

/**
 * En-tête de page : le nom de la page en gros, une précision en petit
 * au-dessus quand elle sert (la date, une adresse), et à droite l'action
 * principale de la page.
 */
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
    <header className="mb-6 pt-1 lg:mb-8 lg:pt-0">
      {avant}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          {surtitre && <p className="mb-1.5 text-[13px] font-medium text-brume first-letter:uppercase">{surtitre}</p>}
          <h1 className="titre text-[30px] font-bold leading-[1.1] lg:text-[34px]">{titre}</h1>
          {detail && (
            <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-brume">{detail}</p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}

/**
 * Bouton carré d'action principale, en tête de page : ajouter une séance.
 * Un lien, puisqu'il mène à une autre page.
 */
export function ActionTete({
  href,
  libelle,
  children,
}: {
  href: string;
  libelle: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={libelle}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-doux bg-accent text-sur-accent transition-colors hover:bg-accent-appui"
    >
      {children}
    </Link>
  );
}
