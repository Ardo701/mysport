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

  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
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
    if (mode === "signUp" && motDePasse.length < 8) {
      setErreur("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }
    setEnCours(true);
    try {
      await signIn("password", { email, password: motDePasse, flow: mode });
      router.replace("/");
    } catch (e) {
      setErreur(messageErreur(e));
      setEnCours(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[560px] flex-col px-6 pb-10 pt-[max(3rem,env(safe-area-inset-top))]">
      <header>
        <div className="mb-6 h-1 w-14 rounded-full bg-jaune" />
        <h1 className="titre text-[44px] font-bold leading-[0.95] tracking-tight">
          Cadence
        </h1>
        <p className="mt-4 max-w-[30ch] text-[15px] leading-relaxed text-brume">
          Tes séances, tes repas et tes nuits, au même endroit. Le midi, une photo
          ou deux phrases suffisent.
        </p>
      </header>

      <form onSubmit={envoyer} className="mt-9 space-y-3.5">
        <div className="mb-5 flex gap-1 rounded-lg border border-trait bg-ardoise p-1">
          {(
            [
              ["signIn", "Se connecter"],
              ["signUp", "Créer un compte"],
            ] as const
          ).map(([cle, libelle]) => (
            <button
              key={cle}
              type="button"
              onClick={() => {
                setMode(cle);
                setErreur(null);
              }}
              className={`flex-1 rounded-md py-2.5 text-[13px] font-medium transition ${
                mode === cle
                  ? "bg-jaune text-noir"
                  : "text-brume hover:text-craie"
              }`}
            >
              {libelle}
            </button>
          ))}
        </div>

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
          autoComplete={mode === "signIn" ? "current-password" : "new-password"}
          required
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          placeholder={mode === "signUp" ? "8 caractères minimum" : "••••••••"}
        />

        {erreur && <Message ton="erreur">{erreur}</Message>}

        <Bouton type="submit" taille="large" disabled={enCours} className="mt-2">
          {enCours
            ? "Un instant…"
            : mode === "signIn"
              ? "Entrer"
              : "Créer mon compte"}
        </Bouton>
      </form>

      <footer className="mt-auto pt-12 text-[11px] leading-relaxed text-brume-sombre">
        Tes données restent sur ton compte. Les photos de repas servent uniquement
        à l'estimation nutritionnelle.
      </footer>
    </main>
  );
}

/**
 * Traduit l'erreur remontée par Convex Auth. Les cas connus deviennent une
 * phrase utile ; le reste est affiché tel quel, parce qu'un message générique
 * envoie chercher au mauvais endroit — un compte peut très bien avoir été créé
 * avant que la génération du jeton n'échoue.
 */
function messageErreur(erreur: unknown): string {
  const brut = erreur instanceof Error ? erreur.message : String(erreur);

  if (brut.includes("already exists")) {
    return "Un compte existe déjà avec cet email. Utilise « Se connecter ».";
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
    return `Le serveur n'est pas configuré : la variable ${variable[1]} manque côté Convex. Lance « npx @convex-dev/auth » sur le déploiement concerné.`;
  }
  if (brut.includes("Server Error")) {
    return "Erreur côté serveur. Le message exact est dans les logs du tableau de bord Convex.";
  }

  return brut || "Erreur inconnue.";
}
