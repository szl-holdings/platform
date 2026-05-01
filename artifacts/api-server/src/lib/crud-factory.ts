import type { Request, Response } from 'express';
import { handleRouteError, sendNotFound, sendSuccess, parsePagination } from './api-response';

export type DbTable = Record<string, unknown>;

export interface CrudListOptions<TRow> {
  fetchPage: (opts: { limit: number; offset: number }) => Promise<TRow[]>;
  countTotal?: () => Promise<number>;
  transform?: (row: TRow) => unknown;
  errorLabel: string;
}

export async function handleList<TRow>(
  req: Request,
  res: Response,
  opts: CrudListOptions<TRow>,
): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const offset = (page - 1) * limit;
    const rows = await opts.fetchPage({ limit, offset });
    const total = opts.countTotal ? await opts.countTotal() : undefined;
    const data = opts.transform ? rows.map(opts.transform) : rows;
    sendSuccess(res, data, 200, total !== undefined ? { page, limit, total } : undefined);
  } catch (err) {
    handleRouteError(res, err, opts.errorLabel);
  }
}

export interface CrudGetOneOptions<TRow> {
  fetch: (id: number | string) => Promise<TRow | undefined | null>;
  entityName: string;
  transform?: (row: TRow) => unknown;
  errorLabel: string;
}

export async function handleGetOne<TRow>(
  req: Request,
  res: Response,
  id: number | string,
  opts: CrudGetOneOptions<TRow>,
): Promise<void> {
  try {
    const row = await opts.fetch(id);
    if (!row) {
      sendNotFound(res, opts.entityName);
      return;
    }
    sendSuccess(res, opts.transform ? opts.transform(row) : row);
  } catch (err) {
    handleRouteError(res, err, opts.errorLabel);
  }
}

export interface CrudCreateOptions<TRow> {
  create: (body: unknown) => Promise<TRow>;
  transform?: (row: TRow) => unknown;
  errorLabel: string;
  status?: number;
}

export async function handleCreate<TRow>(
  req: Request,
  res: Response,
  opts: CrudCreateOptions<TRow>,
): Promise<void> {
  try {
    const row = await opts.create(req.body);
    const data = opts.transform ? opts.transform(row) : row;
    sendSuccess(res, data, opts.status ?? 201);
  } catch (err) {
    handleRouteError(res, err, opts.errorLabel);
  }
}

export interface CrudUpdateOptions<TRow> {
  update: (id: number | string, body: unknown) => Promise<TRow | undefined | null>;
  entityName: string;
  transform?: (row: TRow) => unknown;
  errorLabel: string;
}

export async function handleUpdate<TRow>(
  req: Request,
  res: Response,
  id: number | string,
  opts: CrudUpdateOptions<TRow>,
): Promise<void> {
  try {
    const row = await opts.update(id, req.body);
    if (!row) {
      sendNotFound(res, opts.entityName);
      return;
    }
    sendSuccess(res, opts.transform ? opts.transform(row) : row);
  } catch (err) {
    handleRouteError(res, err, opts.errorLabel);
  }
}

export interface CrudDeleteOptions {
  remove: (id: number | string) => Promise<boolean>;
  entityName: string;
  errorLabel: string;
}

export async function handleDelete(
  req: Request,
  res: Response,
  id: number | string,
  opts: CrudDeleteOptions,
): Promise<void> {
  try {
    const found = await opts.remove(id);
    if (!found) {
      sendNotFound(res, opts.entityName);
      return;
    }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, opts.errorLabel);
  }
}
