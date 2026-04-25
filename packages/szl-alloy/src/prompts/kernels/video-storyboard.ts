import type { PromptKernel } from '../types.js';

export const videoStoryboardKernel: PromptKernel = {
  id: 'video-storyboard',
  version: '1.0.0',
  name: 'Video Storyboard',
  description:
    'Converts a brief or script into a scene-by-scene video storyboard with visual direction, voiceover, and production notes — Seedance/Kling/Lovart style.',
  pattern: 'video-storyboard',
  domain: 'content',
  verticals: ['carlota-jo', 'szl-holdings', 'pulse'],
  inspirations: ['Seedance 2.0', 'Kling 3.0', 'Lovart', 'HeyGen'],
  tags: ['video', 'storyboard', 'production', 'content', 'visual'],
  createdAt: '2026-04-25T00:00:00.000Z',
  systemPrompt:
    'You are an expert creative director and video producer. Transform briefs into production-ready storyboards. Think cinematically — describe shots, camera movements, pacing, and visual tone. Each scene should be instantly actionable by a production team or AI video generator.',
  template: `Create a video storyboard for:

Video title: {{title}}
Format: {{format}}
Duration: {{duration}} seconds
Audience: {{audience}}
Brand tone: {{brandTone}}
Key message: {{keyMessage}}
Script or brief: {{brief}}

Return JSON array of scenes, each with:
- sceneNumber
- durationSec
- visualDescription (what is on screen)
- cameraDirection (shot type, movement)
- voiceover (exact words)
- textOverlay (on-screen text if any)
- mood (energetic | calm | dramatic | inspiring)
- productionNote (any special instruction)`,
  modelHints: {
    preferredModel: 'claude-3-5-sonnet',
    maxTokens: 2000,
    temperature: 0.6,
    responseFormat: 'json',
  },
  codex: {
    role: 'Creative director and video producer crafting production-ready storyboards',
    contract:
      'Returns a JSON array of scene objects with visual description, camera direction, voiceover, text overlay, mood, and production notes. Scenes must sum to the target duration.',
    inputSchema: [
      {
        name: 'title',
        type: 'string',
        description: 'Video title',
        required: true,
        example: 'Terra — The Future of Real Estate Intelligence',
      },
      {
        name: 'format',
        type: 'string',
        description: 'Video format: explainer | testimonial | ad | demo | brand',
        required: true,
        example: 'brand',
      },
      {
        name: 'duration',
        type: 'number',
        description: 'Total target duration in seconds',
        required: true,
        example: 60,
      },
      {
        name: 'audience',
        type: 'string',
        description: 'Target audience',
        required: true,
        example: 'CRE investors and family offices',
      },
      {
        name: 'brandTone',
        type: 'string',
        description: 'Brand tone descriptors',
        required: false,
        example: 'sophisticated, data-driven, aspirational',
      },
      {
        name: 'keyMessage',
        type: 'string',
        description: 'The one thing viewers should remember',
        required: true,
        example: 'Terra makes every property decision intelligent and defensible',
      },
      {
        name: 'brief',
        type: 'string',
        description: 'Source brief, script, or talking points',
        required: true,
        example: 'Show how Terra surfaces hidden value in CRE portfolios using AI...',
      },
    ],
    outputSchema: [
      { name: 'scenes', type: 'array', description: 'Array of scene objects' },
      { name: 'totalDurationSec', type: 'number', description: 'Total planned duration' },
      { name: 'productionSummary', type: 'string', description: 'Overall production direction note' },
    ],
    evidenceRequirements: [
      {
        kind: 'document',
        label: 'Brief or script',
        required: true,
        minCount: 1,
        description: 'Brief or script content must be provided',
      },
    ],
    refusalPolicy: {
      triggers: [
        'request for violent or graphic content',
        'request to depict real individuals without consent flag',
        'brief is under 20 words',
      ],
      refusalMessage:
        'Cannot create a storyboard without sufficient brief content (minimum 20 words). All real persons depicted must have a consent flag set.',
      logLevel: 'warn',
    },
    evaluationRubric: [
      {
        id: 'scene-structure',
        label: 'Scene Structure',
        weight: 0.35,
        passingThreshold: 1.0,
        description: 'Each scene has all required fields',
        keywords: ['visualDescription', 'cameraDirection', 'voiceover', 'mood'],
      },
      {
        id: 'duration-match',
        label: 'Duration Match',
        weight: 0.3,
        passingThreshold: 0.9,
        description: 'Scene durations sum to within 10% of target',
        keywords: ['durationSec', 'total'],
      },
      {
        id: 'visual-specificity',
        label: 'Visual Specificity',
        weight: 0.35,
        passingThreshold: 0.7,
        description: 'Visual descriptions are specific enough for immediate production',
        keywords: ['close-up', 'wide shot', 'aerial', 'tracking', 'fade', 'cut'],
      },
    ],
    examples: [
      {
        id: 'ex-001',
        description: '30-second brand video storyboard',
        input: {
          title: 'Terra Intelligence',
          format: 'brand',
          duration: 30,
          audience: 'CRE investors',
          brandTone: 'sophisticated, data-driven',
          keyMessage: 'Every property decision, made intelligent',
          brief: 'Show Terra\'s AI surfacing hidden value in a commercial real estate portfolio.',
        },
        output: JSON.stringify(
          {
            scenes: [
              {
                sceneNumber: 1,
                durationSec: 8,
                visualDescription:
                  'Aerial drone shot of a Sunbelt skyline at golden hour, panning slowly right',
                cameraDirection: 'Drone aerial, slow pan right, 4K',
                voiceover: 'Every great portfolio hides its true potential.',
                textOverlay: null,
                mood: 'inspiring',
                productionNote: 'License-free aerial stock or AI-generate with Kling 3.0',
              },
              {
                sceneNumber: 2,
                durationSec: 12,
                visualDescription:
                  'Screen recording of Terra dashboard with AI overlaying property scores',
                cameraDirection: 'Screen capture, subtle zoom in on key metric',
                voiceover: 'Terra surfaces what the data has been hiding.',
                textOverlay: 'AI-Powered Property Intelligence',
                mood: 'calm',
                productionNote: 'Use live product demo screen; add subtle particle overlay',
              },
              {
                sceneNumber: 3,
                durationSec: 10,
                visualDescription:
                  'Executive reviewing dashboard on tablet, confident expression, modern office',
                cameraDirection: 'Medium shot, slight rack focus to tablet screen',
                voiceover: 'Make every decision intelligent. Every decision defensible.',
                textOverlay: 'Terra',
                mood: 'dramatic',
                productionNote: 'HeyGen avatar or real talent; tablet should show product',
              },
            ],
            totalDurationSec: 30,
            productionSummary:
              'Open with aspirational aerial, pivot to product proof, close with executive authority. Sophisticated color grading throughout.',
          },
          null,
          2,
        ),
      },
    ],
  },
};
