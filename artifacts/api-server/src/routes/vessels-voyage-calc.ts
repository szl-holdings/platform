import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendBadRequest, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();
const noAuth = authMiddleware({ required: false });

interface VesselClass {
  id: string;
  name: string;
  dwt: number;
  typicalSpeedKnots: number;
  dailyBunkerConsumptionMt: number;
  dailyOpex: number;
  insuranceDailyUsd: number;
}

interface BunkerPrice {
  port: string;
  vlsfoUsdPerMt: number;
  hfoUsdPerMt: number;
  mgoUsdPerMt: number;
  lngUsdPerMmbtu: number;
  asOfDate: string;
}

interface CanalFee {
  canal: string;
  baseFeeUsd: number;
  perNetTonUsd: number;
  surcharges: { name: string; pct: number }[];
  transitTimeHours: number;
  waitTimeHours: number;
}

interface CharterRateEstimate {
  vesselClass: string;
  timeCharterRateUsd: number;
  spotRateUsd: number;
  trend: 'rising' | 'stable' | 'falling';
  weeklyChange: number;
  asOfDate: string;
}

interface VoyageEstimate {
  vesselClass: string;
  route: { from: string; to: string; distanceNm: number; seaDays: number; canalTransits: string[] };
  revenue: { charterType: string; ratePerDay: number; totalRevenue: number; cargoQuantityMt: number; freightRatePerMt: number };
  costs: {
    bunkerCost: number;
    bunkerConsumptionMt: number;
    bunkerPricePerMt: number;
    portCharges: number;
    canalFees: number;
    canalBreakdown: { canal: string; fee: number }[];
    insurance: number;
    crewAndOpex: number;
    commissions: number;
    miscellaneous: number;
    totalCosts: number;
  };
  economics: {
    grossProfit: number;
    grossMarginPct: number;
    tceRate: number;
    breakEvenFreightRate: number;
    dailyPnl: number;
    voyageDays: number;
    seaDays: number;
    portDays: number;
    carbonEmissionsMt: number;
    carbonCostUsd: number;
  };
}

const VESSEL_CLASSES: VesselClass[] = [
  { id: 'vlcc', name: 'VLCC (Very Large Crude Carrier)', dwt: 300000, typicalSpeedKnots: 14.5, dailyBunkerConsumptionMt: 85, dailyOpex: 9500, insuranceDailyUsd: 3200 },
  { id: 'suezmax', name: 'Suezmax', dwt: 160000, typicalSpeedKnots: 14.0, dailyBunkerConsumptionMt: 55, dailyOpex: 8200, insuranceDailyUsd: 2800 },
  { id: 'aframax', name: 'Aframax', dwt: 110000, typicalSpeedKnots: 14.5, dailyBunkerConsumptionMt: 42, dailyOpex: 7500, insuranceDailyUsd: 2400 },
  { id: 'panamax-tanker', name: 'Panamax Tanker', dwt: 75000, typicalSpeedKnots: 13.5, dailyBunkerConsumptionMt: 35, dailyOpex: 6800, insuranceDailyUsd: 2100 },
  { id: 'capesize', name: 'Capesize Bulk', dwt: 180000, typicalSpeedKnots: 13.0, dailyBunkerConsumptionMt: 48, dailyOpex: 7800, insuranceDailyUsd: 2500 },
  { id: 'panamax-bulk', name: 'Panamax Bulk', dwt: 82000, typicalSpeedKnots: 13.5, dailyBunkerConsumptionMt: 32, dailyOpex: 6500, insuranceDailyUsd: 2000 },
  { id: 'handymax', name: 'Handymax Bulk', dwt: 52000, typicalSpeedKnots: 14.0, dailyBunkerConsumptionMt: 28, dailyOpex: 5800, insuranceDailyUsd: 1800 },
  { id: 'lng-carrier', name: 'LNG Carrier', dwt: 85000, typicalSpeedKnots: 19.5, dailyBunkerConsumptionMt: 140, dailyOpex: 12500, insuranceDailyUsd: 4500 },
];

const BUNKER_PRICES: BunkerPrice[] = [
  { port: 'Singapore', vlsfoUsdPerMt: 592, hfoUsdPerMt: 445, mgoUsdPerMt: 780, lngUsdPerMmbtu: 11.2, asOfDate: '2026-04-25' },
  { port: 'Fujairah', vlsfoUsdPerMt: 578, hfoUsdPerMt: 432, mgoUsdPerMt: 765, lngUsdPerMmbtu: 10.8, asOfDate: '2026-04-25' },
  { port: 'Rotterdam', vlsfoUsdPerMt: 605, hfoUsdPerMt: 455, mgoUsdPerMt: 795, lngUsdPerMmbtu: 12.1, asOfDate: '2026-04-25' },
  { port: 'Houston', vlsfoUsdPerMt: 588, hfoUsdPerMt: 440, mgoUsdPerMt: 772, lngUsdPerMmbtu: 3.8, asOfDate: '2026-04-25' },
  { port: 'Piraeus', vlsfoUsdPerMt: 598, hfoUsdPerMt: 448, mgoUsdPerMt: 785, lngUsdPerMmbtu: 11.5, asOfDate: '2026-04-25' },
  { port: 'Busan', vlsfoUsdPerMt: 595, hfoUsdPerMt: 450, mgoUsdPerMt: 790, lngUsdPerMmbtu: 11.8, asOfDate: '2026-04-25' },
];

const CANAL_FEES: CanalFee[] = [
  { canal: 'Suez Canal', baseFeeUsd: 250_000, perNetTonUsd: 8.50, surcharges: [{ name: 'SCA surcharge', pct: 15 }, { name: 'War risk', pct: 5 }], transitTimeHours: 16, waitTimeHours: 24 },
  { canal: 'Panama Canal', baseFeeUsd: 180_000, perNetTonUsd: 5.25, surcharges: [{ name: 'Freshwater charge', pct: 10 }, { name: 'Booking fee', pct: 8 }], transitTimeHours: 10, waitTimeHours: 48 },
  { canal: 'Kiel Canal', baseFeeUsd: 35_000, perNetTonUsd: 1.80, surcharges: [{ name: 'Pilotage', pct: 12 }], transitTimeHours: 8, waitTimeHours: 4 },
  { canal: 'Turkish Straits', baseFeeUsd: 45_000, perNetTonUsd: 2.20, surcharges: [{ name: 'Pilotage', pct: 15 }], transitTimeHours: 6, waitTimeHours: 12 },
];

const CHARTER_RATE_ESTIMATES: CharterRateEstimate[] = [
  { vesselClass: 'vlcc', timeCharterRateUsd: 42500, spotRateUsd: 48000, trend: 'rising', weeklyChange: 3.2, asOfDate: '2026-04-25' },
  { vesselClass: 'suezmax', timeCharterRateUsd: 35000, spotRateUsd: 38500, trend: 'rising', weeklyChange: 2.8, asOfDate: '2026-04-25' },
  { vesselClass: 'aframax', timeCharterRateUsd: 28000, spotRateUsd: 31500, trend: 'stable', weeklyChange: 0.5, asOfDate: '2026-04-25' },
  { vesselClass: 'panamax-tanker', timeCharterRateUsd: 22000, spotRateUsd: 25000, trend: 'stable', weeklyChange: -0.3, asOfDate: '2026-04-25' },
  { vesselClass: 'capesize', timeCharterRateUsd: 24000, spotRateUsd: 27500, trend: 'rising', weeklyChange: 4.1, asOfDate: '2026-04-25' },
  { vesselClass: 'panamax-bulk', timeCharterRateUsd: 15000, spotRateUsd: 17500, trend: 'falling', weeklyChange: -1.8, asOfDate: '2026-04-25' },
  { vesselClass: 'handymax', timeCharterRateUsd: 12500, spotRateUsd: 14000, trend: 'stable', weeklyChange: 0.2, asOfDate: '2026-04-25' },
  { vesselClass: 'lng-carrier', timeCharterRateUsd: 85000, spotRateUsd: 95000, trend: 'rising', weeklyChange: 1.5, asOfDate: '2026-04-25' },
];

interface RouteDefinition {
  id: string;
  from: string;
  to: string;
  distanceNm: number;
  canals: string[];
  portDays: number;
}

const ROUTES: RouteDefinition[] = [
  { id: 'ras-tanura-ningbo', from: 'Ras Tanura', to: 'Ningbo', distanceNm: 6680, canals: [], portDays: 4 },
  { id: 'ras-tanura-rotterdam', from: 'Ras Tanura', to: 'Rotterdam', distanceNm: 6450, canals: ['Suez Canal'], portDays: 5 },
  { id: 'houston-rotterdam', from: 'Houston', to: 'Rotterdam', distanceNm: 5050, canals: [], portDays: 4 },
  { id: 'santos-shanghai', from: 'Santos', to: 'Shanghai', distanceNm: 11200, canals: [], portDays: 5 },
  { id: 'newcastle-qingdao', from: 'Newcastle', to: 'Qingdao', distanceNm: 5350, canals: [], portDays: 4 },
  { id: 'richards-bay-rotterdam', from: 'Richards Bay', to: 'Rotterdam', distanceNm: 7200, canals: [], portDays: 5 },
  { id: 'sabine-pass-yokohama', from: 'Sabine Pass', to: 'Yokohama', distanceNm: 9400, canals: ['Panama Canal'], portDays: 6 },
  { id: 'singapore-suez-rotterdam', from: 'Singapore', to: 'Rotterdam', distanceNm: 8400, canals: ['Suez Canal'], portDays: 5 },
];

function computeVoyageEstimate(
  vesselClassId: string,
  routeId: string,
  charterType: 'time_charter' | 'spot',
  cargoQuantityMt?: number,
): VoyageEstimate {
  const vessel = VESSEL_CLASSES.find((v) => v.id === vesselClassId) ?? VESSEL_CLASSES[0];
  const route = ROUTES.find((r) => r.id === routeId) ?? ROUTES[0];
  const charterRate = CHARTER_RATE_ESTIMATES.find((c) => c.vesselClass === vesselClassId) ?? CHARTER_RATE_ESTIMATES[0];
  const bunkerPrice = BUNKER_PRICES[0];

  const seaDays = parseFloat((route.distanceNm / (vessel.typicalSpeedKnots * 24)).toFixed(1));
  const voyageDays = seaDays + route.portDays;

  const bunkerConsumptionMt = vessel.dailyBunkerConsumptionMt * seaDays;
  const bunkerCost = bunkerConsumptionMt * bunkerPrice.vlsfoUsdPerMt;

  let totalCanalFees = 0;
  const canalBreakdown: { canal: string; fee: number }[] = [];
  for (const canalName of route.canals) {
    const canal = CANAL_FEES.find((c) => c.canal === canalName);
    if (canal) {
      const baseFee = canal.baseFeeUsd + (vessel.dwt / 2) * canal.perNetTonUsd;
      const surchargeTotal = canal.surcharges.reduce((s, sc) => s + baseFee * (sc.pct / 100), 0);
      const totalFee = baseFee + surchargeTotal;
      totalCanalFees += totalFee;
      canalBreakdown.push({ canal: canalName, fee: Math.round(totalFee) });
    }
  }

  const portCharges = route.portDays * 25_000;
  const insurance = vessel.insuranceDailyUsd * voyageDays;
  const crewAndOpex = vessel.dailyOpex * voyageDays;
  const ratePerDay = charterType === 'time_charter' ? charterRate.timeCharterRateUsd : charterRate.spotRateUsd;
  const totalRevenue = ratePerDay * voyageDays;
  const commissions = totalRevenue * 0.025;
  const miscellaneous = 15_000;

  const totalCosts = bunkerCost + portCharges + totalCanalFees + insurance + crewAndOpex + commissions + miscellaneous;
  const grossProfit = totalRevenue - totalCosts;
  const tceRate = voyageDays > 0 ? Math.round((totalRevenue - bunkerCost - portCharges - totalCanalFees - commissions - miscellaneous) / voyageDays) : 0;

  const cargo = cargoQuantityMt ?? vessel.dwt * 0.95;
  const freightRatePerMt = cargo > 0 ? parseFloat((totalRevenue / cargo).toFixed(2)) : 0;
  const breakEvenFreightRate = cargo > 0 ? parseFloat((totalCosts / cargo).toFixed(2)) : 0;

  const carbonEmissionsMt = bunkerConsumptionMt * 3.114;
  const carbonCostUsd = carbonEmissionsMt * 85;

  return {
    vesselClass: vessel.name,
    route: { from: route.from, to: route.to, distanceNm: route.distanceNm, seaDays, canalTransits: route.canals },
    revenue: { charterType, ratePerDay, totalRevenue: Math.round(totalRevenue), cargoQuantityMt: cargo, freightRatePerMt },
    costs: {
      bunkerCost: Math.round(bunkerCost),
      bunkerConsumptionMt: Math.round(bunkerConsumptionMt),
      bunkerPricePerMt: bunkerPrice.vlsfoUsdPerMt,
      portCharges,
      canalFees: Math.round(totalCanalFees),
      canalBreakdown,
      insurance: Math.round(insurance),
      crewAndOpex: Math.round(crewAndOpex),
      commissions: Math.round(commissions),
      miscellaneous,
      totalCosts: Math.round(totalCosts),
    },
    economics: {
      grossProfit: Math.round(grossProfit),
      grossMarginPct: parseFloat(((grossProfit / totalRevenue) * 100).toFixed(1)),
      tceRate,
      breakEvenFreightRate,
      dailyPnl: Math.round(grossProfit / voyageDays),
      voyageDays,
      seaDays,
      portDays: route.portDays,
      carbonEmissionsMt: Math.round(carbonEmissionsMt),
      carbonCostUsd: Math.round(carbonCostUsd),
    },
  };
}

router.get('/vessels/voyage-calc/vessel-classes', noAuth, (_req, res) => {
  sendSuccess(res, { vesselClasses: VESSEL_CLASSES });
});

router.get('/vessels/voyage-calc/routes', noAuth, (_req, res) => {
  sendSuccess(res, { routes: ROUTES });
});

router.get('/vessels/voyage-calc/bunker-prices', noAuth, (_req, res) => {
  sendSuccess(res, { bunkerPrices: BUNKER_PRICES, asOfDate: '2026-04-25' });
});

router.get('/vessels/voyage-calc/canal-fees', noAuth, (_req, res) => {
  sendSuccess(res, { canalFees: CANAL_FEES });
});

router.get('/vessels/voyage-calc/charter-rates', noAuth, (_req, res) => {
  sendSuccess(res, { charterRates: CHARTER_RATE_ESTIMATES, asOfDate: '2026-04-25' });
});

const estimateSchema = z.object({
  vesselClassId: z.string().min(1),
  routeId: z.string().min(1),
  charterType: z.enum(['time_charter', 'spot']).default('time_charter'),
  cargoQuantityMt: z.number().positive().optional(),
});

router.post('/vessels/voyage-calc/estimate', noAuth, validateBody(estimateSchema), (req, res) => {
  try {
    const { vesselClassId, routeId, charterType, cargoQuantityMt } = req.body as z.infer<typeof estimateSchema>;

    if (!VESSEL_CLASSES.find((v) => v.id === vesselClassId)) {
      sendBadRequest(res, `Invalid vesselClassId. Must be one of: ${VESSEL_CLASSES.map((v) => v.id).join(', ')}`);
      return;
    }
    if (!ROUTES.find((r) => r.id === routeId)) {
      sendBadRequest(res, `Invalid routeId. Must be one of: ${ROUTES.map((r) => r.id).join(', ')}`);
      return;
    }

    const estimate = computeVoyageEstimate(vesselClassId, routeId, charterType, cargoQuantityMt);
    sendSuccess(res, {
      estimate,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to compute voyage estimate');
  }
});

export default router;
