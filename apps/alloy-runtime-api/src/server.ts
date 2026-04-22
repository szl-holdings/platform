/**
 * AEEP Alloy Runtime API — Server Entry Point
 *
 * Unified v1 API surface for task planning, memory fabric,
 * and governed workflow execution.
 */
import express, { type Express } from 'express';
import { createRouter } from './router.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4010;

const app: Express = express();

app.use(express.json({ limit: '4mb' }));

app.use(createRouter());

app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
});

export { app };
