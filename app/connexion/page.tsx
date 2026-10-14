"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bouton, Champ, Message } from "@/composants/ui";

export default function PageConnexion() {
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/");
  }, [isLoading, isAuthenticated, router]);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await signIn("password", { email, password: motDePasse, flow: "signIn" });
      router.replace("/");
    } catch (e) {
      setErreur(messageErreur(e));
      setEnCours(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[560px] flex-col px-6 pb-10 pt-[max(3rem,env(safe-area-inset-top))] lg:justify-center lg:pb-16 lg:pt-16">
      <header>
        <h1 className="titre text-[44px] font-bold leading-[0.95] tracking-tight">
          MySport
        </h1>
        <p className="mt-4 max-w-[30ch] text-[15px] leading-relaxed text-brume">
          Tes séances, notées en quelques gestes. Les jours, le temps passé et les
          calories dépensées se comptent tout seuls.
        </p>
      </header>

      <form onSubmit={envoyer} className="boite mt-10 space-y-3.5 p-5">
        <h2 className="mb-1 text-[17px] font-semibold">Connexion</h2>

        <Champ
          libelle="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="toi@exemple.fr"
        />
        <Champ
          libelle="Mot de passe"
          type="password"
          autoComplete="current-password"
          required
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          placeholder="••••••••"
        />

        {erreur && <Message ton="erreur">{erreur}</Message>}

        <Bouton type="submit" taille="large" disabled={enCours} className="mt-2">
          {enCours ? "Un instant…" : "Entrer"}
        </Bouton>
      </form>

      <footer className="mt-auto pt-12 text-[12px] leading-relaxed text-brume lg:mt-8 lg:pt-0">
        Application privée, sans inscription.
      </footer>
    </main>
  );
}

/**
 * Traduit l'erreur remontée par Convex Auth. Les cas connus deviennent une
 * phrase utile ; le reste est affiché tel quel, parce qu'un message générique
 * envoie chercher au mauvais endroit.
 */
function messageErreur(erreur: unknown): string {
  const brut = erreur instanceof Error ? erreur.message : String(erreur);

  if (brut.includes("InscriptionsFermees")) {
    return "Les inscriptions sont fermées : seuls les comptes existants peuvent se connecter.";
  }
  if (brut.includes("InvalidAccountId")) {
    return "Aucun compte n'existe avec cet email.";
  }
  if (brut.includes("InvalidSecret")) {
    return "Mot de passe incorrect.";
  }
  if (brut.includes("TooManyFailedAttempts")) {
    return "Trop de tentatives. Attends quelques minutes avant de réessayer.";
  }

  const variable = brut.match(/Missing environment variable `?([A-Z_]+)`?/);
  if (variable) {
    return `Le serveur n'est pas configuré : la variable ${variable[1]} manque côté Convex.`;
  }
  if (brut.includes("Server Error")) {
    return "Erreur côté serveur. Le message exact est dans les logs du tableau de bord Convex.";
  }

  return brut || "Erreur inconnue.";
}
