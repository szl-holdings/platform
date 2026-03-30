import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="text-center">
        <p className="text-6xl font-display font-extrabold gradient-text mb-4">404</p>
        <p className="text-lg text-muted-foreground mb-6">Page not found</p>
        <a href={import.meta.env.BASE_URL} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </a>
      </div>
    </div>
  );
}
