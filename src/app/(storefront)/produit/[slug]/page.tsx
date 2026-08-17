import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getProductBySlug, getProducts } from "@/lib/data/products";
import { getApprovedReviews, averageRating } from "@/lib/data/reviews";
import ProductDetailClient from "@/components/ProductDetailClient";
import ProductReviews from "@/components/ProductReviews";
import ProductCard from "@/components/ProductCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produit introuvable" };
  return {
    title: `${product.name} — ${product.variant}`,
    description: product.description ?? `${product.name} ${product.variant} disponible chez TDSSNEAKERS.`,
    openGraph: {
      title: `${product.name} — ${product.variant}`,
      images: [product.image],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [all, productReviews] = await Promise.all([
    getProducts(),
    getApprovedReviews(product.id),
  ]);
  const related = all
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-primary">Accueil</Link>
        <span>/</span>
        <Link href="/boutique" className="hover:text-primary">Boutique</Link>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <ProductDetailClient product={product} />

      <ProductReviews
        productId={product.id}
        reviews={productReviews}
        average={averageRating(productReviews)}
      />

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-black text-gray-900 mb-6">Vous aimerez aussi</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
