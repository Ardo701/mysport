import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Fournisseurs } from "./fournisseurs";

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
  title: "Cadence — sport, repas et sommeil",
  description:
    "Suivi quotidien des séances, des repas et du sommeil, avec estimation des repas par photo ou par description.",
  applicationName: "Cadence",
  appleWebApp: { capable: true, title: "Cadence", statusBarStyle: "black-translucent" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#08080a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${policeTitre.variable} ${policeCorps.variable} h-full antialiased`}
    >
      <body className="grain min-h-full">
        <Fournisseurs>{children}</Fournisseurs>
      </body>
    </html>
  );
}
