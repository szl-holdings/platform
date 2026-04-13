import { useState, useCallback, useRef } from "react";
import { Platform } from "react-native";

export interface VoiceCommandResult {
  transcript: string;
  confidence: number;
}

export type VoiceState = "idle" | "listening" | "processing" | "error";

interface UseVoiceCommandOptions {
  appName?: string;
  onResult?: (result: VoiceCommandResult) => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export function useVoiceCommand({ appName = "Alloy", onResult, onError }: UseVoiceCommandOptions = {}) {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setState("idle");
  }, []);

  const startListening = useCallback(() => {
    if (state === "listening") {
      stopListening();
      return;
    }

    setTranscript("");
    setState("listening");

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognitionAPI) {
        setState("error");
        onError?.("Speech recognition not supported in this browser");
        return;
      }

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setState("listening");
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.results.length - 1];
        const text = result[0].transcript;
        const confidence = result[0].confidence;
        setTranscript(text);

        if (result.isFinal) {
          setState("processing");
          onResult?.({ transcript: text, confidence });
          setTimeout(() => setState("idle"), 800);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setState("error");
        onError?.(event.error || "Voice recognition error");
        setTimeout(() => setState("idle"), 2000);
      };

      recognition.onend = () => {
        if (state === "listening") setState("idle");
      };

      recognitionRef.current = recognition;
      recognition.start();

      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          setState("idle");
        }
      }, 10000);
    } else {
      setState("listening");
      const demo = [
        `Show me all critical alerts`,
        `What's the status overview`,
        `Open ${appName} command palette`,
        `Show recent activity`,
      ];
      const chosen = demo[Math.floor(Math.random() * demo.length)];

      timeoutRef.current = setTimeout(() => {
        setTranscript(chosen);
        setState("processing");
        onResult?.({ transcript: chosen, confidence: 0.95 });
        setTimeout(() => setState("idle"), 800);
      }, 2000);
    }
  }, [state, stopListening, appName, onResult, onError]);

  return {
    state,
    transcript,
    isListening: state === "listening",
    isProcessing: state === "processing",
    startListening,
    stopListening,
  };
}
