import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Shell } from "@/components/Shell";
import Identity from "@/pages/Identity";
import Optimizer from "@/pages/Optimizer";
import Fabric from "@/pages/Fabric";
import Research from "@/pages/Research";
import Proof from "@/pages/Proof";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5_000, refetchOnWindowFocus: false } },
});

function NotFound() {
  return (
    <div className="rounded-lg border border-border bg-card p-10 text-center">
      <div className="text-3xl font-semibold">404</div>
      <div className="text-sm text-muted-foreground mt-2">
        That page is not part of the fabric.
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Shell>
          <Switch>
            <Route path="/" component={Identity} />
            <Route path="/optimizer" component={Optimizer} />
            <Route path="/fabric" component={Fabric} />
            <Route path="/research" component={Research} />
            <Route path="/proof" component={Proof} />
            <Route component={NotFound} />
          </Switch>
        </Shell>
      </WouterRouter>
    </QueryClientProvider>
  );
}
