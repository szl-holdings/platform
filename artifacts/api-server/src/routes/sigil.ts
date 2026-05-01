/**
 * SIGIL · Public API surface (SZL Holdings, 2026)
 *
 *   GET  /api/sigil/health  → returns the framework header + default weights
 *   POST /api/sigil/compose → body { axes } → Σ report (closed-form)
 *   POST /api/sigil/witness → body { views, minWitnesses? } → convergence report
 *   POST /api/sigil/coherence → body { samples } → phase-coherence report
 *   POST /api/sigil/saturation → body { dx, dy, cap? } → containment reading
 */

import type { IRouter } from 'express';
import { z } from 'zod';
import { sendError } from '../lib/api-response.js';
import {
	defaultWeights,
	sigma,
	reconcile,
	coherence,
	reading,
	containmentAxis,
	convergenceAxis,
	coherenceAxis,
	type SigilAxes,
} from '../lib/sigil/index.js';

const axisSchema = z.number().min(0).max(1);

const composeSchema = z.object({
	axes: z.object({
		provenance: axisSchema,
		containment: axisSchema,
		coherence: axisSchema,
		convergence: axisSchema,
	}),
});

const witnessSchema = z.object({
	minWitnesses: z.number().int().min(2).max(16).optional(),
	views: z
		.array(
			z.object({
				id: z.string().min(1).max(64),
				leaves: z.array(z.string().min(1).max(256)).max(2048),
				source: z.string().max(64).optional(),
			}),
		)
		.min(1)
		.max(16),
});

const coherenceSchema = z.object({
	samples: z
		.array(
			z.object({
				agentId: z.string().min(1).max(64),
				thetaRadians: z.number(),
			}),
		)
		.min(1)
		.max(2048),
});

const saturationSchema = z.object({
	dx: z.number().min(0),
	dy: z.number().min(0),
	cap: z.number().int().min(1).max(64).optional(),
});

export function register(router: IRouter): void {
	router.get('/sigil/health', (_req, res) => {
		const w = defaultWeights();
		res.json({
			framework: 'SIGIL — SZL Integrated Governance & Invariant Layer',
			version: '1.0.0',
			axes: ['provenance', 'containment', 'coherence', 'convergence'],
			defaultWeights: {
				provenance: { terms: w.provenance.terms, value: w.provenance.value },
				containment: { terms: w.containment.terms, value: w.containment.value },
				coherence: { terms: w.coherence.terms, value: w.coherence.value },
				convergence: { terms: w.convergence.terms, value: w.convergence.value },
			},
			law: 'Σ = ∏ axisᵢ^wᵢ · weights ∈ rational unit-fractions summing to 1',
		});
	});

	router.post('/sigil/compose', (req, res) => {
		const parsed = composeSchema.safeParse(req.body);
		if (!parsed.success) {
			sendError(res, 'Invalid axes payload', 400, 'VALIDATION_ERROR');
			return;
		}
		try {
			const report = sigma(parsed.data.axes as SigilAxes);
			res.json(report);
		} catch (e) {
			sendError(res, (e as Error).message, 400, 'SIGIL_LAW_VIOLATION');
		}
	});

	router.post('/sigil/witness', (req, res) => {
		const parsed = witnessSchema.safeParse(req.body);
		if (!parsed.success) {
			sendError(res, 'Invalid witness payload', 400, 'VALIDATION_ERROR');
			return;
		}
		const report = reconcile(parsed.data.views, parsed.data.minWitnesses ?? 3);
		res.json({ report, axisValue: convergenceAxis(report) });
	});

	router.post('/sigil/coherence', (req, res) => {
		const parsed = coherenceSchema.safeParse(req.body);
		if (!parsed.success) {
			sendError(res, 'Invalid coherence payload', 400, 'VALIDATION_ERROR');
			return;
		}
		const report = coherence(parsed.data.samples);
		res.json({ report, axisValue: coherenceAxis(report) });
	});

	router.post('/sigil/saturation', (req, res) => {
		const parsed = saturationSchema.safeParse(req.body);
		if (!parsed.success) {
			sendError(res, 'Invalid saturation payload', 400, 'VALIDATION_ERROR');
			return;
		}
		const report = reading(parsed.data.dx, parsed.data.dy, parsed.data.cap);
		res.json({ report, axisValue: containmentAxis(report) });
	});
}
