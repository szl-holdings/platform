/**
 * Lightweight demo adapters consumed by `@szl-holdings/demo-seed` for the
 * signal-mesh seeder. These are intentionally stateless stubs that satisfy the
 * shape expected by the seeder; production connectors live in `./connectors/`.
 */

export interface DemoAdapterEvent {
  source: string;
  kind: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export interface DemoAdapter {
  readonly id: string;
  readonly source: string;
  emit(): Promise<DemoAdapterEvent[]>;
}

abstract class BaseDemoAdapter implements DemoAdapter {
  abstract readonly id: string;
  abstract readonly source: string;
  abstract readonly kind: string;

  async emit(): Promise<DemoAdapterEvent[]> {
    return [
      {
        source: this.source,
        kind: this.kind,
        payload: { adapter: this.id, demo: true },
        occurredAt: new Date(),
      },
    ];
  }
}

export class StorageDocsDemoAdapter extends BaseDemoAdapter {
  readonly id = 'storage-docs';
  readonly source = 'storage-docs-demo';
  readonly kind = 'document.uploaded';
}

export class WebhookDemoAdapter extends BaseDemoAdapter {
  readonly id = 'webhook';
  readonly source = 'webhook-demo';
  readonly kind = 'webhook.received';
}

export class AISMaritimeDemoAdapter extends BaseDemoAdapter {
  readonly id = 'ais-maritime';
  readonly source = 'ais-maritime-demo';
  readonly kind = 'vessel.position';
}

export class CrmProjectDemoAdapter extends BaseDemoAdapter {
  readonly id = 'crm-project';
  readonly source = 'crm-project-demo';
  readonly kind = 'project.updated';
}

export class EmailCalendarDemoAdapter extends BaseDemoAdapter {
  readonly id = 'email-calendar';
  readonly source = 'email-calendar-demo';
  readonly kind = 'calendar.event';
}

export class LegalMatterDemoAdapter extends BaseDemoAdapter {
  readonly id = 'legal-matter';
  readonly source = 'legal-matter-demo';
  readonly kind = 'matter.updated';
}

export class MessagingDemoAdapter extends BaseDemoAdapter {
  readonly id = 'messaging';
  readonly source = 'messaging-demo';
  readonly kind = 'message.received';
}

export class PropertyOpsDemoAdapter extends BaseDemoAdapter {
  readonly id = 'property-ops';
  readonly source = 'property-ops-demo';
  readonly kind = 'property.event';
}

export class SecurityToolsDemoAdapter extends BaseDemoAdapter {
  readonly id = 'security-tools';
  readonly source = 'security-tools-demo';
  readonly kind = 'security.alert';
}
