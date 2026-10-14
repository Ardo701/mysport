"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

/**
 * Groupe de contenu.
 *
 * Ne dessine plus rien : ni fond, ni cadre, ni coins. Le titre souligné qui la
 * précède délimite déjà le bloc, et l'encadrer par-dessus revenait à dire deux
 * fois la même chose — c'est ce qui donnait à chaque page son air de tableau
 * de bord fait à la chaîne.
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
 * Titre de bloc : un libellé court, puis un filet jusqu'à la marge.
 *
 * Un seul niveau. Il y en avait deux — un surtitre en capitales *et* un titre
 * — qui répétaient la même information sous deux tailles (« ÉNERGIE » au-dessus
 * de « Calories »). C'est le libellé qui reste, en petit : le contraste vient
 * des chiffres en dessous, pas d'un empilement de titres.
 */
export function TitreSection({
  titre,
  action,
}: {
  titre: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3.5 flex items-center gap-3">
      <h2 className="surtitre shrink-0 text-brume">{titre}</h2>
      <span className="filet" />
      {action && <div className="shrink-0 leading-none">{action}</div>}
    </div>
  );
}

type VarianteBouton = "primaire" | "secondaire" | "fantome" | "danger";

const styleBouton: Record<VarianteBouton, string> = {
  primaire: "bg-jaune-vif text-sur-jaune hover:bg-jaune-appui font-semibold",
  secondaire: "border border-trait text-encre hover:border-trait-vif",
  fantome: "text-brume hover:text-encre",
  danger: "border border-rouge/40 text-rouge hover:border-rouge",
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
    petite: "px-3 py-1.5 text-[12px]",
    normale: "px-4 py-2.5 text-[13px]",
    large: "px-5 py-3 text-[14px] w-full",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-doux transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${tailles[taille]} ${styleBouton[variante]} ${className}`}
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
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] text-brume-faible">
            {suffixe}
          </span>
        )}
      </span>
    </label>
  );
}

/**
 * Choix exclusif.
 *
 * L'option retenue est cerclée d'un double filet jaune plutôt que remplie
 * d'un voile de couleur : sur une page qui ne s'autorise qu'un aplat jaune,
 * la sélection se marque au trait.
 *
 * Facultatif, un choix se retire en touchant à nouveau l'option retenue. À
 * cinq colonnes — une échelle tenue sur une ligne de téléphone —, les
 * libellés se centrent et les marges se resserrent.
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
      <div className={`grid ${grille} gap-px bg-trait`}>
        {options.map((o) => {
          const actif = o.valeur === valeur;
          return (
            <button
              key={o.valeur}
              type="button"
              aria-pressed={actif}
              onClick={() => onChange(facultatif && actif ? undefined : o.valeur)}
              className={`transition-colors ${serre ? "px-1 py-3 text-center" : "px-3 py-3 text-left"} ${
                actif
                  ? "bg-fond text-encre shadow-[inset_0_2px_0_0_var(--color-jaune)]"
                  : "bg-fond text-brume hover:text-encre"
              }`}
            >
              <span className={`block font-medium leading-tight ${serre ? "text-[12px]" : "text-[13px]"}`}>
                {o.libelle}
              </span>
              {o.detail && (
                <span className="chiffres mt-1 block text-[11px] leading-snug text-brume-faible">
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
 * Barre d'onglets.
 *
 * L'onglet courant se marque d'un souligné, pas d'un aplat jaune. Il y avait
 * cinq de ces barres dans l'application, chacune recopiée à la main avec son
 * pavé de couleur : à trois barres sur le même écran, le jaune ne désignait
 * plus rien. Le souligné laisse l'accent au seul geste principal de la page.
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
    <div className={`flex gap-6 border-b border-trait ${className}`}>
      {options.map(({ cle, libelle, Icone, desactive }) => {
        const actif = valeur === cle;
        return (
          <button
            key={cle}
            type="button"
            disabled={desactive}
            aria-pressed={actif}
            onClick={() => onChange(cle)}
            className={`-mb-px flex items-center gap-2 border-b-2 pb-2.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              actif
                ? "border-b-jaune-vif text-encre"
                : "border-b-transparent text-brume hover:text-encre"
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
  ton?: "neutre" | "jaune" | "vert" | "rouge";
}) {
  const tons = {
    neutre: "text-brume",
    jaune: "text-jaune",
    vert: "text-vert",
    rouge: "text-rouge",
  };
  return (
    <span className={`chiffres text-[12px] font-medium ${tons[ton]}`}>
      {children}
    </span>
  );
}

export function Chargement({ texte = "Chargement" }: { texte?: string }) {
  return (
    <div className="flex items-center gap-2.5 py-8 text-[13px] text-brume-faible">
      <span className="pulsation h-1.5 w-1.5 bg-jaune-vif" />
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
    <div className={`border border-dashed border-trait px-4 py-9 text-center ${className}`}>
      <p className="text-[14px] font-medium">{titre}</p>
      {detail && (
        <p className="mx-auto mt-1.5 max-w-[34ch] text-[13px] leading-relaxed text-brume-faible">
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
    info: "border-trait text-brume",
    erreur: "border-rouge/50 text-rouge",
    succes: "border-vert/50 text-vert",
  };
  return (
    <p
      className={`border-l-2 py-1 pl-3.5 text-[13px] leading-relaxed ${tons[ton]} ${className}`}
    >
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
      className={`grid grid-cols-1 items-start gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] ${className}`}
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
  return <div className={`space-y-9 ${className}`}>{children}</div>;
}

/**
 * En-tête de page : la date en petit, le nom de la page en gros.
 *
 * Les deux niveaux restent parce qu'ils portent deux informations
 * différentes — quand, et quoi — contrairement aux titres de bloc.
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
    <header className="mb-10 pt-1 lg:mb-12 lg:pt-0">
      {avant}
      <div className="flex items-end justify-between gap-4">
        <div>
          {surtitre && <p className="surtitre mb-3">{surtitre}</p>}
          <h1 className="titre text-[30px] font-bold leading-[0.95] tracking-[-0.03em] lg:text-[38px]">
            {titre}
          </h1>
          {detail && (
            <p className="mt-3 max-w-[62ch] text-[14px] leading-relaxed text-brume">
              {detail}
            </p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}
