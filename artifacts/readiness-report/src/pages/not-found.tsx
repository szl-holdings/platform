import { Shell } from "@/components/layout/shell";
import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <Shell>
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-4xl font-display font-bold text-white mb-2">404 - Page Not Found</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          The requested reporting view could not be located. It may have been moved or you might lack the required clearance.
        </p>
        <Link href="/">
          <div className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-primary/20 cursor-pointer">
            Return to Dashboard
          </div>
        </Link>
      </div>
    </Shell>
  );
}
