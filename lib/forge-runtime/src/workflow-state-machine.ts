export type WorkflowStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface WorkflowTransition {
  from: WorkflowStatus | WorkflowStatus[];
  to: WorkflowStatus;
  guard?: (ctx: WorkflowContext) => boolean;
  effect?: (ctx: WorkflowContext) => void | Promise<void>;
}

export interface WorkflowContext {
  id: string;
  status: WorkflowStatus;
  metadata: Record<string, unknown>;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
}

const TRANSITIONS: WorkflowTransition[] = [
  {
    from: 'pending',
    to: 'running',
    effect: (ctx) => {
      ctx.startedAt = new Date();
    },
  },
  { from: 'running', to: 'paused' },
  { from: 'paused', to: 'running' },
  {
    from: 'running',
    to: 'completed',
    effect: (ctx) => {
      ctx.completedAt = new Date();
    },
  },
  {
    from: ['running', 'paused'],
    to: 'failed',
    effect: (ctx) => {
      ctx.failedAt = new Date();
    },
  },
  { from: ['pending', 'running', 'paused'], to: 'cancelled' },
];

export class WorkflowStateMachine {
  private context: WorkflowContext;
  private transitions: WorkflowTransition[];

  constructor(
    id: string,
    metadata: Record<string, unknown> = {},
    transitions: WorkflowTransition[] = TRANSITIONS,
  ) {
    this.context = { id, status: 'pending', metadata };
    this.transitions = transitions;
  }

  get state(): WorkflowStatus {
    return this.context.status;
  }

  get snapshot(): Readonly<WorkflowContext> {
    return { ...this.context };
  }

  canTransition(to: WorkflowStatus): boolean {
    return this.transitions.some((t) => {
      const fromMatch = Array.isArray(t.from)
        ? t.from.includes(this.context.status)
        : t.from === this.context.status;
      return fromMatch && t.to === to && (!t.guard || t.guard(this.context));
    });
  }

  async transition(
    to: WorkflowStatus,
    options: { error?: string; metadata?: Record<string, unknown> } = {},
  ): Promise<void> {
    const transition = this.transitions.find((t) => {
      const fromMatch = Array.isArray(t.from)
        ? t.from.includes(this.context.status)
        : t.from === this.context.status;
      return fromMatch && t.to === to && (!t.guard || t.guard(this.context));
    });

    if (!transition) {
      throw new Error(
        `Invalid transition: ${this.context.status} → ${to} for workflow "${this.context.id}"`,
      );
    }

    if (options.metadata) {
      Object.assign(this.context.metadata, options.metadata);
    }
    if (options.error) {
      this.context.error = options.error;
    }

    this.context.status = to;

    if (transition.effect) {
      await transition.effect(this.context);
    }
  }

  async start(): Promise<void> {
    return this.transition('running');
  }
  async pause(): Promise<void> {
    return this.transition('paused');
  }
  async resume(): Promise<void> {
    return this.transition('running');
  }
  async complete(): Promise<void> {
    return this.transition('completed');
  }
  async fail(error: string): Promise<void> {
    return this.transition('failed', { error });
  }
  async cancel(): Promise<void> {
    return this.transition('cancelled');
  }
}
