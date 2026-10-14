import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Fournisseurs } from "./fournisseurs";
import { SCRIPT_THEME } from "@/composants/theme";

const policeTitre = Space_Grotesk({
  variable: "--police-titre",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const policeCorps = Inter({
  variable: "--police-corps",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MySport — journal d'entraînement",
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
  themeColor: "#08080a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // Le script de thème écrit data-theme sur cette balise avant que React ne
    // s'hydrate : l'écart est voulu, React n'a pas à le signaler.
    <html
      lang="fr"
      className={`${policeTitre.variable} ${policeCorps.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="grain min-h-full">
        {/* Avant tout le reste : le thème doit être posé avant le premier rendu. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_THEME }} />
        <Fournisseurs>{children}</Fournisseurs>
      </body>
    </html>
  );
}
