import DataLoader from 'dataloader';

async function getDb() {
  const { db } = await import('@szl-holdings/db');
  return db;
}

async function getTables() {
  return import('@szl-holdings/db/schema');
}

async function getOrm() {
  return import('drizzle-orm');
}

export function createVesselByIdLoader() {
  return new DataLoader<number, unknown | null>(async (ids) => {
    try {
      const db = await getDb();
      const { vesselsTable } = await getTables();
      const { inArray } = await getOrm();
      const rows = await db
        .select()
        .from(vesselsTable)
        .where(inArray(vesselsTable.id, [...ids]));
      const map = new Map(rows.map((r: any) => [r.id, r]));
      return ids.map((id) => map.get(id) ?? null);
    } catch {
      return ids.map(() => null);
    }
  });
}

export function createAegisAssessmentByIdLoader() {
  return new DataLoader<number, unknown | null>(async (ids) => {
    try {
      const db = await getDb();
      const { firestormAssessmentsTable } = await getTables();
      const { inArray } = await getOrm();
      const rows = await db
        .select()
        .from(firestormAssessmentsTable)
        .where(inArray(firestormAssessmentsTable.id, [...ids]));
      const map = new Map(rows.map((r: any) => [r.id, r]));
      return ids.map((id) => map.get(id) ?? null);
    } catch {
      return ids.map(() => null);
    }
  });
}

export function createFindingsByAssessmentIdLoader() {
  return new DataLoader<number, unknown[]>(async (assessmentIds) => {
    try {
      const db = await getDb();
      const { firestormFindingsTable } = await getTables();
      const { inArray, desc } = await getOrm();
      const rows = await db
        .select()
        .from(firestormFindingsTable)
        .where(inArray(firestormFindingsTable.assessmentId, [...assessmentIds]))
        .orderBy(desc(firestormFindingsTable.createdAt));
      const grouped = new Map<number, unknown[]>();
      for (const row of rows as any[]) {
        const key = row.assessmentId as number;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)?.push(row);
      }
      return assessmentIds.map((id) => grouped.get(id) ?? []);
    } catch {
      return assessmentIds.map(() => []);
    }
  });
}

export function createAegisIncidentByIdLoader() {
  return new DataLoader<number, unknown | null>(async (ids) => {
    try {
      const db = await getDb();
      const { firestormIncidentsTable } = await getTables();
      const { inArray } = await getOrm();
      const rows = await db
        .select()
        .from(firestormIncidentsTable)
        .where(inArray(firestormIncidentsTable.id, [...ids]));
      const map = new Map(rows.map((r: any) => [r.id, r]));
      return ids.map((id) => map.get(id) ?? null);
    } catch {
      return ids.map(() => null);
    }
  });
}

export interface AppDataLoaders {
  vesselById: ReturnType<typeof createVesselByIdLoader>;
  aegisAssessmentById: ReturnType<typeof createAegisAssessmentByIdLoader>;
  findingsByAssessmentId: ReturnType<typeof createFindingsByAssessmentIdLoader>;
  aegisIncidentById: ReturnType<typeof createAegisIncidentByIdLoader>;
}

export function createDataLoaders(): AppDataLoaders {
  return {
    vesselById: createVesselByIdLoader(),
    aegisAssessmentById: createAegisAssessmentByIdLoader(),
    findingsByAssessmentId: createFindingsByAssessmentIdLoader(),
    aegisIncidentById: createAegisIncidentByIdLoader(),
  };
}
