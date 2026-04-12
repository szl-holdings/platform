import { ServiceAdapter } from "../base.js";

export interface NycDobPermit {
  jobNumber: string;
  docNumber: string;
  address: string;
  borough: string;
  block: string;
  lot: string;
  workType: string;
  jobType: string;
  buildingType: string;
  residential: boolean;
  estimatedCost: number | null;
  issuanceDate: string;
  expirationDate: string;
  description: string;
  ownerName: string;
}

export interface NycHpdViolation {
  violationId: string;
  buildingId: string;
  block: string;
  lot: string;
  apartment: string;
  story: string;
  class: string;
  description: string;
  status: string;
  currentStatus: string;
  issuedDate: string;
  inspectionDate: string;
}

export interface NycDofSale {
  address: string;
  neighborhood: string;
  zipCode: string;
  buildingClass: string;
  block: string;
  lot: string;
  residentialUnits: number;
  commercialUnits: number;
  grossSqFt: number | null;
  yearBuilt: number | null;
  salePrice: number;
  saleDate: string;
  pricePerSqFt: number | null;
}

interface RawDobPermit {
  "job__"?: string;
  "doc__"?: string;
  "house__"?: string;
  "street_name"?: string;
  "borough"?: string;
  "block"?: string;
  "lot"?: string;
  "work_type"?: string;
  "job_type1"?: string;
  "bldg_type"?: string;
  "residential"?: string;
  "estimated_job_costs"?: string;
  "issuance_date"?: string;
  "expiration_date"?: string;
  "job_description"?: string;
  "owner_s_business_name"?: string;
}

interface RawHpdViolation {
  "violationid"?: string;
  "buildingid"?: string;
  "block"?: string;
  "lot"?: string;
  "apartment"?: string;
  "story"?: string;
  "class"?: string;
  "novdescription"?: string;
  "violationstatus"?: string;
  "currentstatus"?: string;
  "novissueddate"?: string;
  "inspectiondate"?: string;
}

interface RawDofSale {
  "address"?: string;
  "neighborhood"?: string;
  "zip_code"?: string;
  "building_class_category"?: string;
  "block"?: string;
  "lot"?: string;
  "residential_units"?: string;
  "commercial_units"?: string;
  "gross_square_feet"?: string;
  "year_built"?: string;
  "sale_price"?: string;
  "sale_date"?: string;
}

const NYC_OD_HEADERS = {
  "User-Agent": "SZL-Terra/1.0",
  Accept: "application/json",
};

export class NycDobAdapter extends ServiceAdapter {
  readonly name = "nyc-dob";
  readonly description = "NYC Department of Buildings — DOB Now permits via NYC Open Data (Socrata). Free, no key.";
  readonly requiredEnvVars: string[] = [];

  protected async performHealthCheck(): Promise<void> {
    const res = await fetch(
      "https://data.cityofnewyork.us/resource/ipu4-2q9a.json?$limit=1",
      { headers: NYC_OD_HEADERS, signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) throw new Error(`NYC DOB API returned ${res.status}`);
    const data = await res.json() as unknown[];
    if (!Array.isArray(data)) throw new Error("NYC DOB API returned invalid data");
  }

  async getPermits(params: {
    borough?: string;
    workType?: string;
    daysPast?: number;
    limit?: number;
  } = {}): Promise<NycDobPermit[]> {
    const borough = (params.borough ?? "MANHATTAN").toUpperCase();
    const workType = params.workType ?? "";
    const daysPast = params.daysPast ?? 30;
    const limit = Math.min(params.limit ?? 25, 100);

    const thirtyDaysAgo = new Date(Date.now() - daysPast * 86400000).toISOString().slice(0, 10);
    const workFilter = workType ? ` AND work_type='${workType}'` : "";
    const url =
      `https://data.cityofnewyork.us/resource/ipu4-2q9a.json?$where=borough='${borough}'${workFilter} AND issuance_date > '${thirtyDaysAgo}'&$order=issuance_date DESC&$limit=${limit}&$select=job__,doc__,borough,house__,street_name,work_type,job_type1,bldg_type,residential,lot,block,zip_code,owner_s_business_name,estimated_job_costs,issuance_date,expiration_date,job_description`;

    const res = await fetch(url, { headers: NYC_OD_HEADERS, signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`NYC DOB permits HTTP ${res.status}`);
    const raw = await res.json() as RawDobPermit[];
    if (!Array.isArray(raw)) throw new Error("NYC DOB returned invalid data");

    return raw.map(p => ({
      jobNumber: p["job__"] ?? "",
      docNumber: p["doc__"] ?? "",
      address: `${p["house__"] ?? ""} ${p["street_name"] ?? ""}`.trim(),
      borough: p["borough"] ?? borough,
      block: p["block"] ?? "",
      lot: p["lot"] ?? "",
      workType: p["work_type"] ?? "",
      jobType: p["job_type1"] ?? "",
      buildingType: p["bldg_type"] ?? "",
      residential: p["residential"] === "YES",
      estimatedCost: parseFloat(p["estimated_job_costs"] ?? "0") || null,
      issuanceDate: p["issuance_date"] ?? "",
      expirationDate: p["expiration_date"] ?? "",
      description: (p["job_description"] ?? "").slice(0, 200),
      ownerName: p["owner_s_business_name"] ?? "",
    }));
  }

  async getPermitSummary(borough: string): Promise<{
    count: number;
    totalEstimatedCost: number;
    byWorkType: [string, number][];
  }> {
    const permits = await this.getPermits({ borough, limit: 100 });
    const byWorkType = permits.reduce((acc: Record<string, number>, p) => {
      acc[p.workType] = (acc[p.workType] ?? 0) + 1;
      return acc;
    }, {});
    const totalEstimatedCost = permits.reduce((sum, p) => sum + (p.estimatedCost ?? 0), 0);
    return {
      count: permits.length,
      totalEstimatedCost,
      byWorkType: Object.entries(byWorkType).sort((a, b) => b[1] - a[1]),
    };
  }
}

export class NycHpdAdapter extends ServiceAdapter {
  readonly name = "nyc-hpd";
  readonly description = "NYC Housing Preservation & Development — housing code violations via NYC Open Data. Free, no key.";
  readonly requiredEnvVars: string[] = [];

  protected async performHealthCheck(): Promise<void> {
    const res = await fetch(
      "https://data.cityofnewyork.us/resource/wvxf-dwi5.json?$limit=1",
      { headers: NYC_OD_HEADERS, signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) throw new Error(`NYC HPD API returned ${res.status}`);
  }

  async getViolations(params: {
    boroughCode?: string;
    violationClass?: string;
    daysPast?: number;
    limit?: number;
  } = {}): Promise<NycHpdViolation[]> {
    const boroughCode = params.boroughCode ?? "1";
    const violationClass = params.violationClass ?? "";
    const daysPast = params.daysPast ?? 90;
    const limit = Math.min(params.limit ?? 25, 100);

    const daysAgo = new Date(Date.now() - daysPast * 86400000).toISOString().slice(0, 10);
    const classWhere = violationClass ? ` AND class='${violationClass}'` : "";
    const url =
      `https://data.cityofnewyork.us/resource/wvxf-dwi5.json?$where=boroid='${boroughCode}'${classWhere} AND novissueddate > '${daysAgo}'&$order=novissueddate DESC&$limit=${limit}&$select=violationid,buildingid,block,lot,apartment,story,class,novdescription,violationstatus,currentstatus,novissueddate,inspectiondate`;

    const res = await fetch(url, { headers: NYC_OD_HEADERS, signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`NYC HPD violations HTTP ${res.status}`);
    const raw = await res.json() as RawHpdViolation[];
    if (!Array.isArray(raw)) throw new Error("NYC HPD returned invalid data");

    return raw.map(v => ({
      violationId: v["violationid"] ?? "",
      buildingId: v["buildingid"] ?? "",
      block: v["block"] ?? "",
      lot: v["lot"] ?? "",
      apartment: v["apartment"] ?? "",
      story: v["story"] ?? "",
      class: v["class"] ?? "",
      description: (v["novdescription"] ?? "").slice(0, 250),
      status: v["violationstatus"] ?? "",
      currentStatus: v["currentstatus"] ?? "",
      issuedDate: v["novissueddate"] ?? "",
      inspectionDate: v["inspectiondate"] ?? "",
    }));
  }

  async getViolationSummary(boroughCode: string): Promise<{
    count: number;
    openViolations: number;
    byClass: [string, number][];
    classCRiskLevel: string;
  }> {
    const violations = await this.getViolations({ boroughCode, limit: 100 });
    const openViolations = violations.filter(v =>
      v.status === "Open" || v.currentStatus?.toLowerCase().includes("open"),
    ).length;
    const byClass = violations.reduce((acc: Record<string, number>, v) => {
      acc[v.class] = (acc[v.class] ?? 0) + 1;
      return acc;
    }, {});
    const classC = byClass["C"] ?? 0;
    const classCRiskLevel = classC > 20 ? "HIGH" : classC > 5 ? "MEDIUM" : "LOW";
    return {
      count: violations.length,
      openViolations,
      byClass: Object.entries(byClass).sort((a, b) => b[1] - a[1]),
      classCRiskLevel,
    };
  }
}

export class NycDofAdapter extends ServiceAdapter {
  readonly name = "nyc-dof";
  readonly description = "NYC Department of Finance — rolling property sales via NYC Open Data. Free, no key.";
  readonly requiredEnvVars: string[] = [];

  protected async performHealthCheck(): Promise<void> {
    const res = await fetch(
      "https://data.cityofnewyork.us/resource/usep-8jbt.json?$limit=1",
      { headers: NYC_OD_HEADERS, signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) throw new Error(`NYC DOF API returned ${res.status}`);
  }

  async getSales(params: {
    boroughCode?: string;
    daysPast?: number;
    limit?: number;
  } = {}): Promise<NycDofSale[]> {
    const boroughCode = params.boroughCode ?? "1";
    const daysPast = params.daysPast ?? 90;
    const limit = Math.min(params.limit ?? 25, 100);

    const daysAgo = new Date(Date.now() - daysPast * 86400000).toISOString().slice(0, 10);
    const url =
      `https://data.cityofnewyork.us/resource/usep-8jbt.json?$where=borough=${boroughCode} AND sale_date > '${daysAgo}' AND sale_price > '0'&$order=sale_date DESC&$limit=${limit}&$select=address,neighborhood,zip_code,building_class_category,block,lot,residential_units,commercial_units,gross_square_feet,year_built,sale_price,sale_date`;

    const res = await fetch(url, { headers: NYC_OD_HEADERS, signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`NYC DOF sales HTTP ${res.status}`);
    const raw = await res.json() as RawDofSale[];
    if (!Array.isArray(raw)) throw new Error("NYC DOF returned invalid data");

    return raw.map(s => {
      const salePrice = parseFloat(s["sale_price"] ?? "0");
      const grossSqFt = parseInt(s["gross_square_feet"] ?? "0") || null;
      return {
        address: s["address"] ?? "",
        neighborhood: s["neighborhood"] ?? "",
        zipCode: s["zip_code"] ?? "",
        buildingClass: s["building_class_category"] ?? "",
        block: s["block"] ?? "",
        lot: s["lot"] ?? "",
        residentialUnits: parseInt(s["residential_units"] ?? "0") || 0,
        commercialUnits: parseInt(s["commercial_units"] ?? "0") || 0,
        grossSqFt,
        yearBuilt: parseInt(s["year_built"] ?? "0") || null,
        salePrice,
        saleDate: s["sale_date"] ?? "",
        pricePerSqFt: grossSqFt && grossSqFt > 0 ? Math.round(salePrice / grossSqFt) : null,
      };
    });
  }

  async getSalesSummary(boroughCode: string): Promise<{
    count: number;
    avgSalePrice: number;
    medianSalePrice: number;
    minSalePrice: number | null;
    maxSalePrice: number | null;
    byCategory: [string, number][];
  }> {
    const sales = await this.getSales({ boroughCode, limit: 100 });
    const prices = sales.map(s => s.salePrice).filter(p => p > 50000);
    const sorted = [...prices].sort((a, b) => a - b);
    const avgSalePrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    const medianSalePrice = prices.length > 0 ? Math.round(sorted[Math.floor(sorted.length / 2)]) : 0;
    const byCategory = sales.reduce((acc: Record<string, number>, s) => {
      const cat = s.buildingClass || "Unknown";
      acc[cat] = (acc[cat] ?? 0) + 1;
      return acc;
    }, {});
    return {
      count: sales.length,
      avgSalePrice,
      medianSalePrice,
      minSalePrice: prices.length > 0 ? Math.min(...prices) : null,
      maxSalePrice: prices.length > 0 ? Math.max(...prices) : null,
      byCategory: Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 10),
    };
  }
}

export interface NycDobComplaint {
  complaintNumber: string;
  status: string;
  dateEntered: string;
  houseNumber: string;
  borough: string;
  complaintCategory: string;
  unitType: string;
  dispositionDate: string | null;
  dispositionDescription: string | null;
}

interface RawDobComplaint {
  complaint_number?: string;
  status?: string;
  date_entered?: string;
  house_number?: string;
  borough?: string;
  complaint_category?: string;
  unit_type?: string;
  disposition_date?: string;
  disposition_description?: string;
}

export class NycDobComplaintsAdapter extends ServiceAdapter {
  readonly name = "nycDobComplaints";
  readonly description = "NYC Department of Buildings complaints — active building violations and safety complaints from NYC Open Data";
  readonly requiredEnvVars: string[] = [];

  protected async performHealthCheck(): Promise<void> {
    const r = await fetch("https://data.cityofnewyork.us/resource/5zuj-tzdj.json?$limit=1", {
      headers: { "User-Agent": "SZL-Terra/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw new Error(`NYC DOB Complaints health check HTTP ${r.status}`);
  }

  async getComplaints(borough = "MANHATTAN", limit = 50): Promise<NycDobComplaint[]> {
    const r = await fetch(
      `https://data.cityofnewyork.us/resource/5zuj-tzdj.json?borough=${encodeURIComponent(borough)}&$limit=${limit}&$order=date_entered DESC&$select=complaint_number,status,date_entered,house_number,borough,complaint_category,unit_type,disposition_date,disposition_description`,
      { headers: { "User-Agent": "SZL-Terra/1.0" }, signal: AbortSignal.timeout(12000) },
    );
    if (!r.ok) throw new Error(`NYC DOB Complaints HTTP ${r.status}`);
    const raw = await r.json() as RawDobComplaint[];
    if (!Array.isArray(raw)) throw new Error("NYC DOB Complaints returned invalid data");
    return raw.map(c => ({
      complaintNumber: c.complaint_number ?? "",
      status: c.status ?? "",
      dateEntered: c.date_entered ?? "",
      houseNumber: c.house_number ?? "",
      borough: c.borough ?? "",
      complaintCategory: c.complaint_category ?? "",
      unitType: c.unit_type ?? "",
      dispositionDate: c.disposition_date ?? null,
      dispositionDescription: c.disposition_description ?? null,
    }));
  }

  async getComplaintSummary(borough = "MANHATTAN"): Promise<{
    count: number;
    openCount: number;
    byCategory: [string, number][];
    mostRecent: string | null;
  }> {
    const complaints = await this.getComplaints(borough, 200);
    const openCount = complaints.filter(c => c.status === "Open").length;
    const byCategory = Object.entries(
      complaints.reduce<Record<string, number>>((acc, c) => {
        if (c.complaintCategory) acc[c.complaintCategory] = (acc[c.complaintCategory] ?? 0) + 1;
        return acc;
      }, {}),
    ).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const mostRecent = complaints.length > 0 ? complaints[0].dateEntered : null;
    return { count: complaints.length, openCount, byCategory, mostRecent };
  }
}
