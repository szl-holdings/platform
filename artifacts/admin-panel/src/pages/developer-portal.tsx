import { useState } from "react";
import GettingStarted from "./developer/GettingStarted";
import ApiExplorer from "./developer/ApiExplorer";
import ApiKeys from "./developer/ApiKeys";
import Webhooks from "./developer/Webhooks";
import RateLimits from "./developer/RateLimits";
import SdkGuide from "./developer/SdkGuide";
import PluginDocs from "./developer/PluginDocs";
import { ArrowLeft, BookOpen, Code2, Key, Webhook, Shield, Zap, Puzzle } from "lucide-react";

const PAGES = [
  { id: "getting-started", label: "Getting Started", icon: BookOpen },
  { id: "explorer", label: "API Explorer", icon: Code2 },
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "rate-limits", label: "Rate Limits", icon: Shield },
  { id: "sdk", label: "SDK Guide", icon: Zap },
  { id: "plugins", label: "Plugins", icon: Puzzle },
];

export default function DeveloperPortal() {
  const [currentPage, setCurrentPage] = useState("getting-started");

  const renderPage = () => {
    switch (currentPage) {
      case "getting-started":
        return <GettingStarted onNavigate={setCurrentPage} />;
      case "explorer":
        return <ApiExplorer />;
      case "api-keys":
        return <ApiKeys />;
      case "webhooks":
        return <Webhooks />;
      case "rate-limits":
        return <RateLimits />;
      case "sdk":
        return <SdkGuide />;
      case "plugins":
        return <PluginDocs />;
      default:
        return <GettingStarted onNavigate={setCurrentPage} />;
    }
  };

  const activePage = PAGES.find(p => p.id === currentPage);

  return (
    <div className="dev-portal-scope">
      <div className="flex items-center gap-3 mb-6">
        {currentPage !== "getting-started" && (
          <button
            onClick={() => setCurrentPage("getting-started")}
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h2 className="text-lg font-semibold text-foreground">Developer Portal</h2>
          {activePage && currentPage !== "getting-started" && (
            <p className="text-xs text-muted-foreground">{activePage.label}</p>
          )}
        </div>
      </div>

      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {PAGES.map((page) => {
          const Icon = page.icon;
          const isActive = currentPage === page.id;
          return (
            <button
              key={page.id}
              onClick={() => setCurrentPage(page.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-3 h-3" />
              {page.label}
            </button>
          );
        })}
      </div>

      {renderPage()}
    </div>
  );
}
