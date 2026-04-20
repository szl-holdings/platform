import { Activity, ChevronDown, ChevronUp, Clock, MessageCircle, Send, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from './api-fetch';

export interface Comment {
  id: number;
  entityType: string;
  entityId: string;
  authorId: number | null;
  authorName: string;
  authorInitials: string;
  content: string;
  mentions: string[];
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const ts = new Date(iso).getTime();
  const diff = Math.floor((now - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function renderMarkdown(content: string): React.ReactNode {
  const segments: React.ReactNode[] = [];
  let remaining = content;
  let key = 0;

  const patterns: Array<{ regex: RegExp; render: (match: RegExpExecArray) => React.ReactNode }> = [
    {
      regex: /`([^`]+)`/,
      render: (m) => (
        <code
          key={key++}
          className="bg-muted/60 text-primary/90 px-1 py-0.5 rounded text-[10px] font-mono"
        >
          {m[1]}
        </code>
      ),
    },
    {
      regex: /\*\*(.+?)\*\*/,
      render: (m) => (
        <strong key={key++} className="font-semibold text-foreground">
          {m[1]}
        </strong>
      ),
    },
    {
      regex: /\*(.+?)\*/,
      render: (m) => (
        <em key={key++} className="italic text-muted-foreground/90">
          {m[1]}
        </em>
      ),
    },
    {
      regex: /@(\w[\w.-]*)/,
      render: (m) => (
        <span key={key++} className="text-primary font-semibold">
          @{m[1]}
        </span>
      ),
    },
  ];

  while (remaining.length > 0) {
    let earliest: {
      index: number;
      match: RegExpExecArray;
      render: (m: RegExpExecArray) => React.ReactNode;
    } | null = null;

    for (const { regex, render } of patterns) {
      const m = regex.exec(remaining);
      if (m && (earliest === null || m.index < earliest.index)) {
        earliest = { index: m.index, match: m, render };
      }
    }

    if (!earliest) {
      segments.push(<span key={key++}>{remaining}</span>);
      break;
    }

    if (earliest.index > 0) {
      segments.push(<span key={key++}>{remaining.slice(0, earliest.index)}</span>);
    }
    segments.push(earliest.render(earliest.match));
    remaining = remaining.slice(earliest.index + earliest.match[0].length);
  }

  return <>{segments}</>;
}

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-[#6b8f71]',
  'bg-[#d4a054]',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-teal-500',
];

function Avatar({ initials, name }: { initials: string; name: string }) {
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${AVATAR_COLORS[idx]}`}
      title={name}
    >
      {initials}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  onDelete?: (id: number) => void;
  currentUserName?: string;
}

function CommentItem({ comment, onDelete, currentUserName }: CommentItemProps) {
  const canDelete =
    currentUserName && (comment.authorName === currentUserName || currentUserName === 'Admin');

  return (
    <div className="flex gap-2.5 group">
      <Avatar initials={comment.authorInitials} name={comment.authorName} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-foreground">{comment.authorName}</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {formatRelativeTime(comment.createdAt)}
          </span>
          {canDelete && (
            <button
              onClick={() => onDelete?.(comment.id)}
              className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-0.5 rounded"
              title="Delete comment"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
          {renderMarkdown(comment.content)}
        </p>
      </div>
    </div>
  );
}

interface CommentInputProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  authorName?: string;
  onAuthorNameChange?: (name: string) => void;
  showNameInput?: boolean;
}

function CommentInput({
  onSubmit,
  placeholder = 'Add a comment... Use @name to mention, **bold**, *italic*, `code`',
  authorName,
  onAuthorNameChange,
  showNameInput,
}: CommentInputProps) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setValue('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div className="space-y-2">
      {showNameInput && (
        <input
          className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          placeholder="Your name"
          value={authorName || ''}
          onChange={(e) => onAuthorNameChange?.(e.target.value)}
          maxLength={80}
        />
      )}
      <div className="flex gap-2">
        <textarea
          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          maxLength={2000}
        />
        <button
          onClick={() => void handleSubmit()}
          disabled={!value.trim() || submitting}
          className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 self-end"
        >
          {submitting ? (
            <span className="w-3 h-3 border border-primary-foreground/50 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <Send className="w-3 h-3" />
          )}
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        ⌘+Enter to submit · Markdown: **bold** *italic* `code`
      </p>
    </div>
  );
}

export interface CommentThreadProps {
  entityType: string;
  entityId: string | number;
  title?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  currentUserName?: string;
  className?: string;
}

export function CommentThread({
  entityType,
  entityId,
  title = 'Discussion',
  collapsible = true,
  defaultCollapsed = false,
  currentUserName,
  className = '',
}: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [authorName, setAuthorName] = useState(currentUserName || '');

  const entityIdStr = String(entityId);

  const fetchComments = useCallback(async () => {
    try {
      const raw = await apiFetch<Comment[]>(`/comments/${entityType}/${entityIdStr}`);
      setComments(Array.isArray(raw) ? raw : []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityIdStr]);

  useEffect(() => {
    void fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (content: string) => {
    const mentions = Array.from(content.matchAll(/@(\w[\w.-]*)/g)).map((m) => m[1]);
    await apiFetch(`/comments/${entityType}/${entityIdStr}`, {
      method: 'POST',
      body: JSON.stringify({ content, mentions, authorName: authorName || 'Team Member' }),
    });
    await fetchComments();
  };

  const handleDelete = async (id: number) => {
    await apiFetch(`/comments/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ authorName }),
    });
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const showNameInput = !currentUserName;

  return (
    <div className={`rounded-xl border border-border bg-card overflow-hidden ${className}`}>
      <button
        type="button"
        className={`w-full px-4 py-3 flex items-center justify-between border-b border-border bg-muted/30 ${collapsible ? 'cursor-pointer hover:bg-muted/50 transition-colors' : 'cursor-default'}`}
        onClick={() => collapsible && setCollapsed(!collapsed)}
        disabled={!collapsible}
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{title}</span>
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground font-mono">
            {comments.length}
          </span>
        </div>
        {collapsible &&
          (collapsed ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ))}
      </button>

      {!collapsed && (
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-2.5 animate-pulse">
                  <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 w-24 bg-muted rounded" />
                    <div className="h-2 w-full bg-muted rounded" />
                    <div className="h-2 w-3/4 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                No comments yet. Start the discussion.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {[...comments].reverse().map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onDelete={(id) => void handleDelete(id)}
                  currentUserName={currentUserName || authorName}
                />
              ))}
            </div>
          )}

          <div className="border-t border-border pt-3">
            <CommentInput
              onSubmit={handleSubmit}
              showNameInput={showNameInput}
              authorName={authorName}
              onAuthorNameChange={setAuthorName}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const entityLabels: Record<string, string> = {
  vessel: 'Vessel',
  alert: 'Alert',
  incident: 'Incident',
  ticket: 'Ticket',
  property: 'Property',
  experiment: 'Experiment',
  campaign: 'Campaign',
  risk: 'Risk',
  milestone: 'Milestone',
};

const entityPaths: Record<string, (id: string) => string> = {
  vessel: (id) => `/vessels/vessel/${id}`,
  incident: (id) => `/firestorm/incidents/${id}`,
  alert: (id) => `/firestorm/alerts/${id}`,
  ticket: (id) => `/firestorm/ops/tickets/${id}`,
  property: (id) => `/terra/properties/${id}`,
  experiment: (id) => `/firestorm/intel/experiments/${id}`,
  campaign: (id) => `/dreamscape/campaigns/${id}`,
  risk: (id) => `/firestorm/cr/risks/${id}`,
};

export interface ActivityFeedProps {
  entityType?: string;
  limit?: number;
  title?: string;
  className?: string;
  compact?: boolean;
}

export function ActivityFeed({
  entityType,
  limit = 10,
  title = 'Recent Activity',
  className = '',
  compact = false,
}: ActivityFeedProps) {
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (entityType) params.set('entityType', entityType);
    apiFetch<Comment[]>(`/comments/activity-feed?${params}`)
      .then((raw) => {
        setItems(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [entityType, limit]);

  return (
    <div className={`rounded-xl border border-border bg-card overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
        <Activity className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{title}</span>
        {!loading && (
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground font-mono ml-auto">
            {items.length} events
          </span>
        )}
      </div>

      <div className={compact ? 'divide-y divide-border/50' : 'p-4 space-y-3'}>
        {loading ? (
          <div className={compact ? 'p-4' : ''}>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-2.5 animate-pulse">
                  <div className="w-6 h-6 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 w-32 bg-muted rounded" />
                    <div className="h-2 w-full bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-6">
            <Activity className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          items.map((item) => {
            const entityLabel = entityLabels[item.entityType] || item.entityType;
            const entityPath = entityPaths[item.entityType]?.(item.entityId);
            const entityDisplay = `${entityLabel} #${item.entityId}`;

            return (
              <div
                key={item.id}
                className={
                  compact
                    ? 'flex gap-2.5 px-4 py-3 hover:bg-muted/20 transition-colors'
                    : 'flex gap-2.5'
                }
              >
                <Avatar initials={item.authorInitials} name={item.authorName} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-foreground">{item.authorName}</span>
                    <span className="text-[10px] text-muted-foreground">commented on</span>
                    {entityPath ? (
                      <a
                        href={entityPath}
                        className="text-[10px] font-medium text-primary/80 hover:text-primary underline-offset-2 hover:underline transition-colors"
                      >
                        {entityDisplay}
                      </a>
                    ) : (
                      <span className="text-[10px] font-medium text-primary/80">
                        {entityDisplay}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {renderMarkdown(item.content)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
