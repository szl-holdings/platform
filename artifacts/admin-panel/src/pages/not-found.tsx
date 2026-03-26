import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center h-full animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-4 p-8 max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Page Not Found</h1>
          <p className="text-sm text-muted-foreground mt-2">The page you're looking for doesn't exist or has been moved.</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
