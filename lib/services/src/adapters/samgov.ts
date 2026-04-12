import { ServiceAdapter } from "../base.js";

export interface SamGovOpportunity {
  noticeId: string;
  title: string;
  solicitationNumber: string;
  fullParentPathName: string;
  postedDate: string;
  type: string;
  baseType: string;
  archiveType: string | null;
  archiveDate: string | null;
  naicsCode: string;
  naicsDescription: string;
  classificationCode: string;
  active: boolean;
  responseDeadLine: string | null;
  description: string;
  organizationName: string;
  uiLink: string;
  setAside: string | null;
  placeOfPerformance: string;
  estimatedValue: string | null;
}

export interface SamGovEntity {
  ueiSAM: string;
  legalBusinessName: string;
  dbaName: string | null;
  entityStatus: string;
  registrationDate: string | null;
  expirationDate: string | null;
  primaryNaics: string;
  physicalAddress: string;
  cage: string | null;
  purposeOfRegistration: string;
}

interface RawOpportunity {
  noticeId?: string;
  opportunityId?: string;
  title?: string;
  solicitationNumber?: string;
  fullParentPathName?: string;
  department?: string;
  postedDate?: string;
  type?: string;
  baseType?: string;
  archiveType?: string;
  archiveDate?: string;
  naicsCode?: string;
  naicsDescription?: string;
  classificationCode?: string;
  active?: string | boolean;
  responseDeadLine?: string;
  description?: string;
  organizationName?: string;
  uiLink?: string;
  typeOfSetAside?: string;
  setAside?: string;
  placeOfPerformance?: { cityName?: string; stateCode?: string };
  award?: { amount?: number };
}

interface RawEntity {
  entityRegistration?: {
    ueiSAM?: string;
    legalBusinessName?: string;
    dbaName?: string;
    registrationStatus?: string;
    registrationDate?: string;
    registrationExpirationDate?: string;
    cageCode?: string;
    purposeOfRegistrationDesc?: string;
  };
  coreData?: {
    physicalAddress?: { streetAddress?: string; city?: string; stateOrProvinceCode?: string; zipCode?: string };
    naicsCode?: { primaryNaics?: string };
  };
}

export class SamGovAdapter extends ServiceAdapter {
  readonly name = "samgov";
  readonly description = "SAM.gov Entity Management & Contract Opportunities — free public API";
  readonly requiredEnvVars = ["SAM_GOV_API_KEY"];

  private get apiKey(): string {
    return process.env["SAM_GOV_API_KEY"] ?? "";
  }

  protected async performHealthCheck(): Promise<void> {
    const res = await fetch(
      `https://api.sam.gov/opportunities/v2/search?api_key=${this.apiKey}&limit=1&postedFrom=01/01/2025&postedTo=12/31/2025`,
      {
        headers: { "User-Agent": "SZL-Lyte/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!res.ok) throw new Error(`SAM.gov returned ${res.status}`);
  }

  async searchOpportunities(params: {
    keywords?: string;
    naicsCode?: string;
    postedFrom?: string;
    postedTo?: string;
    limit?: number;
    ptype?: string;
  } = {}): Promise<SamGovOpportunity[]> {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 86400000);
    const fmt = (d: Date) => `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;

    const qp = new URLSearchParams({
      api_key: this.apiKey,
      limit: String(Math.min(params.limit ?? 10, 25)),
      postedFrom: params.postedFrom ?? fmt(oneMonthAgo),
      postedTo: params.postedTo ?? fmt(now),
    });
    if (params.keywords) qp.set("q", params.keywords);
    if (params.naicsCode) qp.set("ncode", params.naicsCode);
    if (params.ptype) qp.set("ptype", params.ptype);

    const res = await fetch(`https://api.sam.gov/opportunities/v2/search?${qp}`, {
      headers: { "User-Agent": "SZL-Lyte/1.0", Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`SAM.gov opportunities HTTP ${res.status}`);
    const data = await res.json() as { opportunitiesData?: RawOpportunity[]; results?: RawOpportunity[] };
    const opps = data?.opportunitiesData ?? data?.results ?? [];
    return opps.map((o) => ({
      noticeId: o.noticeId ?? o.opportunityId ?? "",
      title: o.title ?? "",
      solicitationNumber: o.solicitationNumber ?? "",
      fullParentPathName: o.fullParentPathName ?? o.department ?? "",
      postedDate: o.postedDate ?? "",
      type: o.type ?? "",
      baseType: o.baseType ?? "",
      archiveType: o.archiveType ?? null,
      archiveDate: o.archiveDate ?? null,
      naicsCode: o.naicsCode ?? "",
      naicsDescription: o.naicsDescription ?? "",
      classificationCode: o.classificationCode ?? "",
      active: o.active === "Yes" || o.active === true,
      responseDeadLine: o.responseDeadLine ?? null,
      description: o.description ? o.description.slice(0, 500) : "",
      organizationName: o.organizationName ?? "",
      uiLink: o.uiLink ?? `https://sam.gov/opp/${o.noticeId ?? ""}`,
      setAside: o.typeOfSetAside ?? o.setAside ?? null,
      placeOfPerformance: o.placeOfPerformance?.cityName ? `${o.placeOfPerformance.cityName}, ${o.placeOfPerformance.stateCode ?? ""}` : "Multiple",
      estimatedValue: o.award?.amount ? String(o.award.amount) : null,
    }));
  }

  async searchEntities(params: {
    entityName?: string;
    uei?: string;
    naicsCode?: string;
    limit?: number;
  } = {}): Promise<SamGovEntity[]> {
    const qp = new URLSearchParams({
      api_key: this.apiKey,
      qterms: params.entityName ?? params.uei ?? "*",
      includeSections: "entityRegistration,coreData",
      pageSize: String(Math.min(params.limit ?? 10, 25)),
    });
    if (params.naicsCode) qp.set("primaryNaicsCode", params.naicsCode);

    const res = await fetch(`https://api.sam.gov/entity-information/v3/entities?${qp}`, {
      headers: { "User-Agent": "SZL-Lyte/1.0", Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`SAM.gov entities HTTP ${res.status}`);
    const data = await res.json() as { entityData?: RawEntity[] };
    const entities = data?.entityData ?? [];
    return entities.map((e) => {
      const reg = e.entityRegistration ?? {};
      const addr = e.coreData?.physicalAddress ?? {};
      return {
        ueiSAM: reg.ueiSAM ?? "",
        legalBusinessName: reg.legalBusinessName ?? "",
        dbaName: reg.dbaName ?? null,
        entityStatus: reg.registrationStatus ?? "",
        registrationDate: reg.registrationDate ?? null,
        expirationDate: reg.registrationExpirationDate ?? null,
        primaryNaics: e.coreData?.naicsCode?.primaryNaics ?? "",
        physicalAddress: [addr.streetAddress, addr.city, addr.stateOrProvinceCode, addr.zipCode].filter(Boolean).join(", "),
        cage: reg.cageCode ?? null,
        purposeOfRegistration: reg.purposeOfRegistrationDesc ?? "",
      };
    });
  }
}
