import { Switch, Route, Router as WouterRouter } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Constellation } from "@/components/Constellation";
import { Portfolio } from "@/components/Portfolio";
import { Timeline } from "@/components/Timeline";
import { Pillars } from "@/components/Pillars";
import { Leadership } from "@/components/Leadership";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import ObservabilityPage from "@/pages/observability";

function HomePage() {
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

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/observability" component={ObservabilityPage} />
        <Route component={HomePage} />
      </Switch>
    </WouterRouter>
  );
}

export default App;
