"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { Champ } from "./ui";

/**
 * Champ numérique facultatif, qui tolère d'être vide et accepte la virgule.
 *
 * Calé directement sur la valeur, il réécrirait le chiffre en place à chaque
 * frappe : impossible de vider le champ, et « 2, » redeviendrait « 2 » avant
 * qu'on ait tapé la décimale. Le texte tapé vit donc à part, et ne se recale
 * que lorsque la valeur change pour une autre raison — séance rechargée, ou
 * nombre ramené sous son plafond.
 */
export function ChampNombre({
  valeur,
  onValeur,
  max,
  decimales = false,
  ...props
}: Omit<ComponentProps<typeof Champ>, "value" | "onChange" | "type"> & {
  valeur: number | undefined;
  onValeur: (n: number | undefined) => void;
  max: number;
  decimales?: boolean;
}) {
  const [texte, setTexte] = useState(valeur === undefined ? "" : formater(valeur));

  useEffect(() => {
    setTexte((t) => (lire(t) === valeur ? t : valeur === undefined ? "" : formater(valeur)));
  }, [valeur]);

  return (
    <Champ
      {...props}
      type="text"
      inputMode={decimales ? "decimal" : "numeric"}
      value={texte}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        const brut = e.target.value.replace(".", ",");
        const filtre = decimales
          ? brut.replace(/[^\d,]/g, "").replace(/,(?=.*,)/g, "")
          : brut.replace(/\D/g, "");
        setTexte(filtre);
        const n = lire(filtre);
        onValeur(n === undefined ? undefined : Math.min(max, n));
      }}
    />
  );
}

function lire(texte: string): number | undefined {
  const n = parseFloat(texte.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function formater(n: number): string {
  return String(n).replace(".", ",");
}
