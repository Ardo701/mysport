import type { MetadataRoute } from "next";

/**
 * Le site est fermé aux moteurs de recherche, et pourtant les robots peuvent
 * le parcourir : c'est voulu.
 *
 * L'interdiction passe par « noindex », posé sur chaque réponse (en-tête dans
 * next.config.ts, balise dans app/layout.tsx). Un robot ne la lit qu'en
 * chargeant la page. Lui en barrer l'accès ici l'empêcherait de la voir, et
 * Google peut alors lister l'adresse sans son contenu dès qu'un lien y mène.
 */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" } };
}
