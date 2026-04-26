import { Router } from 'express';
import { Buffer } from 'node:buffer';

const router = Router();

const SUPPORTED_LANGUAGE_CODES = ['en', 'es', 'zh', 'ar', 'fr'];

router.get('/voice/languages', async (_req, res) => {
  try {
    const { getSupportedLanguages } = await import(
      '@szl-holdings/ai-engine/providers/openai/audio/multilingual'
    );
    res.json({ languages: getSupportedLanguages() });
  } catch {
    res.json({
      languages: [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'es', name: 'Spanish', nativeName: 'Espanol' },
        { code: 'zh', name: 'Mandarin Chinese', nativeName: '\u4e2d\u6587' },
        { code: 'ar', name: 'Arabic', nativeName: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' },
        { code: 'fr', name: 'French', nativeName: 'Francais' },
      ],
    });
  }
});

router.post('/voice/detect-language', async (req, res) => {
  try {
    if (typeof req.body.audio !== 'string' || !req.body.audio.trim()) {
      res.status(400).json({ error: '"audio" is required and must be a base64-encoded string' });
      return;
    }

    const { detectLanguage } = await import(
      '@szl-holdings/ai-engine/providers/openai/audio/multilingual'
    );
    const audioBuffer = Buffer.from(req.body.audio, 'base64');
    const result = await detectLanguage(audioBuffer);
    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Language detection failed',
    });
  }
});

router.post('/voice/transcribe', async (req, res) => {
  try {
    if (typeof req.body.audio !== 'string' || !req.body.audio.trim()) {
      res.status(400).json({ error: '"audio" is required and must be a base64-encoded string' });
      return;
    }
    if (req.body.language && !SUPPORTED_LANGUAGE_CODES.includes(req.body.language)) {
      res.status(400).json({ error: `"language" must be one of: ${SUPPORTED_LANGUAGE_CODES.join(', ')}` });
      return;
    }

    const { transcribeMultilingual } = await import(
      '@szl-holdings/ai-engine/providers/openai/audio/multilingual'
    );
    const audioBuffer = Buffer.from(req.body.audio, 'base64');
    const result = await transcribeMultilingual(audioBuffer, req.body.language);
    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Transcription failed',
    });
  }
});

router.post('/voice/synthesize', async (req, res) => {
  try {
    if (typeof req.body.text !== 'string' || !req.body.text.trim()) {
      res.status(400).json({ error: '"text" is required and must be a non-empty string' });
      return;
    }
    if (req.body.language && !SUPPORTED_LANGUAGE_CODES.includes(req.body.language)) {
      res.status(400).json({ error: `"language" must be one of: ${SUPPORTED_LANGUAGE_CODES.join(', ')}` });
      return;
    }

    const { synthesizeSpeech } = await import(
      '@szl-holdings/ai-engine/providers/openai/audio/multilingual'
    );
    const result = await synthesizeSpeech(req.body.text, req.body.language, {
      voice: req.body.voice,
      format: req.body.format,
    });
    res.json({
      audio: result.audioBuffer.toString('base64'),
      language: result.language,
      voice: result.voice,
      durationMs: result.durationMs,
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Speech synthesis failed',
    });
  }
});

router.post('/voice/chat', async (req, res) => {
  try {
    if (typeof req.body.audio !== 'string' || !req.body.audio.trim()) {
      res.status(400).json({ error: '"audio" is required and must be a base64-encoded string' });
      return;
    }
    if (req.body.language && !SUPPORTED_LANGUAGE_CODES.includes(req.body.language)) {
      res.status(400).json({ error: `"language" must be one of: ${SUPPORTED_LANGUAGE_CODES.join(', ')}` });
      return;
    }

    const { multilingualVoiceChat } = await import(
      '@szl-holdings/ai-engine/providers/openai/audio/multilingual'
    );
    const audioBuffer = Buffer.from(req.body.audio, 'base64');
    const result = await multilingualVoiceChat(audioBuffer, {
      language: req.body.language,
      autoDetect: req.body.autoDetect ?? true,
      voice: req.body.voice,
      systemPrompt: req.body.systemPrompt,
    });
    res.json({
      inputTranscript: result.inputTranscript,
      responseText: result.responseText,
      audioResponse: result.audioResponse.toString('base64'),
      detectedLanguage: result.detectedLanguage,
      durationMs: result.durationMs,
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Voice chat failed',
    });
  }
});

export default router;
