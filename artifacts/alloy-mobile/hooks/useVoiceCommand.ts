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

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: { transcript: string; confidence: number };
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  readonly error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognitionInstance;
}

type SpeechRecognitionAPI = SpeechRecognitionConstructor | undefined;

export function useVoiceCommand({ appName = "Alloy", onResult, onError }: UseVoiceCommandOptions = {}) {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isNative = Platform.OS === "ios" || Platform.OS === "android";

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

    if (isNative) {
      setState("listening");
      onError?.("__native_keyboard_voice__");
      setTimeout(() => setState("idle"), 300);
      return;
    }

    setState("listening");

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const w = window as Window & {
        SpeechRecognition?: SpeechRecognitionAPI;
        webkitSpeechRecognition?: SpeechRecognitionAPI;
      };
      const SpeechRecognitionCtor: SpeechRecognitionAPI = w.SpeechRecognition ?? w.webkitSpeechRecognition;

      if (!SpeechRecognitionCtor) {
        setState("error");
        onError?.("Speech recognition not supported in this browser");
        return;
      }

      const recognition = new SpeechRecognitionCtor();
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
        setState("idle");
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
      setState("idle");
      onError?.(`Voice input is not available on this platform.`);
    }
  }, [state, stopListening, isNative, appName, onResult, onError]);

  return {
    state,
    transcript,
    isListening: state === "listening",
    isProcessing: state === "processing",
    isNative,
    startListening,
    stopListening,
  };
}
