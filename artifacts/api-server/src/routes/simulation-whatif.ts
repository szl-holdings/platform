import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

const whatIfSchema = z.object({
  variables: z.record(z.number()).optional().default({}),
  iterations: z.number().int().min(100).max(100000).optional().default(10000),
});

interface DomainImpact {
  domain: string;
  icon: string;
  color: string;
  impactLabel: string;
  impactValue: string;
  trend: 'up' | 'down' | 'flat';
  confidence: number;
  details: string;
  affectedEntities: string[];
}

function computeWhatIf(vars: Record<string, number>, _iterations: number): DomainImpact[] {
  const oil = vars['oil-price'] ?? 0;
  const rate = (vars['interest-rate'] ?? 0) / 100;
  const threat = vars['threat-level'] ?? 2;
  const market = vars['market-conditions'] ?? 0;
  const fx = vars['fx-usd'] ?? 0;

  const confBase = (seed: number) => {
    const x = Math.sin(seed + oil * 0.1 + rate * 0.2 + threat * 0.05) * 10000;
    return 0.7 + (x - Math.floor(x)) * 0.25;
  };

  return [
    {
      domain: 'Vessels',
      icon: '⚓',
      color: '#0ea5e9',
      impactLabel: 'Fuel Cost Delta',
      impactValue: oil !== 0 ? `${oil > 0 ? '+' : ''}$${(oil * 0.18).toFixed(1)}M` : 'Neutral',
      trend: oil > 0 ? 'down' : oil < 0 ? 'up' : 'flat',
      confidence: Math.round(confBase(1) * 100) / 100,
      details:
        oil > 5
          ? `Fuel costs rise by ~$${(oil * 0.18).toFixed(1)}M across the fleet. ${Math.floor(oil / 8)} routes become marginally uneconomic. ${threat > 3 ? 'High threat environment increases war-risk premiums.' : ''}`
          : oil < -5
            ? `Fuel savings of $${Math.abs(oil * 0.18).toFixed(1)}M unlock ${Math.floor(Math.abs(oil) / 10) + 1} previously unviable routes.`
            : 'Marginal impact on current operations.',
      affectedEntities: oil !== 0 ? ['MV Poseidon', 'MV Argo', 'MV Triton'] : [],
    },
    {
      domain: 'Terra',
      icon: '⬢',
      color: '#22c55e',
      impactLabel: 'Portfolio Valuation',
      impactValue:
        rate !== 0 || market !== 0
          ? `${rate < 0 || market > 0 ? '+' : ''}${(-rate * 2.1 + market * 0.14).toFixed(1)}%`
          : 'Neutral',
      trend: rate < 0 || market > 0 ? 'up' : rate > 0 || market < 0 ? 'down' : 'flat',
      confidence: Math.round(confBase(2) * 100) / 100,
      details:
        rate !== 0
          ? `Cap rate ${rate > 0 ? 'expansion' : 'compression'} of ${Math.abs(rate * 0.4).toFixed(0)}bps. Industrial properties most ${rate > 0 ? 'exposed' : 'insulated'}.`
          : 'Stable real estate valuation environment.',
      affectedEntities:
        rate !== 0 ? ['Miami Beach Commercial', 'Austin Industrial', 'NYC Mixed-Use'] : [],
    },
    {
      domain: 'SZL Holdings',
      icon: '◆',
      color: '#f59e0b',
      impactLabel: 'NAV Impact',
      impactValue: (() => {
        const delta = -oil * 0.003 + -rate * 0.05 + market * 0.04 + -fx * 0.015;
        return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`;
      })(),
      trend: (() => {
        const delta = -oil * 0.003 + -rate * 0.05 + market * 0.04;
        return delta > 0.2 ? 'up' : delta < -0.2 ? 'down' : 'flat';
      })(),
      confidence: Math.round(confBase(3) * 100) / 100,
      details: `Cross-domain exposure weighted. Maritime segment drives ${Math.abs(oil * 0.3).toFixed(0)}% of variance. Portfolio hedge ratio ${market > 15 ? 'insufficient' : 'adequate'}.`,
      affectedEntities: ['Maritime Fund', 'RE Holdings', 'Venture Portfolio'],
    },
    {
      domain: 'Counsel',
      icon: '⚖',
      color: '#a855f7',
      impactLabel: 'Affected Contracts',
      impactValue:
        oil > 10
          ? '7 clauses triggered'
          : threat > 3
            ? '4 force majeure alerts'
            : 'Minimal exposure',
      trend: oil > 10 || threat > 3 ? 'down' : 'flat',
      confidence: Math.round(confBase(4) * 100) / 100,
      details:
        oil > 10
          ? `${Math.floor(oil / 10 + 5)} cargo contracts contain fuel price escalation clauses. Force majeure review required.`
          : threat > 3
            ? 'Elevated threat level triggers war-risk clause review in 4 maritime agreements.'
            : 'No material contractual exposure identified.',
      affectedEntities: oil > 10 ? ['MV Poseidon Charter', 'Q3 Cargo Agreement'] : [],
    },
    {
      domain: 'Carlota Jo',
      icon: '◈',
      color: '#ec4899',
      impactLabel: 'Client Engagements',
      impactValue:
        market !== 0
          ? `${Math.abs(market) > 15 ? '3' : '1'} alert${Math.abs(market) > 15 ? 's' : ''}`
          : 'Stable',
      trend: Math.abs(market) > 15 ? 'down' : 'flat',
      confidence: Math.round(confBase(5) * 100) / 100,
      details:
        Math.abs(market) > 15
          ? `${Math.floor(Math.abs(market) / 8)} active engagements in market-sensitive sectors. Advisory strategy review recommended.`
          : 'Client advisory engagements unaffected by current scenario parameters.',
      affectedEntities:
        Math.abs(market) > 15 ? ['Emerging Markets Client', 'PE Strategy Engagement'] : [],
    },
    {
      domain: 'Aegis',
      icon: '🛡',
      color: '#ef4444',
      impactLabel: 'Threat Surface',
      impactValue:
        threat > 3
          ? `+${((threat - 2) * 18).toFixed(0)}% attack probability`
          : threat < 2
            ? 'Reduced'
            : 'Stable',
      trend: threat > 2 ? 'down' : 'up',
      confidence: Math.round(confBase(6) * 100) / 100,
      details:
        threat > 3
          ? `Elevated geopolitical threat level (${threat}/5) correlates with increased nation-state actor activity. SOC posture elevated.`
          : 'Security perimeter holding under current threat parameters.',
      affectedEntities:
        threat > 3 ? ['Critical Infrastructure', 'Maritime OT Systems', 'Legal Case Files'] : [],
    },
  ];
}

router.post(
  '/simulation/what-if',
  authMiddleware({ required: false }),
  validateBody(whatIfSchema),
  (req: Request, res: Response) => {
    try {
      const { variables, iterations } = req.body as {
        variables: Record<string, number>;
        iterations: number;
      };
      const domainImpacts = computeWhatIf(variables, iterations);
      sendSuccess(res, {
        domainImpacts,
        iterations,
        generatedAt: new Date().toISOString(),
        source: 'api-server',
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to run what-if simulation');
    }
  },
);

export default router;
