import { FeaturedEquipment } from "./FeaturedEquipment";
import { HeroSection } from "./HeroSection";
import { ProfessionalServices } from "./ProfessionalServices";
import { ShopCategories } from "./ShopCategories";
import { Testimonials } from "./Testimonials";
import { TrainerBanner } from "./TrainerBanner";
import { TrustBenefits } from "./TrustBenefits";

export function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustBenefits />
      <FeaturedEquipment />
      <ShopCategories />
      <ProfessionalServices />
      <TrainerBanner />
      <Testimonials />
    </>
  );
}
