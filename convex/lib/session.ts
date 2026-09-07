import { getAuthUserId } from "@convex-dev/auth/server";
import type { GenericQueryCtx } from "convex/server";
import type { DataModel } from "../_generated/dataModel";

/** Identifiant de l'utilisateur connecté, ou erreur si la session est absente. */
export async function utilisateurConnecte(
  ctx: GenericQueryCtx<DataModel>,
): Promise<import("../_generated/dataModel").Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Non authentifié");
  return userId;
}
