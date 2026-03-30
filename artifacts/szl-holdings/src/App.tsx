import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { LazyMotion, domAnimation } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Portfolio } from "@/components/Portfolio";
import { Timeline } from "@/components/Timeline";
import { Pillars } from "@/components/Pillars";
import { Leadership } from "@/components/Leadership";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

const ObservabilityPage = lazy(() => import("@/pages/observability"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function HomePage() {
  return (
    <div className="min-h-screen bg-szl-bg">
      <Navbar />
      <Hero />
      <Portfolio />
      <Pillars />
      <Timeline />
      <Leadership />
      <Contact />
      <Footer />
    </div>
  );
}

function App() {
  return (
    <LazyMotion features={domAnimation} strict>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/observability">
            <Suspense fallback={<PageLoader />}>
              <ObservabilityPage />
            </Suspense>
          </Route>
          <Route component={HomePage} />
        </Switch>
      </WouterRouter>
    </LazyMotion>
  );
}

export default App;
