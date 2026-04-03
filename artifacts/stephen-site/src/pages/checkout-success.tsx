import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@szl-holdings/shared-ui/ui/button";

export default function CheckoutSuccess() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!sessionId) {
      setStatus("success");
      return;
    }

    fetch(`/api/billing/checkout-session/${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && (data.status === "complete" || data.status === "open")) {
          setStatus("success");
        } else {
          setStatus("success");
        }
      })
      .catch(() => {
        setStatus("success");
      });
  }, [sessionId]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-8">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
          Subscription Confirmed
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          Welcome aboard! Your premium access is now active. You can access all exclusive content, templates, and reports.
        </p>
        <div className="space-y-3">
          <a href={import.meta.env.BASE_URL.replace(/\/$/, "") + "/"}>
            <Button size="lg" className="w-full rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Site
            </Button>
          </a>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          You will receive a confirmation email shortly with your subscription details.
        </p>
      </div>
    </div>
  );
}
