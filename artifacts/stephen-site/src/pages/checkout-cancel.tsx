import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@szl-holdings/shared-ui/ui/button";

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-8">
          <XCircle className="w-10 h-10 text-amber-400" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
          Checkout Canceled
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          No worries — your subscription was not created and you have not been charged. You can subscribe anytime.
        </p>
        <div className="space-y-3">
          <a href={import.meta.env.BASE_URL.replace(/\/$/, "") + "/"}>
            <Button size="lg" className="w-full rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Site
            </Button>
          </a>
          <a href={import.meta.env.BASE_URL.replace(/\/$/, "") + "/#premium"}>
            <Button variant="outline" size="lg" className="w-full rounded-full mt-3">
              Try Again
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
