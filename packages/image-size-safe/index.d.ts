export interface ImageDimensions {
  width: number;
  height: number;
  type?: string;
}

export type ImageSizeCallback = (error: Error | null, dimensions?: ImageDimensions) => void;

declare function imageSize(input: Uint8Array | string): ImageDimensions;
declare function imageSize(input: string, callback: ImageSizeCallback): void;

export { imageSize };
export default imageSize;
export function disableFS(disabled: boolean): void;
export function disableTypes(types: string[]): void;
export function setConcurrency(concurrency: number): void;
export const types: string[];
