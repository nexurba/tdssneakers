import { getProducts } from "@/lib/data/products";
import BoutiqueClient from "@/components/BoutiqueClient";

export default async function BoutiquePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const products = await getProducts();
  return <BoutiqueClient products={products} initialCategory={cat ?? null} />;
}
