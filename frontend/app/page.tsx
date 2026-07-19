import Hero from "@/components/Hero";
import FeatureHighlights from "@/components/FeatureHighlights";
import HowItWorks from "@/components/HowItWorks";
import BenefitsBand from "@/components/BenefitsBand";
import Testimonials from "@/components/Testimonials";
import PricingTable from "@/components/PricingTable";
import FAQ from "@/components/FAQ";
import CtaBanner from "@/components/CtaBanner";

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <FeatureHighlights />
      <HowItWorks />
      <BenefitsBand />
      <Testimonials />
      <PricingTable />
      <FAQ />
      <CtaBanner />
    </main>
  );
}
