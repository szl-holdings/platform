import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Constellation } from "@/components/Constellation";
import { Portfolio } from "@/components/Portfolio";
import { Timeline } from "@/components/Timeline";
import { Pillars } from "@/components/Pillars";
import { Leadership } from "@/components/Leadership";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

function App() {
  return (
    <div className="min-h-screen bg-szl-bg">
      <Navbar />
      <Hero />
      <Constellation />
      <Portfolio />
      <Timeline />
      <Pillars />
      <Leadership />
      <Contact />
      <Footer />
    </div>
  );
}

export default App;
