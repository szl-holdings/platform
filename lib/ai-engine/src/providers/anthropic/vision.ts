/**
 * Anthropic Vision Input Plumbing
 *
 * Helpers for building vision content blocks that can be passed to the
 * Anthropic Messages API. Supports base64-encoded images and URL-referenced
 * images. All Claude models except legacy Haiku 3.0 accept vision input.
 *
 * Usage:
 *   import { buildImageBlock, buildVisionMessage } from './vision.js';
 *   const block = buildImageBlock({ type: 'base64', data: '...', mediaType: 'image/png' });
 *   const messages = buildVisionMessage('Describe this chart', [block]);
 */

export type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

export interface Base64ImageSource {
  type: 'base64';
  data: string;
  mediaType: ImageMediaType;
}

export interface UrlImageSource {
  type: 'url';
  url: string;
}

export type ImageSource = Base64ImageSource | UrlImageSource;

export interface ImageContentBlock {
  type: 'image';
  source: {
    type: 'base64';
    media_type: ImageMediaType;
    data: string;
  } | {
    type: 'url';
    url: string;
  };
}

export interface TextContentBlock {
  type: 'text';
  text: string;
}

export type VisionContentBlock = ImageContentBlock | TextContentBlock;

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_MEDIA_TYPES = new Set<string>(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

export function validateImageSource(source: ImageSource): void {
  if (source.type === 'base64') {
    if (!SUPPORTED_MEDIA_TYPES.has(source.mediaType)) {
      throw new Error(`Unsupported image media type: ${source.mediaType}. Supported: ${[...SUPPORTED_MEDIA_TYPES].join(', ')}`);
    }
    const sizeBytes = Math.ceil((source.data.length * 3) / 4);
    if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
      throw new Error(`Image too large: ~${Math.ceil(sizeBytes / 1024 / 1024)}MB. Maximum is 5MB.`);
    }
  } else if (source.type === 'url') {
    try {
      new URL(source.url);
    } catch {
      throw new Error(`Invalid image URL: ${source.url}`);
    }
  }
}

export function buildImageBlock(source: ImageSource): ImageContentBlock {
  validateImageSource(source);
  if (source.type === 'base64') {
    return {
      type: 'image',
      source: {
        type: 'base64',
        media_type: source.mediaType,
        data: source.data,
      },
    };
  }
  return {
    type: 'image',
    source: {
      type: 'url',
      url: source.url,
    },
  };
}

export function buildTextBlock(text: string): TextContentBlock {
  return { type: 'text', text };
}

export function buildVisionMessage(
  textPrompt: string,
  images: ImageSource[],
): Array<VisionContentBlock> {
  const blocks: VisionContentBlock[] = [];
  for (const img of images) {
    blocks.push(buildImageBlock(img));
  }
  blocks.push(buildTextBlock(textPrompt));
  return blocks;
}

export async function imageUrlToBase64(
  url: string,
  mediaType: ImageMediaType,
): Promise<Base64ImageSource> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from URL: ${response.status} ${url}`);
  }
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return { type: 'base64', data: base64, mediaType };
}

export function estimateImageTokens(source: ImageSource): number {
  if (source.type === 'base64') {
    const bytes = Math.ceil((source.data.length * 3) / 4);
    return Math.min(Math.ceil(bytes / 100), 1500);
  }
  return 750;
}
