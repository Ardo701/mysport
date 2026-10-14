"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLangue, type Langue } from "@/composants/langue";
import { Bouton, Champ, Message } from "@/composants/ui";

export default function PageConnexion() {
  const { langue, t, choisir } = useLangue();
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
      setErreur(messageErreur(e, langue));
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
          {t(
            "Tes séances, notées en quelques gestes. Les jours, le temps passé et les calories dépensées se comptent tout seuls.",
            "Your workouts, logged in a few taps. The days, the time spent and the calories burned add up on their own.",
          )}
        </p>
      </header>

      <form onSubmit={envoyer} className="boite mt-10 space-y-3.5 p-5">
        <h2 className="mb-1 text-[17px] font-semibold">{t("Connexion", "Sign in")}</h2>

        <Champ
          libelle="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("toi@exemple.fr", "you@example.com")}
        />
        <Champ
          libelle={t("Mot de passe", "Password")}
          type="password"
          autoComplete="current-password"
          required
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          placeholder="••••••••"
        />

        {erreur && <Message ton="erreur">{erreur}</Message>}

        <Bouton type="submit" taille="large" disabled={enCours} className="mt-2">
          {enCours ? t("Un instant…", "One moment…") : t("Entrer", "Sign in")}
        </Bouton>
      </form>

      {/* Avant la connexion, la page Profil et sa bascule sont hors de portée :
          l'autre langue se choisit ici. */}
      <footer className="mt-auto flex items-baseline justify-between gap-4 pt-12 text-[12px] leading-relaxed text-brume lg:mt-8 lg:pt-0">
        <span>{t("Application privée, sans inscription.", "Private app, no sign-ups.")}</span>
        <button
          type="button"
          lang={langue === "fr" ? "en" : "fr"}
          onClick={() => choisir(langue === "fr" ? "en" : "fr")}
          className="shrink-0 font-medium text-accent-texte transition-colors hover:text-encre"
        >
          {langue === "fr" ? "English" : "Français"}
        </button>
      </footer>
    </main>
  );
}

/**
 * Traduit l'erreur remontée par Convex Auth. Les cas connus deviennent une
 * phrase utile ; le reste est affiché tel quel, parce qu'un message générique
 * envoie chercher au mauvais endroit.
 */
function messageErreur(erreur: unknown, langue: Langue): string {
  const brut = erreur instanceof Error ? erreur.message : String(erreur);
  const t = (fr: string, en: string) => (langue === "fr" ? fr : en);

  if (brut.includes("InscriptionsFermees")) {
    return t(
      "Les inscriptions sont fermées : seuls les comptes existants peuvent se connecter.",
      "Sign-ups are closed: only existing accounts can sign in.",
    );
  }
  if (brut.includes("InvalidAccountId")) {
    return t("Aucun compte n'existe avec cet email.", "No account exists with this email.");
  }
  if (brut.includes("InvalidSecret")) {
    return t("Mot de passe incorrect.", "Wrong password.");
  }
  if (brut.includes("TooManyFailedAttempts")) {
    return t(
      "Trop de tentatives. Attends quelques minutes avant de réessayer.",
      "Too many attempts. Wait a few minutes before trying again.",
    );
  }

  const variable = brut.match(/Missing environment variable `?([A-Z_]+)`?/);
  if (variable) {
    return t(
      `Le serveur n'est pas configuré : la variable ${variable[1]} manque côté Convex.`,
      `The server is not set up: the ${variable[1]} variable is missing on Convex.`,
    );
  }
  if (brut.includes("Server Error")) {
    return t(
      "Erreur côté serveur. Le message exact est dans les logs du tableau de bord Convex.",
      "Server error. The exact message is in the logs of the Convex dashboard.",
    );
  }

  return brut || t("Erreur inconnue.", "Unknown error.");
}
