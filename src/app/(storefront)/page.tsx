import HeroSection from "@/components/HeroSection";
import TrustBadges from "@/components/TrustBadges";
import NewArrivals from "@/components/NewArrivals";
import CategoryBanners from "@/components/CategoryBanners";
import BestSellers from "@/components/BestSellers";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustBadges />
      <NewArrivals />
      <CategoryBanners />
      <BestSellers />
    </>
  );
}
