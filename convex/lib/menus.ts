import {
  COLLATIONS,
  DINERS,
  IDEES_DEJEUNER,
  PETITS_DEJEUNERS,
  type Repas,
} from "../data/repas";
import { differenceEnJours } from "./dates";

const ORIGINE = "2026-01-05"; // un lundi, pour faire tourner la banque de repas

function rotation<T>(liste: T[], date: string, decalage = 0): T {
  const jours = differenceEnJours(ORIGINE, date);
  const index = (((jours + decalage) % liste.length) + liste.length) % liste.length;
  return liste[index];
}

/** Menu du jour issu de la banque de repas : matin, midi (repère), collation, soir. */
export function menuPreset(date: string): Repas[] {
  return [
    rotation(PETITS_DEJEUNERS, date),
    ...IDEES_DEJEUNER,
    rotation(COLLATIONS, date, 2),
    rotation(DINERS, date, 3),
  ];
}
