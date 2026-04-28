import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const API = import.meta.env.VITE_API_URL ?? "";

export default function SupportCsatPage() {
  const params = new URLSearchParams(window.location.search);
  const ticketId = params.get("ticketId");
  const ref = params.get("ref");
  const preRating = parseInt(params.get("rating") ?? "0", 10);

  const [rating, setRating] = useState<number>(preRating >= 1 && preRating <= 5 ? preRating : 0);
  const [hover, setHover] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ticketId || !ref) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p className="text-red-400">Invalid survey link. Please contact support directly.</p>
      </div>
    );
  }

  async function handleSubmit() {
    if (!rating) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/support/tickets/${ticketId}/csat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined, ref }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setError(data.error ?? "Failed to submit. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 max-w-md px-6"
        >
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
          <h1 className="text-2xl font-bold">Thank you!</h1>
          <p className="text-gray-400">
            Your feedback helps us continuously improve. We appreciate you taking the time to rate your experience.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6 bg-gray-900 border border-gray-800 rounded-2xl p-8"
      >
        <div className="space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-widest">Support Survey</p>
          <h1 className="text-xl font-bold">How did we do?</h1>
          <p className="text-sm text-gray-400">Ticket {ref}</p>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-3">Rate your support experience</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setRating(s)}
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                className="transition-transform hover:scale-110 focus:outline-none"
                aria-label={`${s} star${s !== 1 ? "s" : ""}`}
              >
                <Star
                  className="w-9 h-9"
                  fill={(hover || rating) >= s ? "#f59e0b" : "transparent"}
                  stroke={(hover || rating) >= s ? "#f59e0b" : "#6b7280"}
                />
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1 px-1">
            <span>Poor</span>
            <span>Excellent</span>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-2 block">Additional comments (optional)</label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more about your experience..."
            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 resize-none"
            rows={3}
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <Button
          onClick={handleSubmit}
          disabled={!rating || submitting}
          className="w-full"
        >
          {submitting ? "Submitting…" : "Submit Rating"}
        </Button>
      </motion.div>
    </div>
  );
}
