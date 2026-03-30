import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProductsSection from "@/components/ProductsSection";
import AwardsSection from "@/components/AwardsSection";
import WorldOfHealthSection from "@/components/WorldOfHealthSection";
import TestimonialSection from "@/components/TestimonialSection";
import BestSellingSection from "@/components/BestSellingSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ProductsSection />
      <AwardsSection />
      <WorldOfHealthSection />
      <TestimonialSection />
      <BestSellingSection />
      <Footer />
    </div>
  );
};

export default Index;
