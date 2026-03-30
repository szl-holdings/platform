import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Approach from "@/components/Approach";
import Proof from "@/components/Proof";
import About from "@/components/About";
import InquiryForm from "@/components/InquiryForm";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#07090d]">
      <Hero />
      <Services />
      <Approach />
      <Proof />
      <About />
      <InquiryForm />
      <Footer />
    </div>
  );
}
