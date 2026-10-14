"use client";

import type { ReactNode } from "react";

/**
 * Grille de chiffres : deux colonnes dans une boîte, séparées par des filets
 * d'un pixel. Les chiffres se lisent comme les cases d'un relevé.
 */
export function GrilleStats({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-boite border border-trait bg-trait">
      {children}
    </div>
  );
}

/** Une case de la grille : un libellé, un chiffre, une précision. */
export function Stat({
  libelle,
  valeur,
  unite,
  detail,
}: {
  libelle: string;
  valeur: string | number;
  unite?: string;
  detail?: string;
}) {
  return (
    <div className="bg-surface px-4 py-3.5">
      <p className="text-[12px] text-brume">{libelle}</p>
      <p className="titre mt-1 text-[24px] font-semibold leading-tight">
        {valeur}
        {unite && <span className="ml-1 text-[13px] font-medium text-brume">{unite}</span>}
      </p>
      {detail && <p className="chiffres mt-0.5 text-[12px] text-brume">{detail}</p>}
    </div>
  );
}

/**
 * Deux chiffres côte à côte, sous un chiffre principal, séparés par un filet
 * vertical : la moyenne par séance et par jour, par exemple.
 */
export function PaireStats({
  gauche,
  droite,
}: {
  gauche: { valeur: string; unite?: string; libelle: string };
  droite: { valeur: string; unite?: string; libelle: string };
}) {
  return (
    <div className="mt-5 flex border-t border-trait pt-4">
      {[gauche, droite].map((s, i) => (
        <div key={i} className={`flex-1 ${i === 1 ? "border-l border-trait pl-4" : ""}`}>
          <p className="titre text-[22px] font-semibold leading-tight">
            {s.valeur}
            {s.unite && <span className="ml-1 text-[13px] font-medium text-brume">{s.unite}</span>}
          </p>
          <p className="mt-0.5 text-[12px] text-brume">{s.libelle}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Le chiffre qu'on vient chercher sur une page, en très grand, posé à même
 * le fond : son libellé au-dessus, son unité à côté.
 */
export function ChiffreVedette({
  libelle,
  valeur,
  unite,
  children,
}: {
  libelle: string;
  valeur: string;
  unite: string;
  children?: ReactNode;
}) {
  return (
    <div>
      <p className="text-[13px] font-medium text-brume">{libelle}</p>
      <p className="titre mt-1 flex items-baseline gap-1.5">
        <span className="text-[56px] font-bold leading-none tracking-[-0.03em]">{valeur}</span>
        <span className="text-[17px] font-medium text-brume">{unite}</span>
      </p>
      {children}
    </div>
  );
}
