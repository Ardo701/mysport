import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Outfit } from "next/font/google";
import "./globals.css";
import { Fournisseurs } from "./fournisseurs";
import { SCRIPT_LANGUE } from "@/composants/langue";
import { SCRIPT_THEME } from "@/composants/theme";

/* Outfit pour les titres et les chiffres, DM Sans pour le texte. */
const policeTitre = Outfit({
  variable: "--police-titre",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const policeCorps = DM_Sans({
  variable: "--police-corps",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // Le titre ne dépend pas de la langue : il est écrit au build, avant que
  // l'appareil ait dit laquelle il parle.
  title: "MySport",
  description:
    "Journal des séances de sport : exercices, temps passé et calories dépensées, avec un chronomètre d'intervalles.",
  applicationName: "MySport",
  appleWebApp: { capable: true, title: "MySport", statusBarStyle: "black-translucent" },
  manifest: "/manifest.webmanifest",
  // Application privée : rien à trouver dans un moteur de recherche. L'en-tête
  // X-Robots-Tag de next.config.ts couvre aussi ce qui n'est pas une page.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0f1115",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // Les scripts d'amorçage écrivent data-theme et lang sur cette balise
    // avant que React ne s'hydrate : l'écart est voulu, React n'a pas à le
    // signaler.
    <html
      lang="fr"
      className={`${policeTitre.variable} ${policeCorps.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="grain min-h-full">
        {/* Avant tout le reste : thème et langue doivent être posés avant le
            premier rendu. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_THEME }} />
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_LANGUE }} />
        <Fournisseurs>{children}</Fournisseurs>
      </body>
    </html>
  );
}
