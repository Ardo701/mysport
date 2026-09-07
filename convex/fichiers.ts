import { mutation } from "./_generated/server";
import { utilisateurConnecte } from "./lib/session";

/** URL d'envoi à usage unique pour la photo d'un repas. */
export const urlDEnvoi = mutation({
  args: {},
  handler: async (ctx) => {
    await utilisateurConnecte(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});
