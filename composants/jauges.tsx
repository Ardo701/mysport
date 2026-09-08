"use client";

/**
 * Compteur principal : la valeur du jour face à sa cible.
 *
 * C'était un anneau de progression. Un anneau lit mal — on y compare des
 * longueurs d'arc — et surtout c'est l'ornement le plus reconnaissable des
 * tableaux de bord fabriqués en série. Une règle graduée dit la même chose
 * plus vite : le chiffre en grand, la cible en bout de ligne, et une barre
 * dessous qui montre où on en est.
 */
export function Compteur({
  valeur,
  cible,
  unite = "kcal",
  libelle,
}: {
  valeur: number;
  cible: number;
  unite?: string;
  libelle?: string;
}) {
  const ratio = cible > 0 ? valeur / cible : 0;
  const depassement = ratio > 1;
  const restant = Math.max(0, Math.round(cible - valeur));

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <p className="chiffres titre text-[54px] font-bold leading-[0.85] tracking-[-0.04em]">
          {Math.round(valeur)}
          <span className="ml-2 text-[13px] font-normal tracking-normal text-brume-faible">
            {unite}
          </span>
        </p>
        <div className="pb-1 text-right">
          <p className="chiffres text-[13px] text-brume">
            cible {Math.round(cible)}
          </p>
          <p
            className={`chiffres mt-1 text-[12px] ${depassement ? "text-rouge" : "text-brume-faible"}`}
          >
            {libelle ?? (depassement ? "cible dépassée" : `${restant} restantes`)}
          </p>
        </div>
      </div>

      <div className="mt-4 h-[3px] w-full bg-trait">
        <div
          className="h-full"
          style={{
            width: `${Math.min(Math.max(ratio, 0), 1) * 100}%`,
            backgroundColor: depassement
              ? "var(--color-rouge)"
              : "var(--color-jaune-vif)",
            transition: "width 400ms ease",
          }}
        />
      </div>
    </div>
  );
}

/**
 * Ligne de macro : libellé, barre, chiffres.
 *
 * Tout tient sur une ligne pour que les trois macros se lisent comme un
 * tableau — on compare des longueurs alignées, pas trois blocs empilés.
 */
export function BarreMacro({
  libelle,
  valeur,
  cible,
  unite = "g",
  couleur = "var(--color-jaune-vif)",
}: {
  libelle: string;
  valeur: number;
  cible: number;
  unite?: string;
  couleur?: string;
}) {
  const pourcent = cible > 0 ? Math.min((valeur / cible) * 100, 100) : 0;
  const depasse = valeur > cible * 1.05;
  return (
    <div className="flex items-center gap-3">
      <span className="w-[68px] shrink-0 text-[12px] text-brume">{libelle}</span>
      <div className="h-[3px] flex-1 bg-trait">
        <div
          className="h-full"
          style={{
            width: `${pourcent}%`,
            backgroundColor: depasse ? "var(--color-rouge)" : couleur,
            transition: "width 400ms ease",
          }}
        />
      </div>
      <span className="chiffres w-[74px] shrink-0 text-right text-[12px] text-brume-faible">
        <span className={depasse ? "text-rouge" : "text-encre"}>
          {Math.round(valeur)}
        </span>
        {" / "}
        {Math.round(cible)} {unite}
      </span>
    </div>
  );
}

/** Barre seule, pour le sommeil, les pas et la régularité des séances. */
export function Jauge({
  pourcent,
  couleur = "var(--color-jaune-vif)",
}: {
  pourcent: number;
  couleur?: string;
}) {
  return (
    <div className="h-[3px] w-full bg-trait">
      <div
        className="h-full"
        style={{
          width: `${Math.max(0, Math.min(100, pourcent))}%`,
          backgroundColor: couleur,
          transition: "width 400ms ease",
        }}
      />
    </div>
  );
}

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
