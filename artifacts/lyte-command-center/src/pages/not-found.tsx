import { ArrowLeft, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-6">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">404</h1>
          <p className="text-base font-semibold text-foreground mb-1">Page not found</p>
          <p className="text-sm text-muted-foreground">
            The command center view you are looking for does not exist or has been moved.
          </p>
        </div>
        <a
          href={import.meta.env.BASE_URL || "/lyte-command-center/"}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Command Center
        </a>
      </div>
    </div>
  );
}
