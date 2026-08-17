import { getProducts } from "@/lib/data/products";
import { isDbConfigured } from "@/db";
import ProductsManager from "./ProductsManager";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getProducts({ includeInactive: true });
  return <ProductsManager initialProducts={products} dbConfigured={isDbConfigured} />;
}
