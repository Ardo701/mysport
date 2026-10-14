"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

// Next remplace cette expression par sa valeur au moment du build : si la
// variable manque, elle vaut undefined jusque dans le navigateur.
const urlConvex = process.env.NEXT_PUBLIC_CONVEX_URL;

let client: ConvexReactClient | undefined;

function clientConvex(url: string) {
  client ??= new ConvexReactClient(url);
  return client;
}

export function Fournisseurs({ children }: { children: ReactNode }) {
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
  return (
    <main className="mx-auto flex min-h-dvh max-w-[560px] flex-col justify-center px-6 py-12">
      <h1 className="titre text-[28px] font-bold leading-tight">
        Configuration incomplète
      </h1>
      <p className="mt-4 text-[14px] leading-relaxed text-brume">
        La variable <code className="text-accent-texte">NEXT_PUBLIC_CONVEX_URL</code>{" "}
        n'était pas définie au moment du build : l'application ne sait pas à quel
        déploiement Convex se connecter.
      </p>
      <ul className="mt-5 space-y-3 text-[13px] leading-relaxed text-brume-faible">
        <li>
          <span className="text-encre">En local</span> — lance{" "}
          <code className="text-accent-texte">npx convex dev</code>, qui écrit la
          variable dans <code>.env.local</code>.
        </li>
        <li>
          <span className="text-encre">Sur Vercel</span> — la commande de build
          doit être{" "}
          <code className="text-accent-texte">
            npx convex deploy --cmd &apos;npm run build&apos;
          </code>
          , avec <code className="text-accent-texte">CONVEX_DEPLOY_KEY</code> dans les
          variables du projet. C&apos;est elle qui injecte l&apos;URL.
        </li>
      </ul>
    </main>
  );
}
