import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    /**
     * L'application est personnelle : on se connecte à un compte existant, on
     * n'en crée pas de nouveau. Le blocage est ici plutôt que dans l'interface,
     * parce que retirer le formulaire laisserait l'API ouverte à quiconque
     * appellerait `signIn` avec `flow: "signUp"`.
     *
     * La bibliothèque n'appelle ce point d'entrée que sur le chemin de création
     * de compte, jamais sur une connexion. Comme il s'exécute dans la mutation
     * qui insère le compte, l'exception annule la transaction entière : aucune
     * ligne orpheline ne subsiste.
     */
    async createOrUpdateUser(ctx, { existingUserId }) {
      if (existingUserId === null) {
        throw new Error("InscriptionsFermees");
      }
      return existingUserId;
    },
  },
});
