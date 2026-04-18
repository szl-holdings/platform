import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Research from "./pages/Research";
import Memory from "./pages/Memory";
import Skills from "./pages/Skills";
import PatternAtlas from "./pages/PatternAtlas";
import Bridge from "./pages/Bridge";
import Orchestrator from "./pages/Orchestrator";
import Ingest from "./pages/Ingest";
import DesignSystemPage from "./pages/DesignSystemPage";
import type { Page } from "./lib/types";

const VALID_PAGES: Page[] = [
  "home", "research", "memory", "skills", "patterns",
  "bridge", "orchestrator", "ingest", "design-system",
];

function getInitialPage(): Page {
  const hash = window.location.hash.replace("#", "") as Page;
  return VALID_PAGES.includes(hash) ? hash : "home";
}

export default function App() {
  const [page, setPage] = useState<Page>(getInitialPage);

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash.replace("#", "") as Page;
      if (VALID_PAGES.includes(hash)) setPage(hash);
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  function navigate(p: Page) {
    window.location.hash = p;
    setPage(p);
  }

  return (
    <Layout page={page} navigate={navigate}>
      {page === "home" && <Home navigate={navigate} />}
      {page === "research" && <Research />}
      {page === "memory" && <Memory />}
      {page === "skills" && <Skills />}
      {page === "patterns" && <PatternAtlas />}
      {page === "bridge" && <Bridge />}
      {page === "orchestrator" && <Orchestrator />}
      {page === "ingest" && <Ingest />}
      {page === "design-system" && <DesignSystemPage />}
    </Layout>
  );
}
