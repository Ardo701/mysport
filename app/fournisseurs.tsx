"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { useLangue, useLeverMasqueLangue } from "@/composants/langue";

// Next remplace cette expression par sa valeur au moment du build : si la
// variable manque, elle vaut undefined jusque dans le navigateur.
const urlConvex = process.env.NEXT_PUBLIC_CONVEX_URL;

let client: ConvexReactClient | undefined;

function clientConvex(url: string) {
  client ??= new ConvexReactClient(url);
  return client;
}

export function Fournisseurs({ children }: { children: ReactNode }) {
  useLeverMasqueLangue();
  if (!urlConvex) return <ConfigurationManquante />;
  return (
    <ConvexAuthProvider client={clientConvex(urlConvex)}>
      {children}
    </ConvexAuthProvider>
  );
}

/**
 * Sans URL Convex, l'application ne peut rien afficher d'utile.
 * On explique quoi faire plutôt que de laisser une page blanche.
 */
function ConfigurationManquante() {
  const { t } = useLangue();
  const variable = <code className="text-accent-texte">NEXT_PUBLIC_CONVEX_URL</code>;
  const commandeLocale = <code className="text-accent-texte">npx convex dev</code>;
  const commandeBuild = (
    <code className="text-accent-texte">npx convex deploy --cmd &apos;npm run build&apos;</code>
  );
  const cle = <code className="text-accent-texte">CONVEX_DEPLOY_KEY</code>;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[560px] flex-col justify-center px-6 py-12">
      <h1 className="titre text-[28px] font-bold leading-tight">
        {t("Configuration incomplète", "Incomplete setup")}
      </h1>
      <p className="mt-4 text-[14px] leading-relaxed text-brume">
        {t(
          <>
            La variable {variable} n&apos;était pas définie au moment du build :
            l&apos;application ne sait pas à quel déploiement Convex se connecter.
          </>,
          <>
            The {variable} variable was not set at build time: the app does not know
            which Convex deployment to connect to.
          </>,
        )}
      </p>
      <ul className="mt-5 space-y-3 text-[13px] leading-relaxed text-brume-faible">
        <li>
          {t(
            <>
              <span className="text-encre">En local</span>, lance {commandeLocale}, qui
              écrit la variable dans <code>.env.local</code>.
            </>,
            <>
              <span className="text-encre">Locally</span>, run {commandeLocale}, which
              writes the variable to <code>.env.local</code>.
            </>,
          )}
        </li>
        <li>
          {t(
            <>
              <span className="text-encre">Sur Vercel</span>, la commande de build doit
              être {commandeBuild}, avec {cle} dans les variables du projet. C&apos;est
              elle qui injecte l&apos;URL.
            </>,
            <>
              <span className="text-encre">On Vercel</span>, the build command must be{" "}
              {commandeBuild}, with {cle} in the project&apos;s variables. That is what
              injects the URL.
            </>,
          )}
        </li>
      </ul>
    </main>
  );
}
