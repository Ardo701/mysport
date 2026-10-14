import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Aucune réponse du site ne doit finir dans un moteur de recherche : ni les
   * pages, ni les icônes, ni le manifeste. L'en-tête vaut pour tout, là où la
   * balise <meta name="robots"> ne couvre que le HTML.
   */
  async headers() {
    return [
      {
        source: "/:chemin*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
    ];
  },
};

export default nextConfig;
