import { getProducts } from "@/lib/data/products";
import BoutiqueClient from "@/components/BoutiqueClient";
import type { Metadata } from "next";

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

  const validCats = ["sneakers", "vetements", "accessoires"];
  const cat = params.cat && validCats.includes(params.cat) ? params.cat : null;

  return (
    <BoutiqueClient
      products={list}
      initialCategory={cat}
      heading={onlyNew ? "NOUVEAUTÉS" : query ? `RÉSULTATS : « ${params.q} »` : "BOUTIQUE"}
    />
  );
}
