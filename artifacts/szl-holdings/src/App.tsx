import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { LazyMotion, domMax } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Portfolio } from "@/components/Portfolio";
import { Leadership } from "@/components/Leadership";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

const ObservabilityPage = lazy(() => import("@/pages/observability"));
const EcosystemViz = lazy(() => import("@/pages/ecosystem-viz"));
const MATracker = lazy(() => import("@/pages/ma-tracker"));
const PortfolioIntel = lazy(() => import("@/pages/portfolio-intel"));
const VenturesThesis = lazy(() => import("@/pages/ventures-thesis"));
const Newsroom = lazy(() => import("@/pages/newsroom"));
const InvestorRelations = lazy(() => import("@/pages/investor-relations"));

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
      <Leadership />
      <Contact />
      <Footer />
    </div>
  );
}

function App() {
  return (
    <LazyMotion features={domMax} strict>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/observability">
            <Suspense fallback={<PageLoader />}>
              <ObservabilityPage />
            </Suspense>
          </Route>
          <Route path="/ecosystem">
            <Suspense fallback={<PageLoader />}>
              <EcosystemViz />
            </Suspense>
          </Route>
          <Route path="/ma-tracker">
            <Suspense fallback={<PageLoader />}>
              <MATracker />
            </Suspense>
          </Route>
          <Route path="/portfolio">
            <Suspense fallback={<PageLoader />}>
              <PortfolioIntel />
            </Suspense>
          </Route>
          <Route path="/thesis">
            <Suspense fallback={<PageLoader />}>
              <VenturesThesis />
            </Suspense>
          </Route>
          <Route path="/newsroom">
            <Suspense fallback={<PageLoader />}>
              <Newsroom />
            </Suspense>
          </Route>
          <Route path="/ir">
            <Suspense fallback={<PageLoader />}>
              <InvestorRelations />
            </Suspense>
          </Route>
          <Route component={HomePage} />
        </Switch>
      </WouterRouter>
    </LazyMotion>
  );
}

export default App;
