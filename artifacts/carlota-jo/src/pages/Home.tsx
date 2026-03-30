import Hero from "@/components/Hero";
import Services from "@/components/Services";
import ApproachSection from "@/components/ApproachSection";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#07090d]">
      <Hero />
      <Services />
      <ApproachSection />
      <ContactForm />
      <Footer />
    </div>
  );
}
