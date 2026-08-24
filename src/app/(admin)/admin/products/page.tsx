import { getProducts } from "@/lib/data/products";
import { isDbConfigured } from "@/db";
import { isBlobConfigured } from "@/lib/storage/blob";
import ProductsManager from "./ProductsManager";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getProducts({ includeInactive: true });
  return (
    <ProductsManager
      initialProducts={products}
      dbConfigured={isDbConfigured}
      // When Blob is configured, images go straight from the browser to storage.
      // Sending them through a Server Action hits the hosted 4.5 MB request body
      // cap, which no application setting can raise.
      blobAvailable={isBlobConfigured()}
    />
  );
}
