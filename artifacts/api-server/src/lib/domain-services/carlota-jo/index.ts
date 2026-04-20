import { domainEventBus } from '../../domain-events/index.js';

// ─── Port Interfaces ───────────────────────────────────────────────────────────

export interface CarlotaJoStoragePort {
  listServices(args: { category?: string; isActive?: boolean; limit: number }): Promise<unknown[]>;
  listReservations(args: { status?: string; limit: number; offset: number }): Promise<unknown[]>;
  getReservationByConfirmationId(confirmationId: string): Promise<unknown | null>;
  listInquiries(args: { status?: string; limit: number; offset: number }): Promise<unknown[]>;
  listClientProfiles(args: { limit: number; offset: number }): Promise<unknown[]>;
  createInquiry(data: {
    name: string;
    email: string;
    service: string;
    message: string;
    status: string;
  }): Promise<unknown>;
}

// ─── Domain Service Functions ─────────────────────────────────────────────────

export async function listCarlotaServices(
  storage: CarlotaJoStoragePort,
  args: { category?: string; isActive?: boolean; limit?: number },
) {
  return storage.listServices({
    category: args.category,
    isActive: args.isActive,
    limit: args.limit ?? 50,
  });
}

export async function listCarlotaReservations(
  storage: CarlotaJoStoragePort,
  args: { status?: string; limit?: number; offset?: number },
) {
  return storage.listReservations({
    status: args.status,
    limit: args.limit ?? 50,
    offset: args.offset ?? 0,
  });
}

export async function getCarlotaReservation(storage: CarlotaJoStoragePort, confirmationId: string) {
  return storage.getReservationByConfirmationId(confirmationId);
}

export async function listCarlotaInquiries(
  storage: CarlotaJoStoragePort,
  args: { status?: string; limit?: number; offset?: number },
) {
  return storage.listInquiries({
    status: args.status,
    limit: args.limit ?? 50,
    offset: args.offset ?? 0,
  });
}

export async function listCarlotaClientProfiles(
  storage: CarlotaJoStoragePort,
  args: { limit?: number; offset?: number },
) {
  return storage.listClientProfiles({ limit: args.limit ?? 50, offset: args.offset ?? 0 });
}

export async function createCarlotaInquiry(
  storage: CarlotaJoStoragePort,
  data: { name: string; email: string; service: string; message: string },
) {
  const inquiry = (await storage.createInquiry({
    name: data.name,
    email: data.email,
    service: data.service,
    message: data.message,
    status: 'new',
  })) as Record<string, unknown>;

  domainEventBus.publish('carlota-jo.inquiry-created', {
    inquiryId: inquiry.id as number,
    name: data.name,
    service: data.service,
    status: 'new',
  });

  return inquiry;
}
