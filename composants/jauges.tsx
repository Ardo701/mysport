"use client";

/**
 * Statistique compacte : un filet, un libellé, un chiffre.
 *
 * Le filet supérieur remplace le cadre : posées côte à côte, plusieurs
 * statistiques se lisent comme les colonnes d'un relevé.
 */
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
    <div className="border-t border-trait pt-2.5">
      <p className="surtitre mb-2.5">{libelle}</p>
      <p className="chiffres titre text-[24px] font-semibold leading-none tracking-[-0.03em]">
        {valeur}
        {unite && (
          <span className="ml-1 text-[12px] font-normal tracking-normal text-brume-faible">
            {unite}
          </span>
        )}
      </p>
      {detail && (
        <p className="chiffres mt-1.5 text-[11px] text-brume-faible">{detail}</p>
      )}
    </div>
  );
}
