declare module "expo-speech" {
  export interface SpeechOptions {
    language?: string;
    pitch?: number;
    rate?: number;
    onStart?: () => void;
    onDone?: () => void;
    onStopped?: () => void;
    onError?: (error: Error) => void;
  }
  export function speak(text: string, options?: SpeechOptions): void;
  export function stop(): void;
  export function pause(): void;
  export function resume(): void;
  export function isSpeakingAsync(): Promise<boolean>;
  export function getAvailableVoicesAsync(): Promise<object[]>;
}
