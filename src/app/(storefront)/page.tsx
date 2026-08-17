import HeroSection from "@/components/HeroSection";
import TrustBadges from "@/components/TrustBadges";
import NewArrivals from "@/components/NewArrivals";
import CategoryBanners from "@/components/CategoryBanners";
import BestSellers from "@/components/BestSellers";
import { getProducts } from "@/lib/data/products";

export default async function HomePage() {
  const products = await getProducts();

  return (
    <>
      <HeroSection />
      <TrustBadges />
      <NewArrivals products={products} />
      <CategoryBanners />
      <BestSellers products={products} />
    </>
  );
}
