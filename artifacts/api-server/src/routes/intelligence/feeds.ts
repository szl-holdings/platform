
import { type IRouter, Router } from 'express';
import { handleRouteError, sendSuccess } from '../../lib/api-response';
import { logger } from '../../lib/logger';
import { listQuerySchema, validateQuery } from '../../lib/validation.js';
import { authMiddleware } from '../../middlewares/auth';

type AnthropicMessageParam = {
  role: 'user' | 'assistant';
  content: string | { type: string; text: string }[];
};

import {
  type CveItem,
  fetchAndEnrichSanctions,
  fetchGdeltGeopolitical,
  fetchLiveMaritimeVessels,
  fetchNvdCves,
  fetchOpenMeteoMarineWeather,
  fetchOtxThreats,
  fetchRssNews,
  type GeoEvent,
  getCached,
  intelRateLimit,
  type MarineWeatherItem,
  type MaritimeVessel,
  type NewsItem,
  type SanctionVessel,
  type ThreatItem,
} from './shared';

const router = Router();

router.get('/intelligence/threats', intelRateLimit, authMiddleware(), async (_req, res) => {
  try {
    const data = await getCached('threats', 300000, fetchOtxThreats).catch((err) => {
      logger.warn(
        { err },
        'Intelligence /threats: upstream fetch and cache both failed — returning empty array',
      );
      return [] as ThreatItem[];
    });
    sendSuccess(res, data);
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch threat data');
  }
});

router.get(
  '/intelligence/cves',
  intelRateLimit,
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const severity = req.query.severity as string | undefined;
      const data = await getCached('cves', 600000, fetchNvdCves).catch((err) => {
        logger.warn(
          { err },
          'Intelligence /cves: upstream fetch and cache both failed — returning empty array',
        );
        return [] as CveItem[];
      });
      const filtered = severity
        ? data.filter((c) => c.severity.toLowerCase() === severity.toLowerCase())
        : data;
      sendSuccess(res, filtered);
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch CVE data');
    }
  },
);

router.get('/intelligence/geopolitical', intelRateLimit, authMiddleware(), async (_req, res) => {
  try {
    const data = await getCached('geopolitical', 300000, fetchGdeltGeopolitical).catch((err) => {
      logger.warn(
        { err },
        'Intelligence /geopolitical: upstream fetch and cache both failed — returning empty array',
      );
      return [] as GeoEvent[];
    });
    sendSuccess(res, data);
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch geopolitical events');
  }
});

router.get(
  '/intelligence/maritime/vessels',
  intelRateLimit,
  authMiddleware(),
  async (_req, res) => {
    try {
      const data = await getCached('maritime-vessels', 60000, fetchLiveMaritimeVessels).catch(
        (err) => {
          logger.warn(
            { err },
            'Intelligence /maritime/vessels: upstream fetch and cache both failed — returning empty array',
          );
          return [] as MaritimeVessel[];
        },
      );
      sendSuccess(res, data);
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch maritime data');
    }
  },
);

router.get(
  '/intelligence/maritime/chokepoints',
  intelRateLimit,
  authMiddleware(),
  async (_req, res) => {
    try {
      sendSuccess(res, {
        status: 'NOT_CONFIGURED',
        note: 'Connect a live maritime data source (e.g. MarineTraffic API, UKMTO feed) to enable real-time chokepoint intelligence.',
        data: [],
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch chokepoint data');
    }
  },
);

router.get(
  '/intelligence/maritime/weather',
  intelRateLimit,
  authMiddleware(),
  async (_req, res) => {
    try {
      const data = await getCached('marine-weather', 600000, fetchOpenMeteoMarineWeather).catch(
        (err) => {
          logger.warn(
            { err },
            'Intelligence /maritime/weather: upstream fetch and cache both failed — returning empty array',
          );
          return [] as MarineWeatherItem[];
        },
      );
      sendSuccess(res, data);
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch marine weather');
    }
  },
);

router.get(
  '/intelligence/maritime/sanctions',
  intelRateLimit,
  authMiddleware(),
  async (_req, res) => {
    try {
      const enriched = await getCached(
        'sanctions-enriched',
        3600000,
        fetchAndEnrichSanctions,
      ).catch((err) => {
        logger.warn(
          { err },
          'Intelligence /maritime/sanctions: upstream fetch and cache both failed — returning empty array',
        );
        return [] as SanctionVessel[];
      });
      sendSuccess(res, enriched);
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch sanctions data');
    }
  },
);

router.get(
  '/intelligence/news',
  intelRateLimit,
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const data = await getCached('news', 300000, fetchRssNews).catch((err) => {
        logger.warn(
          { err },
          'Intelligence /news: upstream fetch and cache both failed — returning empty array',
        );
        return [] as NewsItem[];
      });
      const filtered = category ? data.filter((n) => n.category === category) : data;
      sendSuccess(res, filtered);
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch news');
    }
  },
);

router.get('/intelligence/tech-trends', intelRateLimit, authMiddleware(), async (_req, res) => {
  try {
    sendSuccess(res, {
      status: 'NOT_CONFIGURED',
      note: 'Connect a technology trend data source (e.g. ThoughtWorks Radar API, GitHub Octoverse, Stack Overflow Survey) to enable live tech trend intelligence.',
      data: [],
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch tech trends');
  }
});

router.get('/intelligence/anomalies', intelRateLimit, authMiddleware(), async (_req, res) => {
  try {
    const data = await getCached('anomalies', 60000, async () => [] as unknown[]);
    sendSuccess(res, data);
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch anomalies');
  }
});

router.get('/intelligence/ops-heatmap', intelRateLimit, authMiddleware(), async (_req, res) => {
  try {
    sendSuccess(res, {
      status: 'NOT_CONFIGURED',
      note: 'Connect operational event streams (SIEM, SOAR, or ticketing system) to enable real-time operations heatmap.',
      data: [],
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch ops heatmap');
  }
});

router.get('/intelligence/platform-stats', intelRateLimit, authMiddleware(), async (_req, res) => {
  try {
    sendSuccess(res, {
      status: 'NOT_CONFIGURED',
      note: 'Platform statistics require integration with your observability stack (e.g. Datadog, Grafana, or custom metrics pipeline).',
      data: null,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch platform stats');
  }
});

router.get('/intelligence/benchmarks', intelRateLimit, authMiddleware(), async (_req, res) => {
  try {
    sendSuccess(res, {
      status: 'NOT_CONFIGURED',
      note: 'Connect an industry benchmark data source (e.g. Gartner, IDC, CIS Controls self-assessment) to enable live readiness benchmarks.',
      data: [],
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch benchmarks');
  }
});

router.get(
  '/intelligence/ecosystem-health',
  intelRateLimit,
  authMiddleware(),
  async (_req, res) => {
    try {
      const data = await getCached('ecosystem-health', 60000, async () => [] as unknown[]);
      sendSuccess(res, data);
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch ecosystem health');
    }
  },
);

router.get(
  '/intelligence/cultural-calendar',
  intelRateLimit,
  authMiddleware(),
  async (_req, res) => {
    try {
      sendSuccess(res, {
        status: 'NOT_CONFIGURED',
        note: 'Connect a calendar data source (e.g. Google Calendar API, Holidata, custom CMS) to enable regional cultural calendar intelligence.',
        data: [],
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch cultural calendar');
    }
  },
);

export function register(r: IRouter): void {
  r.use(router);
}
