/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as courses from "../courses.js";
import type * as fichiers from "../fichiers.js";
import type * as http from "../http.js";
import type * as ia from "../ia.js";
import type * as internes from "../internes.js";
import type * as mesures from "../mesures.js";
import type * as planning from "../planning.js";
import type * as profils from "../profils.js";
import type * as programme from "../programme.js";
import type * as repas from "../repas.js";
import type * as seances from "../seances.js";
import type * as sommeil from "../sommeil.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  courses: typeof courses;
  fichiers: typeof fichiers;
  http: typeof http;
  ia: typeof ia;
  internes: typeof internes;
  mesures: typeof mesures;
  planning: typeof planning;
  profils: typeof profils;
  programme: typeof programme;
  repas: typeof repas;
  seances: typeof seances;
  sommeil: typeof sommeil;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
