import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
      <AlertTriangle className="w-10 h-10 text-muted-foreground mb-4" />
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground mt-2 mb-6">This page doesn't exist in the admin panel.</p>
      <Link href="/" className="text-sm text-primary hover:underline">Back to Dashboard</Link>
    </div>
  );
}
