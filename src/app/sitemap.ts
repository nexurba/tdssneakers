import { MetadataRoute } from "next";
import { getProducts } from "@/lib/data/products";

const baseUrl = "https://tdssneakers.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = ([
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/boutique`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/boutique?cat=sneakers`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/boutique?cat=vetements`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/boutique?cat=accessoires`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/promotions`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/recherche`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/a-propos`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/livraison`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/suivi-commande`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/conditions`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/confidentialite`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/mentions-legales`, changeFrequency: "yearly", priority: 0.2 },
  ] as const).map((r) => ({ ...r, lastModified: now }));

  // Product pages.
  try {
    const products = await getProducts();
    return [
      ...staticRoutes,
      ...products.map((p) => ({
        url: `${baseUrl}/produit/${p.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
