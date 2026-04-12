declare module "expo-sqlite" {
  export interface SQLiteDatabase {
    runAsync(sql: string, params?: unknown[]): Promise<void>;
    getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
    getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
    closeAsync(): Promise<void>;
  }
  export function openDatabaseSync(name: string): SQLiteDatabase;
  export function openDatabaseAsync(name: string): Promise<SQLiteDatabase>;
}
