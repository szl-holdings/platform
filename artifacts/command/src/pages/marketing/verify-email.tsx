import { MarketingNav } from "../../components/marketing/MarketingNav";
import { MarketingFooter } from "../../components/marketing/MarketingFooter";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@szl-holdings/shared-ui/ui/button";
import { Link } from "wouter";

type VerifyState = "loading" | "success" | "error" | "expired";

export function MarketingVerifyEmail() {
  const [state, setState] = useState<VerifyState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setState("error");
      setErrorMessage("No verification token provided.");
      return;
    }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          if (data.data?.token) {
            sessionStorage.setItem("session_token", data.data.token);
          }
          setState("success");
        } else if (res.status === 410 || data.error?.toLowerCase().includes("expired")) {
          setState("expired");
        } else {
          setState("error");
          setErrorMessage(data.message ?? data.error ?? "Verification failed.");
        }
      })
      .catch(() => {
        setState("error");
        setErrorMessage("Could not connect to the server. Please try again.");
      });
  }, []);

  return (
    <div className="min-h-[100dvh] bg-black text-white font-sans flex flex-col">
      <MarketingNav />

      <main className="flex-1 flex items-center justify-center p-8 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md text-center"
        >
          {state === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
              <h1 className="text-2xl font-bold">Verifying your email...</h1>
              <p className="text-white/50 text-sm">This will only take a moment.</p>
            </div>
          )}

          {state === "success" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold">Email Verified</h1>
              <p className="text-white/50 text-sm">
                Your account is now active. You can proceed to choose a plan or log in.
              </p>
              <div className="flex gap-3 mt-4">
                <Link href="/marketing/signup">
                  <Button className="bg-white text-black hover:bg-white/90">
                    Choose a Plan
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {state === "expired" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-amber-400" />
              </div>
              <h1 className="text-2xl font-bold">Link Expired</h1>
              <p className="text-white/50 text-sm">
                This verification link has expired. Please sign up again to receive a new link.
              </p>
              <Link href="/marketing/signup">
                <Button className="bg-white text-black hover:bg-white/90 mt-4">
                  Sign Up Again
                </Button>
              </Link>
            </div>
          )}

          {state === "error" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold">Verification Failed</h1>
              <p className="text-white/50 text-sm">{errorMessage}</p>
              <Link href="/marketing/signup">
                <Button className="bg-white text-black hover:bg-white/90 mt-4">
                  Back to Sign Up
                </Button>
              </Link>
            </div>
          )}
        </motion.div>
      </main>

      <MarketingFooter />
    </div>
  );
}
