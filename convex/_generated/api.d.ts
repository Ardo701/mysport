/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as data_exercices from "../data/exercices.js";
import type * as data_langues from "../data/langues.js";
import type * as data_ressentis from "../data/ressentis.js";
import type * as http from "../http.js";
import type * as lib_calories from "../lib/calories.js";
import type * as lib_poids from "../lib/poids.js";
import type * as lib_session from "../lib/session.js";
import type * as migrations from "../migrations.js";
import type * as pesees from "../pesees.js";
import type * as profils from "../profils.js";
import type * as seances from "../seances.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "data/exercices": typeof data_exercices;
  "data/langues": typeof data_langues;
  "data/ressentis": typeof data_ressentis;
  http: typeof http;
  "lib/calories": typeof lib_calories;
  "lib/poids": typeof lib_poids;
  "lib/session": typeof lib_session;
  migrations: typeof migrations;
  pesees: typeof pesees;
  profils: typeof profils;
  seances: typeof seances;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
