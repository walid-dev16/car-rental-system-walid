import Navbar from "../components/home/Navbar.jsx";
import HeroSection from "../components/home/HeroSection.jsx";
import FeaturedCars from "../components/home/FeaturedCars.jsx";
import WhyChooseUs from "../components/home/WhyChooseUs.jsx";
import Footer from "../components/home/Footer.jsx";
import LuxuryShowcase from "../components/home/LuxuryShowcase.jsx";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <HeroSection />
        <LuxuryShowcase />
      <FeaturedCars />
      <WhyChooseUs />
      <Footer />
    </div>
  );
}