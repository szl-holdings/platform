import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProjectsPage from "@/pages/projects-page";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { navigatorConfig } from "@workspace/shared-ui/copilot-configs";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProjectsPage />
      <AgentCopilot config={navigatorConfig} />
    </QueryClientProvider>
  );
}

export default App;
