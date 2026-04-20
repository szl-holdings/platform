import { ToolConnector } from '../framework.js';
import type { AuthConfig, Capability, ConnectorCategory } from '../types.js';

export class FalAiConnector extends ToolConnector {
  readonly id = 'fal-ai';
  readonly name = 'Fal.ai';
  readonly description =
    'Fal.ai — serverless GPU media generation: image synthesis (FLUX, SDXL), video generation, image editing, upscaling, and background removal';
  readonly category: ConnectorCategory = 'ai_media';
  readonly version = '1.0.0';

  readonly authConfig: AuthConfig = {
    scheme: 'api_key',
    requiredEnvVars: ['FAL_API_KEY'],
    description: 'API key from fal.ai/dashboard/keys',
  };

  readonly capabilities: Capability[] = [
    {
      id: 'generate_image',
      name: 'Generate Image',
      description: 'Generate an image from a text prompt using FLUX or Stable Diffusion models',
      parameters: [
        { name: 'prompt', type: 'string', description: 'Image description prompt', required: true },
        {
          name: 'model',
          type: 'string',
          description: 'Model: flux/dev, flux/schnell, stable-diffusion-xl (default: flux/schnell)',
          required: false,
        },
        {
          name: 'width',
          type: 'number',
          description: 'Image width in pixels (default 1024)',
          required: false,
        },
        {
          name: 'height',
          type: 'number',
          description: 'Image height in pixels (default 1024)',
          required: false,
        },
        {
          name: 'numImages',
          type: 'number',
          description: 'Number of images to generate (1-4)',
          required: false,
        },
        {
          name: 'negativePrompt',
          type: 'string',
          description: 'Negative prompt to exclude content',
          required: false,
        },
        {
          name: 'seed',
          type: 'number',
          description: 'Random seed for reproducibility',
          required: false,
        },
      ],
      requiresAuth: true,
      tags: ['generate', 'image', 'media'],
      rateLimit: { requestsPerMinute: 20, requestsPerHour: 200 },
    },
    {
      id: 'generate_video',
      name: 'Generate Video',
      description: 'Generate a short video clip from a text or image prompt',
      parameters: [
        { name: 'prompt', type: 'string', description: 'Video description prompt', required: true },
        {
          name: 'model',
          type: 'string',
          description: 'Model: stable-video-diffusion, cogvideox (default: stable-video-diffusion)',
          required: false,
        },
        {
          name: 'imageUrl',
          type: 'string',
          description: 'Starting image URL (for image-to-video)',
          required: false,
        },
        {
          name: 'numFrames',
          type: 'number',
          description: 'Number of frames (default 25)',
          required: false,
        },
        {
          name: 'fps',
          type: 'number',
          description: 'Frames per second (default 8)',
          required: false,
        },
      ],
      requiresAuth: true,
      tags: ['generate', 'video', 'media'],
      rateLimit: { requestsPerMinute: 5, requestsPerHour: 50 },
    },
    {
      id: 'remove_background',
      name: 'Remove Background',
      description: 'Remove the background from an image, returning a transparent PNG',
      parameters: [
        { name: 'imageUrl', type: 'string', description: 'URL of the input image', required: true },
      ],
      requiresAuth: true,
      tags: ['edit', 'image', 'background'],
      rateLimit: { requestsPerMinute: 30 },
    },
    {
      id: 'upscale_image',
      name: 'Upscale Image',
      description: 'Upscale an image using AI super-resolution (4x or 8x)',
      parameters: [
        { name: 'imageUrl', type: 'string', description: 'URL of the input image', required: true },
        {
          name: 'scale',
          type: 'number',
          description: 'Upscale factor: 2, 4, or 8 (default 4)',
          required: false,
        },
        {
          name: 'model',
          type: 'string',
          description: 'Upscaler model: esrgan, swinir (default: esrgan)',
          required: false,
        },
      ],
      requiresAuth: true,
      tags: ['edit', 'image', 'upscale'],
      rateLimit: { requestsPerMinute: 20 },
    },
  ];

  protected async performCapability(
    capabilityId: string,
    params: Record<string, unknown>,
  ): Promise<unknown> {
    const apiKey = process.env['FAL_API_KEY'];
    if (!apiKey) throw new Error('FAL_API_KEY not configured');

    const baseUrl = 'https://fal.run';
    const headers = {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json',
    };

    switch (capabilityId) {
      case 'generate_image': {
        const model = String(params['model'] ?? 'fal-ai/flux/schnell');
        const resp = await fetch(`${baseUrl}/${model}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            prompt: params['prompt'],
            image_size: { width: params['width'] ?? 1024, height: params['height'] ?? 1024 },
            num_images: params['numImages'] ?? 1,
            negative_prompt: params['negativePrompt'],
            seed: params['seed'],
          }),
          signal: AbortSignal.timeout(60_000),
        });
        if (!resp.ok)
          throw new Error(`Fal.ai image generation error ${resp.status}: ${await resp.text()}`);
        return resp.json();
      }
      case 'generate_video': {
        const model = String(params['model'] ?? 'fal-ai/stable-video');
        const resp = await fetch(`${baseUrl}/${model}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            prompt: params['prompt'],
            image_url: params['imageUrl'],
            num_frames: params['numFrames'] ?? 25,
            fps: params['fps'] ?? 8,
          }),
          signal: AbortSignal.timeout(120_000),
        });
        if (!resp.ok)
          throw new Error(`Fal.ai video generation error ${resp.status}: ${await resp.text()}`);
        return resp.json();
      }
      case 'remove_background': {
        const resp = await fetch(`${baseUrl}/fal-ai/birefnet`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ image_url: params['imageUrl'] }),
          signal: AbortSignal.timeout(30_000),
        });
        if (!resp.ok)
          throw new Error(`Fal.ai background removal error ${resp.status}: ${await resp.text()}`);
        return resp.json();
      }
      case 'upscale_image': {
        const model = params['model'] === 'swinir' ? 'fal-ai/swinir' : 'fal-ai/esrgan';
        const resp = await fetch(`${baseUrl}/${model}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ image_url: params['imageUrl'], scale: params['scale'] ?? 4 }),
          signal: AbortSignal.timeout(30_000),
        });
        if (!resp.ok) throw new Error(`Fal.ai upscale error ${resp.status}: ${await resp.text()}`);
        return resp.json();
      }
      default:
        throw new Error(`Unknown capability: ${capabilityId}`);
    }
  }

  protected async performHealthCheck(): Promise<void> {
    const apiKey = process.env['FAL_API_KEY'];
    if (!apiKey) throw new Error('FAL_API_KEY not configured');
    const resp = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: { Authorization: `Key ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'health check',
        num_images: 1,
        image_size: { width: 64, height: 64 },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!resp.ok && resp.status !== 422)
      throw new Error(`Fal.ai health check failed: ${resp.status}`);
  }
}
