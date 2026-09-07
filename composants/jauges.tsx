"use client";

/** Anneau de progression : calories du jour par rapport à la cible. */
export function Anneau({
  valeur,
  cible,
  taille = 168,
  epaisseur = 10,
  libelle,
  unite = "kcal",
}: {
  valeur: number;
  cible: number;
  taille?: number;
  epaisseur?: number;
  libelle?: string;
  unite?: string;
}) {
  const rayon = (taille - epaisseur) / 2;
  const circonference = 2 * Math.PI * rayon;
  const ratio = cible > 0 ? Math.min(valeur / cible, 1.25) : 0;
  const rempli = Math.min(ratio, 1) * circonference;
  const depassement = ratio > 1;
  const restant = Math.max(0, Math.round(cible - valeur));

  return (
    <div className="relative shrink-0" style={{ width: taille, height: taille }}>
      <svg width={taille} height={taille} className="-rotate-90">
        <circle
          cx={taille / 2}
          cy={taille / 2}
          r={rayon}
          fill="none"
          stroke="var(--color-trait)"
          strokeWidth={epaisseur}
        />
        <circle
          cx={taille / 2}
          cy={taille / 2}
          r={rayon}
          fill="none"
          stroke={depassement ? "var(--color-rouge)" : "var(--color-jaune)"}
          strokeWidth={epaisseur}
          strokeLinecap="round"
          strokeDasharray={`${rempli} ${circonference}`}
          style={{ transition: "stroke-dasharray 500ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="chiffres titre text-[34px] font-semibold leading-none">
          {Math.round(valeur)}
        </span>
        <span className="mt-1.5 text-[11px] text-brume-sombre">
          sur {Math.round(cible)} {unite}
        </span>
        <span
          className={`mt-2 text-[11px] font-medium ${depassement ? "text-rouge" : "text-jaune"}`}
        >
          {libelle ?? (depassement ? "cible dépassée" : `${restant} restantes`)}
        </span>
      </div>
    </div>
  );
}

/** Barre horizontale pour une macro (protéines, glucides, lipides). */
export function BarreMacro({
  libelle,
  valeur,
  cible,
  unite = "g",
  couleur = "var(--color-jaune)",
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
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[12px] text-brume">{libelle}</span>
        <span className="chiffres text-[12px] text-brume-sombre">
          <span className={depasse ? "text-rouge" : "text-craie"}>
            {Math.round(valeur)}
          </span>
          {" / "}
          {Math.round(cible)} {unite}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-trait">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pourcent}%`,
            backgroundColor: depasse ? "var(--color-rouge)" : couleur,
            transition: "width 450ms ease",
          }}
        />
      </div>
    </div>
  );
}

/** Petite jauge linéaire utilisée pour le sommeil et les séances. */
export function Jauge({
  pourcent,
  couleur = "var(--color-jaune)",
}: {
  pourcent: number;
  couleur?: string;
}) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-trait">
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.max(0, Math.min(100, pourcent))}%`,
          backgroundColor: couleur,
          transition: "width 450ms ease",
        }}
      />
    </div>
  );
}

/** Statistique compacte : un chiffre, une unité, un libellé. */
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
    <div className="rounded-net border border-trait bg-ardoise px-3.5 py-3">
      <p className="surtitre mb-2">{libelle}</p>
      <p className="chiffres titre text-[22px] font-semibold leading-none">
        {valeur}
        {unite && (
          <span className="ml-1 text-[12px] font-normal text-brume-sombre">
            {unite}
          </span>
        )}
      </p>
      {detail && <p className="mt-1.5 text-[11px] text-brume-sombre">{detail}</p>}
    </div>
  );
}
