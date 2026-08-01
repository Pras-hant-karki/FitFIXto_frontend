import { BundleOffersSection } from "./BundleOffersSection";
import { FeaturedEquipment } from "./FeaturedEquipment";
import { FeaturedTrainers } from "./FeaturedTrainers";
import { FlashSaleSection } from "./FlashSaleSection";
import { HeroSection } from "./HeroSection";
import { ProfessionalServices } from "./ProfessionalServices";
import { PromotionalBanner } from "./PromotionalBanner";
import { ShopCategories } from "./ShopCategories";
import { Testimonials } from "./Testimonials";
import { TrainerBanner } from "./TrainerBanner";
import { TrustBenefits } from "./TrustBenefits";

export function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustBenefits />
      <FlashSaleSection />
      <FeaturedEquipment />
      <FeaturedTrainers />
      <ProfessionalServices />
      <TrainerBanner />
      <BundleOffersSection />
      <ShopCategories />
      <PromotionalBanner />
      <Testimonials />
    </>
  );
}
