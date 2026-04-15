import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router as WouterRouter, Switch, Route } from "wouter";
import { Dashboard } from "./pages/dashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 30_000, retry: 1 },
  },
});

const BASE = import.meta.env.BASE_URL;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={BASE.replace(/\/$/, "")}>
        <Switch>
          <Route path="/" component={Dashboard} />
        </Switch>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
