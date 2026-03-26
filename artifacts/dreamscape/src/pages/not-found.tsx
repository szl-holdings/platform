import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-6 max-w-md p-6 glass-panel rounded-2xl">
        <AlertCircle className="w-16 h-16 text-primary mx-auto opacity-80" />
        <h1 className="text-4xl font-display font-bold">404</h1>
        <p className="text-lg text-muted-foreground">
          The creative asset or campaign you are looking for does not exist or has been archived.
        </p>
        <Link href="/">
          <Button size="lg" className="mt-4">
            Return to Workspace
          </Button>
        </Link>
      </div>
    </div>
  );
}
