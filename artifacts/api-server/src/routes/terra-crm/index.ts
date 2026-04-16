import { Router } from "express";
import { register as registerLeads } from "./leads.js";
import { register as registerDeals } from "./deals.js";
import { register as registerConversions } from "./conversions.js";
import { register as registerOpportunities } from "./opportunities.js";
import { register as registerAnalysis } from "./analysis.js";
import { register as registerCsvExport } from "./csv-export.js";

const router = Router();

registerLeads(router);
registerDeals(router);
registerConversions(router);
registerOpportunities(router);
registerAnalysis(router);
registerCsvExport(router);

export default router;
