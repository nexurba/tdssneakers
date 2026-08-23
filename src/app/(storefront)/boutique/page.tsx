import { getProducts } from "@/lib/data/products";
import BoutiqueClient from "@/components/BoutiqueClient";
import type { Metadata } from "next";

/** Valid ?cat= values mapped to the page heading shown for each. */
const CATEGORY_HEADINGS: Record<string, string> = {
  sneakers: "SNEAKERS",
  vetements: "VÊTEMENTS",
  accessoires: "ACCESSOIRES",
};

export const metadata: Metadata = {
  title: "Boutique",
  description:
    "Tous nos sneakers, vêtements et accessoires. Filtrez par taille, couleur et prix.",
};

export default async function BoutiquePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; new?: string; q?: string }>;
}) {
  const params = await searchParams;
  const products = await getProducts();

  const onlyNew = params.new === "true";
  const query = params.q?.trim().toLowerCase() ?? "";

  let list = products;
  if (onlyNew) list = list.filter((p) => p.isNew);
  if (query) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.variant.toLowerCase().includes(query) ||
        p.color.toLowerCase().includes(query) ||
        (p.brand ?? "").toLowerCase().includes(query)
    );
  }

  const cat =
    params.cat && params.cat in CATEGORY_HEADINGS ? params.cat : null;

  const heading = onlyNew
    ? "NOUVEAUTÉS"
    : query
      ? `RÉSULTATS : « ${params.q} »`
      : cat
        ? CATEGORY_HEADINGS[cat]
        : "BOUTIQUE";

  return (
    <BoutiqueClient
      // BoutiqueClient seeds its filter state from initialCategory with
      // useState, whose initialiser only runs on mount. Navigating between
      // /boutique?cat=... URLs reuses the same instance, so without a changing
      // key the old category (and any stale size/colour boxes in the sidebar)
      // would stick and the new category would appear to do nothing.
      key={`${cat ?? "all"}|${onlyNew ? "new" : ""}|${query}`}
      products={list}
      initialCategory={cat}
      heading={heading}
    />
  );
}
