"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { useLangue } from "./langue";
import { Champ } from "./ui";

/**
 * Champ numérique facultatif, qui tolère d'être vide et accepte la virgule
 * comme le point. Il écrit les décimales à la manière de la langue : 72,5 en
 * français, 72.5 en anglais.
 *
 * Calé directement sur la valeur, il réécrirait le chiffre en place à chaque
 * frappe : impossible de vider le champ, et « 2, » redeviendrait « 2 » avant
 * qu'on ait tapé la décimale. Le texte tapé vit donc à part, et ne se recale
 * que lorsque la valeur change pour une autre raison : séance rechargée,
 * nombre ramené sous son plafond, ou langue changée.
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
  const { langue } = useLangue();
  const separateur = langue === "fr" ? "," : ".";
  const [texte, setTexte] = useState(valeur === undefined ? "" : formater(valeur, separateur));

  useEffect(() => {
    setTexte((t) =>
      lire(t) === valeur && !t.includes(separateur === "," ? "." : ",")
        ? t
        : valeur === undefined
          ? ""
          : formater(valeur, separateur),
    );
  }, [valeur, separateur]);

  return (
    <Champ
      {...props}
      type="text"
      inputMode={decimales ? "decimal" : "numeric"}
      value={texte}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        const brut = e.target.value.replace(/[.,]/g, separateur);
        const filtre = decimales
          ? brut.replace(/[^\d.,]/g, "").replace(/[.,](?=.*[.,])/g, "")
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

function formater(n: number, separateur: string): string {
  return String(n).replace(".", separateur);
}
