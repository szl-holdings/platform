import { ApiError } from "@szl-holdings/shared-ui/api-fetch";
import { useMemo, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import { useAuth } from "@szl-holdings/replit-auth-web";
import {

  Rocket,
  History,
  RotateCcw,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  GitCommit,
  Server,
  Clock,
  User,
  X,
  Users,
  BellRing,
  Mail,
  ShieldAlert,
  Send,
  Calendar,
  Trash2,
  Plus,
  Save,
} from "lucide-react";
import { useStandardMutation, useStandardQuery } from "@szl-holdings/api-client-react";

type DeploymentStatus = "active" | "deploying" | "rolled-back" | "failed" | "inactive";
type DeploymentEnvironment = "development" | "staging" | "production";

interface DeploymentUserSummary {
  id: number;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  team: string | null;
}

interface DeploymentRecord {
  appId: string;
  appName: string;
  version: string;
  environment: DeploymentEnvironment;
  status: DeploymentStatus;
  deployedAt: string;
  deployedBy: string;
  deployedByUser?: DeploymentUserSummary;
  ownerTeam?: string;
  commitSha?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

function TeamPill({
  team,
  tone = "owner",
  onClick,
}: {
  team: string;
  tone?: "owner" | "person";
  onClick?: (team: string) => void;
}) {
  const color = tone === "owner" ? "#7dd3fc" : "#cdb8f0";
  const baseStyle = {
    color,
    backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
    border: `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
  } as const;
  const className =
    "inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded";
  const title =
    tone === "owner"
      ? onClick
        ? `Owning team: ${team} — click for roster & on-call`
        : `Owning team: ${team}`
      : onClick
      ? `On team: ${team} — click for roster & on-call`
      : `On team: ${team}`;
  if (onClick) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(team);
        }}
        className={`${className} hover:brightness-125 transition-[filter] cursor-pointer`}
        style={baseStyle}
        title={title}
        aria-label={`View ${team} team details`}
      >
        {team}
      </button>
    );
  }
  return (
    <span className={className} style={baseStyle} title={title}>
      {team}
    </span>
  );
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function DeployerBadge({
  record,
  size = "sm",
  prefix,
  onTeamClick,
  onUserClick,
}: {
  record: DeploymentRecord;
  size?: "sm" | "md";
  prefix?: string;
  onTeamClick?: (team: string) => void;
  onUserClick?: (userId: number) => void;
}) {
  const user = record.deployedByUser;
  const name = user?.displayName ?? record.deployedBy;
  const dim = size === "md" ? 20 : 16;
  const fontSize = size === "md" ? 9 : 8;
  // Avatar is a clickable target when the deployer is a registered user —
  // opens the user profile drawer (paging history etc).
  const avatarEl = user?.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt=""
      width={dim}
      height={dim}
      className="rounded-full object-cover shrink-0"
      style={{ border: "1px solid var(--color-surface-border)" }}
    />
  ) : (
    <span
      className="inline-flex items-center justify-center rounded-full font-bold shrink-0"
      style={{
        width: dim,
        height: dim,
        fontSize,
        backgroundColor: "color-mix(in srgb, #8b7ac8 18%, transparent)",
        color: "#cdb8f0",
        border: "1px solid color-mix(in srgb, #8b7ac8 30%, transparent)",
      }}
    >
      {initialsFor(name)}
    </span>
  );
  const canOpenProfile = !!(user && onUserClick);
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-mono"
      style={{ color: "var(--color-fg-muted)" }}
      title={user?.email ?? record.deployedBy}
    >
      {prefix && <span className="opacity-70">{prefix}</span>}
      {canOpenProfile ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUserClick!(user!.id);
          }}
          className="inline-flex items-center gap-1.5 hover:brightness-125 transition-[filter] cursor-pointer"
          aria-label={`View ${name}'s paging history`}
          title={`View ${name}'s paging history`}
        >
          {avatarEl}
          <span className="truncate underline decoration-dotted underline-offset-2" style={{ color: "var(--color-fg-secondary, var(--color-fg-primary))" }}>
            {name}
          </span>
        </button>
      ) : (
        <>
          {avatarEl}
          <span className="truncate" style={{ color: "var(--color-fg-secondary, var(--color-fg-primary))" }}>
            {name}
          </span>
        </>
      )}
      {user?.team ? (
        onTeamClick ? (
          <TeamPill team={user.team} tone="person" onClick={onTeamClick} />
        ) : (
          <TeamPill team={user.team} tone="person" />
        )
      ) : !user ? (
        <span
          className="text-[9px] font-mono uppercase tracking-wider px-1 py-0.5 rounded opacity-70"
          style={{
            color: "var(--color-fg-muted)",
            border: "1px dashed var(--color-surface-border)",
          }}
          title="Not a registered user (likely a CI bot or automation)"
        >
          unregistered
        </span>
      ) : null}
    </span>
  );
}

/**
 * For a rollback row, find the latest non-rollback deployment of the same
 * version that preceded it — that's the person who originally shipped that
 * version. Shows "Rolled back by X · originally shipped by Y".
 */
function findOriginalDeployerFor(
  entry: DeploymentRecord,
  history: DeploymentRecord[],
): DeploymentRecord | undefined {
  if (!entry.notes?.startsWith("Rolled back from")) return undefined;
  const entryTime = new Date(entry.deployedAt).getTime();
  const candidates = history
    .filter(
      (h) =>
        h.version === entry.version &&
        new Date(h.deployedAt).getTime() < entryTime &&
        !h.notes?.startsWith("Rolled back from"),
    )
    .sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime());
  return candidates[0];
}

interface ListResponse {
  deployments: DeploymentRecord[];
  environment: string;
  count: number;
}

interface HistoryResponse {
  appId: string;
  environment: string;
  history: DeploymentRecord[];
  count: number;
}

interface RollbackResponse {
  rolledBack: boolean;
  previous: DeploymentRecord;
  current: DeploymentRecord;
}

interface TeamMemberDto {
  id: number;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  platformRole: string | null;
  isActive: boolean;
}
type OnCallSource = "override" | "rotation" | "fallback" | "none";
interface TeamDetailDto {
  team: string;
  members: TeamMemberDto[];
  onCall: TeamMemberDto | null;
  onCallSource?: OnCallSource;
  escalation: TeamMemberDto | null;
  ownedApps: { slug: string; name: string }[];
  count: number;
}

interface ScheduleConfigDto {
  rotationIntervalHours: number;
  memberOrder: number[];
  handoffAnchor: string;
  timezone: string;
  updatedAt: string | null;
  updatedBy: number | null;
}
interface ScheduleOverrideDto {
  id: number;
  userId: number;
  user: TeamMemberDto | null;
  kind: "override" | "shift";
  startAt: string;
  endAt: string;
  note: string | null;
  createdBy: number | null;
  createdAt: string;
}
interface ScheduleResponseDto {
  team: string;
  schedule: ScheduleConfigDto | null;
  overrides: ScheduleOverrideDto[];
  currentOnCall: TeamMemberDto | null;
  currentOnCallSource: OnCallSource;
}
interface PageResponse {
  paged: boolean;
  reason?: string;
  team: string;
  onCall: TeamMemberDto | null;
  urgency?: string;
  inAppDelivered?: boolean;
  mutedAsDuplicate?: boolean;
  duplicateOfPageId?: number | null;
}

interface TeamPageActor {
  id: number;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
}
interface TeamPageHistoryEntryDto {
  id: number;
  team: string;
  urgency: "info" | "warning" | "critical";
  message: string | null;
  inAppDelivered: boolean;
  mutedAsDuplicate: boolean;
  duplicateOfPageId: number | null;
  createdAt: string;
  actor: TeamPageActor | null;
  recipient: TeamPageActor | null;
}
interface TeamPagesResponse {
  team: string;
  count: number;
  pages: TeamPageHistoryEntryDto[];
}

const URGENCY_COLOR: Record<TeamPageHistoryEntryDto["urgency"], string> = {
  info: "#7dd3fc",
  warning: "#f59e0b",
  critical: "#ef4444",
};

function formatPageTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const now = Date.now();
  const diffSec = Math.round((now - d.getTime()) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.round(diffSec / 60)}m ago`;
  if (diffSec < 86_400) return `${Math.round(diffSec / 3600)}h ago`;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MemberRow({ m, badge }: { m: TeamMemberDto; badge?: { label: string; color: string } }) {
  return (
    <div
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-md"
      style={{
        backgroundColor: badge ? `color-mix(in srgb, ${badge.color} 10%, transparent)` : "var(--color-bg-elevated)",
        border: badge
          ? `1px solid color-mix(in srgb, ${badge.color} 30%, transparent)`
          : "1px solid var(--color-surface-border)",
        opacity: m.isActive ? 1 : 0.55,
      }}
    >
      {m.avatarUrl ? (
        <img
          src={m.avatarUrl}
          alt=""
          width={22}
          height={22}
          className="rounded-full object-cover shrink-0"
          style={{ border: "1px solid var(--color-surface-border)" }}
        />
      ) : (
        <span
          className="inline-flex items-center justify-center rounded-full font-bold shrink-0"
          style={{
            width: 22,
            height: 22,
            fontSize: 9,
            backgroundColor: "color-mix(in srgb, #8b7ac8 18%, transparent)",
            color: "#cdb8f0",
            border: "1px solid color-mix(in srgb, #8b7ac8 30%, transparent)",
          }}
        >
          {initialsFor(m.displayName)}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold truncate">{m.displayName}</span>
          {!m.isActive && (
            <span className="text-[9px] font-mono uppercase opacity-70" style={{ color: "var(--color-fg-muted)" }}>
              inactive
            </span>
          )}
        </div>
        <div className="text-[10px] font-mono truncate" style={{ color: "var(--color-fg-muted)" }}>
          {m.email ?? "no email"} {m.platformRole ? `· ${m.platformRole}` : ""}
        </div>
      </div>
      {badge && (
        <span
          className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
          style={{
            color: badge.color,
            backgroundColor: `color-mix(in srgb, ${badge.color} 15%, transparent)`,
            border: `1px solid color-mix(in srgb, ${badge.color} 35%, transparent)`,
          }}
        >
          {badge.label}
        </span>
      )}
      {m.email && (
        <a
          href={`mailto:${m.email}`}
          onClick={(e) => e.stopPropagation()}
          title={`Email ${m.displayName}`}
          className="shrink-0 opacity-70 hover:opacity-100"
          style={{ color: "var(--color-fg-muted)" }}
        >
          <Mail className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}


const ADMIN_ROLES_FOR_SCHEDULE = new Set(["admin", "super_admin", "ops"]);

function fmtDateTimeLocal(d: Date): string {
  // For <input type="datetime-local"> — needs YYYY-MM-DDTHH:mm, no timezone.
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ScheduleSourceBadge({ source }: { source: OnCallSource }) {
  if (source === "override") {
    return (
      <span
        className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ml-1.5"
        style={{
          color: "#fcd34d",
          backgroundColor: "color-mix(in srgb, #fcd34d 14%, transparent)",
          border: "1px solid color-mix(in srgb, #fcd34d 30%, transparent)",
        }}
        title="An override is currently in effect"
      >
        override
      </span>
    );
  }
  if (source === "rotation") {
    return (
      <span
        className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ml-1.5"
        style={{
          color: "#7dd3fc",
          backgroundColor: "color-mix(in srgb, #7dd3fc 14%, transparent)",
          border: "1px solid color-mix(in srgb, #7dd3fc 30%, transparent)",
        }}
        title="From the configured rotation"
      >
        rotation
      </span>
    );
  }
  if (source === "fallback") {
    return (
      <span
        className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ml-1.5 opacity-80"
        style={{
          color: "var(--color-fg-muted)",
          border: "1px dashed var(--color-surface-border)",
        }}
        title="No schedule configured — using weekly auto-rotation"
      >
        auto
      </span>
    );
  }
  return null;
}

function ScheduleEditor({
  team,
  members,
  canEdit,
}: {
  team: string;
  members: TeamMemberDto[];
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const scheduleQuery = useStandardQuery<ScheduleResponseDto>({
    queryKey: ["team", team, "schedule"],
    queryFn: () => apiFetch<ScheduleResponseDto>(`/teams/${encodeURIComponent(team)}/schedule`),
  });

  const [intervalHours, setIntervalHours] = useState<number>(168);
  const [memberOrder, setMemberOrder] = useState<number[]>([]);
  const [handoffAnchor, setHandoffAnchor] = useState<string>(fmtDateTimeLocal(new Date()));
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleStatus, setScheduleStatus] = useState<string | null>(null);

  // Hydrate the editor inputs once a fresh schedule loads.
  useEffect(() => {
    const data = scheduleQuery.data;
    if (!data) return;
    if (data.schedule) {
      setIntervalHours(data.schedule.rotationIntervalHours);
      setMemberOrder(data.schedule.memberOrder);
      setHandoffAnchor(fmtDateTimeLocal(new Date(data.schedule.handoffAnchor)));
    } else {
      setIntervalHours(168);
      setMemberOrder([]);
      setHandoffAnchor(fmtDateTimeLocal(new Date()));
    }
  }, [scheduleQuery.data]);

  const saveMutation = useStandardMutation({
    mutationFn: () =>
      apiFetch<ScheduleResponseDto>(`/teams/${encodeURIComponent(team)}/schedule`, {
        method: "PUT",
        body: JSON.stringify({
          rotationIntervalHours: intervalHours,
          memberOrder,
          handoffAnchor: new Date(handoffAnchor).toISOString(),
          timezone: "UTC",
        }),
      }),
    onSuccess: () => {
      setScheduleError(null);
      setScheduleStatus("Schedule saved.");
      void queryClient.invalidateQueries({ queryKey: ["team", team] });
      void queryClient.invalidateQueries({ queryKey: ["team", team, "schedule"] });
    },
    onError: (err: unknown) => {
      setScheduleStatus(null);
      setScheduleError(err instanceof ApiError ? err.message : "Failed to save schedule");
    },
  });

  const [overrideUserId, setOverrideUserId] = useState<number | "">("");
  const now = useMemo(() => new Date(), []);
  const inOneHour = useMemo(() => new Date(now.getTime() + 60 * 60 * 1000), [now]);
  const [overrideStart, setOverrideStart] = useState<string>(fmtDateTimeLocal(now));
  const [overrideEnd, setOverrideEnd] = useState<string>(fmtDateTimeLocal(inOneHour));
  const [overrideNote, setOverrideNote] = useState<string>("");

  const addOverrideMutation = useStandardMutation({
    mutationFn: () =>
      apiFetch<ScheduleResponseDto>(`/teams/${encodeURIComponent(team)}/schedule/overrides`, {
        method: "POST",
        body: JSON.stringify({
          userId: overrideUserId,
          startAt: new Date(overrideStart).toISOString(),
          endAt: new Date(overrideEnd).toISOString(),
          note: overrideNote || undefined,
        }),
      }),
    onSuccess: () => {
      setScheduleError(null);
      setScheduleStatus("Override added.");
      setOverrideNote("");
      void queryClient.invalidateQueries({ queryKey: ["team", team] });
      void queryClient.invalidateQueries({ queryKey: ["team", team, "schedule"] });
    },
    onError: (err: unknown) => {
      setScheduleStatus(null);
      setScheduleError(err instanceof ApiError ? err.message : "Failed to add override");
    },
  });

  const deleteOverrideMutation = useStandardMutation({
    mutationFn: (id: number) =>
      apiFetch<ScheduleResponseDto>(
        `/teams/${encodeURIComponent(team)}/schedule/overrides/${id}`,
        { method: "DELETE" },
      ),
    onSuccess: () => {
      setScheduleError(null);
      setScheduleStatus("Override removed.");
      void queryClient.invalidateQueries({ queryKey: ["team", team] });
      void queryClient.invalidateQueries({ queryKey: ["team", team, "schedule"] });
    },
    onError: (err: unknown) => {
      setScheduleStatus(null);
      setScheduleError(err instanceof ApiError ? err.message : "Failed to remove override");
    },
  });

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const orderedMembers = memberOrder.map((id) => memberById.get(id)).filter((m): m is TeamMemberDto => !!m);
  const unrostered = members.filter((m) => !memberOrder.includes(m.id));

  const moveMember = (id: number, dir: -1 | 1) => {
    setMemberOrder((prev) => {
      const i = prev.indexOf(id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
  };

  return (
    <section>
      <div
        className="text-[10px] font-mono uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
        style={{ color: "var(--color-fg-muted)" }}
      >
        <Calendar className="w-3 h-3" /> On-call schedule
        {scheduleQuery.data?.currentOnCallSource && (
          <ScheduleSourceBadge source={scheduleQuery.data.currentOnCallSource} />
        )}
      </div>

      {scheduleQuery.isLoading ? (
        <div className="text-[11px]" style={{ color: "var(--color-fg-muted)" }}>
          Loading schedule…
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Rotation config */}
          <div
            className="rounded-md p-3 flex flex-col gap-2"
            style={{ border: "1px solid var(--color-surface-border)" }}
          >
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--color-fg-muted)" }}>
                Cadence
              </label>
              <select
                value={intervalHours}
                onChange={(e) => setIntervalHours(parseInt(e.target.value, 10))}
                disabled={!canEdit}
                className="bg-transparent text-[11px] font-mono outline-none rounded px-2 py-1"
                style={{
                  color: "var(--color-fg-primary)",
                  border: "1px solid var(--color-surface-border)",
                }}
              >
                <option value={168}>weekly (168h)</option>
                <option value={84}>twice-weekly (84h)</option>
                <option value={24}>daily (24h)</option>
                <option value={12}>every 12h</option>
                <option value={8}>every 8h</option>
                <option value={0}>disabled (use overrides only)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--color-fg-muted)" }}>
                Handoff anchor
              </label>
              <input
                type="datetime-local"
                value={handoffAnchor}
                onChange={(e) => setHandoffAnchor(e.target.value)}
                disabled={!canEdit}
                className="bg-transparent text-[11px] font-mono outline-none rounded px-2 py-1"
                style={{
                  color: "var(--color-fg-primary)",
                  border: "1px solid var(--color-surface-border)",
                }}
              />
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: "var(--color-fg-muted)" }}>
                Rotation order ({orderedMembers.length})
              </div>
              {orderedMembers.length === 0 ? (
                <div className="text-[11px] mb-1" style={{ color: "var(--color-fg-muted)" }}>
                  No members in rotation. Add some below.
                </div>
              ) : (
                <ol className="flex flex-col gap-1">
                  {orderedMembers.map((m, i) => (
                    <li
                      key={m.id}
                      className="flex items-center gap-2 px-2 py-1 rounded"
                      style={{
                        backgroundColor: "var(--color-bg-elevated)",
                        border: "1px solid var(--color-surface-border)",
                      }}
                    >
                      <span className="text-[10px] font-mono opacity-60 w-4">{i + 1}.</span>
                      <span className="text-xs flex-1 truncate">{m.displayName}</span>
                      {canEdit && (
                        <>
                          <button
                            type="button"
                            onClick={() => moveMember(m.id, -1)}
                            disabled={i === 0}
                            className="text-[10px] px-1.5 py-0.5 rounded disabled:opacity-30"
                            style={{ border: "1px solid var(--color-surface-border)", color: "var(--color-fg-muted)" }}
                            aria-label={`Move ${m.displayName} up`}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveMember(m.id, 1)}
                            disabled={i === orderedMembers.length - 1}
                            className="text-[10px] px-1.5 py-0.5 rounded disabled:opacity-30"
                            style={{ border: "1px solid var(--color-surface-border)", color: "var(--color-fg-muted)" }}
                            aria-label={`Move ${m.displayName} down`}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setMemberOrder((prev) => prev.filter((id) => id !== m.id))
                            }
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ border: "1px solid var(--color-surface-border)", color: "#fca5a5" }}
                            aria-label={`Remove ${m.displayName} from rotation`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ol>
              )}

              {canEdit && unrostered.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {unrostered.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMemberOrder((prev) => [...prev, m.id])}
                      className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: "var(--color-bg-elevated)",
                        border: "1px dashed var(--color-surface-border)",
                        color: "var(--color-fg-muted)",
                      }}
                    >
                      <Plus className="w-3 h-3" />
                      {m.displayName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="self-start mt-1 inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-md disabled:opacity-50"
                style={{
                  backgroundColor: "color-mix(in srgb, #7dd3fc 18%, transparent)",
                  border: "1px solid color-mix(in srgb, #7dd3fc 40%, transparent)",
                  color: "#7dd3fc",
                }}
              >
                {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save rotation
              </button>
            )}
          </div>

          {/* Overrides */}
          <div
            className="rounded-md p-3 flex flex-col gap-2"
            style={{ border: "1px solid var(--color-surface-border)" }}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--color-fg-muted)" }}>
              Overrides &amp; swaps
            </div>
            {(scheduleQuery.data?.overrides ?? []).length === 0 ? (
              <div className="text-[11px]" style={{ color: "var(--color-fg-muted)" }}>
                No overrides scheduled.
              </div>
            ) : (
              <ul className="flex flex-col gap-1">
                {scheduleQuery.data!.overrides.map((o) => {
                  const start = new Date(o.startAt);
                  const end = new Date(o.endAt);
                  const active = start <= now && end > now;
                  return (
                    <li
                      key={o.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded text-[11px]"
                      style={{
                        backgroundColor: active
                          ? "color-mix(in srgb, #fcd34d 12%, transparent)"
                          : "var(--color-bg-elevated)",
                        border: active
                          ? "1px solid color-mix(in srgb, #fcd34d 35%, transparent)"
                          : "1px solid var(--color-surface-border)",
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">
                          {o.user?.displayName ?? `user#${o.userId}`}
                          {active && (
                            <span className="ml-1.5 text-[9px] font-mono uppercase" style={{ color: "#fcd34d" }}>
                              active
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[10px]" style={{ color: "var(--color-fg-muted)" }}>
                          {formatTime(o.startAt)} → {formatTime(o.endAt)}
                          {o.note ? ` · ${o.note}` : ""}
                        </div>
                      </div>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => deleteOverrideMutation.mutate(o.id)}
                          disabled={deleteOverrideMutation.isPending}
                          className="text-[10px] px-1.5 py-0.5 rounded disabled:opacity-50"
                          style={{ border: "1px solid var(--color-surface-border)", color: "#fca5a5" }}
                          aria-label="Remove override"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {canEdit && (
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={overrideUserId}
                    onChange={(e) =>
                      setOverrideUserId(e.target.value === "" ? "" : parseInt(e.target.value, 10))
                    }
                    className="bg-transparent text-[11px] font-mono outline-none rounded px-2 py-1"
                    style={{
                      color: "var(--color-fg-primary)",
                      border: "1px solid var(--color-surface-border)",
                    }}
                    aria-label="Override user"
                  >
                    <option value="">— pick a user —</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.displayName}
                      </option>
                    ))}
                  </select>
                  <input
                    type="datetime-local"
                    value={overrideStart}
                    onChange={(e) => setOverrideStart(e.target.value)}
                    className="bg-transparent text-[11px] font-mono outline-none rounded px-2 py-1"
                    style={{ color: "var(--color-fg-primary)", border: "1px solid var(--color-surface-border)" }}
                    aria-label="Override start"
                  />
                  <span className="text-[10px]" style={{ color: "var(--color-fg-muted)" }}>→</span>
                  <input
                    type="datetime-local"
                    value={overrideEnd}
                    onChange={(e) => setOverrideEnd(e.target.value)}
                    className="bg-transparent text-[11px] font-mono outline-none rounded px-2 py-1"
                    style={{ color: "var(--color-fg-primary)", border: "1px solid var(--color-surface-border)" }}
                    aria-label="Override end"
                  />
                </div>
                <input
                  type="text"
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                  placeholder="Optional note (covering for X, holiday, etc.)"
                  maxLength={500}
                  className="bg-transparent text-xs outline-none rounded px-2 py-1"
                  style={{ color: "var(--color-fg-primary)", border: "1px solid var(--color-surface-border)" }}
                />
                <button
                  type="button"
                  onClick={() => addOverrideMutation.mutate()}
                  disabled={addOverrideMutation.isPending || overrideUserId === ""}
                  className="self-start inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-md disabled:opacity-50"
                  style={{
                    backgroundColor: "color-mix(in srgb, #fcd34d 18%, transparent)",
                    border: "1px solid color-mix(in srgb, #fcd34d 40%, transparent)",
                    color: "#fcd34d",
                  }}
                >
                  {addOverrideMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Add override
                </button>
              </div>
            )}
          </div>

          {scheduleError && (
            <div className="text-[11px]" style={{ color: "#fca5a5" }}>
              {scheduleError}
            </div>
          )}
          {scheduleStatus && (
            <div className="text-[11px]" style={{ color: "#86efac" }}>
              {scheduleStatus}
            </div>
          )}
          {!canEdit && (
            <div className="text-[11px]" style={{ color: "var(--color-fg-muted)" }}>
              Read-only — admin or ops role required to edit the schedule.
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function TeamDetailModal({ team, onClose }: { team: string; onClose: () => void }) {
  const { user } = useAuth();
  const userRoles: string[] = (user as { roles?: string[] })?.roles ?? [];
  const canEditSchedule = userRoles.some((r) => ADMIN_ROLES_FOR_SCHEDULE.has(r));

  const [pageMessage, setPageMessage] = useState("");
  const [urgency, setUrgency] = useState<"info" | "warning" | "critical">("warning");
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageStatus, setPageStatus] = useState<string | null>(null);

  const detailQuery = useStandardQuery<TeamDetailDto>({
    queryKey: ["team", team],
    queryFn: () => apiFetch<TeamDetailDto>(`/teams/${encodeURIComponent(team)}`),
  });

  const pagesQuery = useStandardQuery<TeamPagesResponse>({
    queryKey: ["team", team, "pages"],
    queryFn: () => apiFetch<TeamPagesResponse>(`/teams/${encodeURIComponent(team)}/pages`),
  });

  const pageMutation = useStandardMutation({
    mutationFn: () =>
      apiFetch<PageResponse>(`/teams/${encodeURIComponent(team)}/page`, {
        method: "POST",
        body: JSON.stringify({ message: pageMessage, urgency }),
      }),
    onSuccess: (data) => {
      setPageError(null);
      if (!data.paged && data.reason === "actor_is_oncall") {
        setPageStatus("You are the on-call — no notification sent to yourself.");
      } else if (!data.paged && data.reason === "muted_duplicate") {
        setPageStatus(
          `Muted as duplicate — you already paged ${data.onCall?.displayName ?? "on-call"} (${urgency}) within the last 5 minutes. The audit row was still recorded.`,
        );
        setPageMessage("");
        void pagesQuery.refetch();
      } else if (data.paged) {
        setPageStatus(
          `Paged ${data.onCall?.displayName ?? "on-call"} (${urgency})${data.inAppDelivered === false ? " — in-app opt-out, external channels still attempted" : ""}.`,
        );
        setPageMessage("");
        // Real paging history just changed — pull the new entry into view.
        void pagesQuery.refetch();
      } else {
        setPageStatus("Page request acknowledged.");
      }
    },
    onError: (err: unknown) => {
      setPageStatus(null);
      setPageError(err instanceof ApiError ? err.message : "Failed to page team");
    },
  });

  const detail = detailQuery.data;
  const onCallId = detail?.onCall?.id;
  const escalationId = detail?.escalation?.id;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(8,12,20,0.72)" }}
      onClick={onClose}
    >
      <div
        className="max-w-lg w-full rounded-xl flex flex-col max-h-[85vh]"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-surface-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid var(--color-surface-border)" }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: "color-mix(in srgb, #7dd3fc 14%, transparent)",
              border: "1px solid color-mix(in srgb, #7dd3fc 30%, transparent)",
            }}
          >
            <Users className="w-4 h-4" style={{ color: "#7dd3fc" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-[0.18em]" style={{ color: "var(--color-fg-muted)" }}>
              Team Directory
            </div>
            <h3 className="text-base font-bold truncate">{team}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close team details"
            className="opacity-70 hover:opacity-100"
            style={{ color: "var(--color-fg-muted)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {detailQuery.isLoading ? (
            <div className="flex items-center justify-center py-10 text-xs" style={{ color: "var(--color-fg-muted)" }}>
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading team…
            </div>
          ) : detailQuery.isError ? (
            <div className="text-xs" style={{ color: "#fca5a5" }}>
              Failed to load team: {(detailQuery.error as Error)?.message ?? "Unknown error"}
            </div>
          ) : !detail ? null : (
            <>
              {detail.onCall ? (
                <section>
                  <div
                    className="text-[10px] font-mono uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
                    style={{ color: "var(--color-fg-muted)" }}
                  >
                    <BellRing className="w-3 h-3" /> Current on-call
                  </div>
                  <MemberRow m={detail.onCall} badge={{ label: "ON-CALL", color: "#10b981" }} />
                </section>
              ) : (
                <div className="text-xs" style={{ color: "var(--color-fg-muted)" }}>
                  No active members on this team — nobody to page.
                </div>
              )}

              {detail.escalation && detail.escalation.id !== onCallId && (
                <section>
                  <div
                    className="text-[10px] font-mono uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
                    style={{ color: "var(--color-fg-muted)" }}
                  >
                    <ShieldAlert className="w-3 h-3" /> Escalation
                  </div>
                  <MemberRow m={detail.escalation} badge={{ label: "ESCALATE", color: "#f59e0b" }} />
                </section>
              )}

              <section>
                <div
                  className="text-[10px] font-mono uppercase tracking-wider mb-1.5"
                  style={{ color: "var(--color-fg-muted)" }}
                >
                  Members ({detail.members.length})
                </div>
                {detail.members.length === 0 ? (
                  <div className="text-xs" style={{ color: "var(--color-fg-muted)" }}>
                    No users assigned to this team yet.
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {detail.members
                      .filter((m) => m.id !== onCallId && m.id !== escalationId)
                      .map((m) => (
                        <MemberRow key={m.id} m={m} />
                      ))}
                  </div>
                )}
              </section>

              <ScheduleEditor team={team} members={detail.members} canEdit={canEditSchedule} />

              {detail.ownedApps.length > 0 && (
                <section>
                  <div
                    className="text-[10px] font-mono uppercase tracking-wider mb-1.5"
                    style={{ color: "var(--color-fg-muted)" }}
                  >
                    Owned apps
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.ownedApps.map((a) => (
                      <span
                        key={a.slug}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: "var(--color-bg-elevated)",
                          border: "1px solid var(--color-surface-border)",
                          color: "var(--color-fg-muted)",
                        }}
                        title={a.slug}
                      >
                        {a.name}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <div
                  className="text-[10px] font-mono uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
                  style={{ color: "var(--color-fg-muted)" }}
                >
                  <History className="w-3 h-3" /> Recent pages
                  {pagesQuery.data?.count ? (
                    <span className="opacity-60">({pagesQuery.data.count})</span>
                  ) : null}
                </div>
                {pagesQuery.isLoading ? (
                  <div className="text-[11px]" style={{ color: "var(--color-fg-muted)" }}>
                    <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> Loading history…
                  </div>
                ) : pagesQuery.isError ? (
                  <div className="text-[11px]" style={{ color: "#fca5a5" }}>
                    Failed to load page history.
                  </div>
                ) : !pagesQuery.data || pagesQuery.data.pages.length === 0 ? (
                  <div className="text-[11px]" style={{ color: "var(--color-fg-muted)" }}>
                    No pages recorded for this team yet.
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {pagesQuery.data.pages.map((p) => {
                      const color = URGENCY_COLOR[p.urgency];
                      const actorName = p.actor?.displayName ?? "unknown actor";
                      const recipientName = p.recipient?.displayName ?? "unknown recipient";
                      return (
                        <div
                          key={p.id}
                          className="px-2.5 py-2 rounded-md text-[11px]"
                          style={{
                            backgroundColor: "var(--color-bg-elevated)",
                            border: "1px solid var(--color-surface-border)",
                            borderLeft: `3px solid ${color}`,
                          }}
                          title={new Date(p.createdAt).toLocaleString()}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{
                                color,
                                backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                                border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
                              }}
                            >
                              {p.urgency}
                            </span>
                            {p.mutedAsDuplicate && (
                              <span
                                className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                                style={{
                                  color: "var(--color-fg-muted)",
                                  backgroundColor: "color-mix(in srgb, #94a3b8 14%, transparent)",
                                  border: "1px dashed color-mix(in srgb, #94a3b8 40%, transparent)",
                                }}
                                title={
                                  p.duplicateOfPageId
                                    ? `Suppressed — collapsed into page #${p.duplicateOfPageId}`
                                    : "Suppressed as a duplicate within the 5-minute window"
                                }
                              >
                                muted as duplicate
                              </span>
                            )}
                            <span className="font-semibold">{actorName}</span>
                            <span style={{ color: "var(--color-fg-muted)" }}>→</span>
                            <span className="font-semibold">{recipientName}</span>
                            <span
                              className="font-mono ml-auto"
                              style={{ color: "var(--color-fg-muted)" }}
                            >
                              {formatPageTime(p.createdAt)}
                            </span>
                          </div>
                          {p.message && (
                            <div
                              className="mt-1 italic"
                              style={{ color: "var(--color-fg-secondary, var(--color-fg-primary))" }}
                            >
                              “{p.message}”
                            </div>
                          )}
                          {!p.inAppDelivered && !p.mutedAsDuplicate && (
                            <div
                              className="mt-1 text-[10px] font-mono"
                              style={{ color: "var(--color-fg-muted)" }}
                            >
                              in-app opt-out — external channels attempted
                            </div>
                          )}
                          {p.mutedAsDuplicate && (
                            <div
                              className="mt-1 text-[10px] font-mono"
                              style={{ color: "var(--color-fg-muted)" }}
                            >
                              no new in-app row · external channels not re-fired
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {detail?.onCall && (
          <div
            className="px-5 py-4 flex flex-col gap-2"
            style={{ borderTop: "1px solid var(--color-surface-border)" }}
          >
            <div className="flex items-center gap-2">
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as typeof urgency)}
                aria-label="Page urgency"
                className="bg-transparent text-[11px] font-mono outline-none cursor-pointer rounded px-2 py-1"
                style={{
                  color: "var(--color-fg-primary)",
                  border: "1px solid var(--color-surface-border)",
                }}
              >
                <option value="info">info</option>
                <option value="warning">warning</option>
                <option value="critical">critical</option>
              </select>
              <input
                type="text"
                value={pageMessage}
                onChange={(e) => setPageMessage(e.target.value)}
                placeholder="Optional context (what's broken?)"
                maxLength={500}
                className="flex-1 bg-transparent text-xs outline-none rounded px-2 py-1"
                style={{
                  color: "var(--color-fg-primary)",
                  border: "1px solid var(--color-surface-border)",
                }}
              />
            </div>
            {pageError && (
              <div className="text-[11px]" style={{ color: "#fca5a5" }}>
                {pageError}
              </div>
            )}
            {pageStatus && (
              <div className="text-[11px]" style={{ color: "#86efac" }}>
                {pageStatus}
              </div>
            )}
            <button
              onClick={() => pageMutation.mutate()}
              disabled={pageMutation.isPending}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold disabled:opacity-50"
              style={{
                backgroundColor: "color-mix(in srgb, #ef4444 18%, transparent)",
                border: "1px solid color-mix(in srgb, #ef4444 40%, transparent)",
                color: "#fca5a5",
              }}
            >
              {pageMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Page {detail.onCall.displayName}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const ENVIRONMENTS: DeploymentEnvironment[] = ["production", "staging", "development"];

const STATUS_STYLES: Record<DeploymentStatus, { color: string; label: string; icon: typeof CheckCircle2 }> = {
  active: { color: "#10b981", label: "Active", icon: CheckCircle2 },
  deploying: { color: "#8b7ac8", label: "Deploying", icon: Loader2 },
  "rolled-back": { color: "#f59e0b", label: "Rolled Back", icon: RotateCcw },
  failed: { color: "#ef4444", label: "Failed", icon: XCircle },
  inactive: { color: "#64748b", label: "Inactive", icon: Clock },
};

function StatusBadge({ status }: { status: DeploymentStatus }) {
  const cfg = STATUS_STYLES[status] ?? STATUS_STYLES.inactive;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded"
      style={{
        color: cfg.color,
        backgroundColor: `color-mix(in srgb, ${cfg.color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${cfg.color} 25%, transparent)`,
      }}
    >
      <Icon className={`w-3 h-3 ${status === "deploying" ? "animate-spin" : ""}`} />
      {cfg.label}
    </span>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DeploymentsPage() {
  const queryClient = useQueryClient();
  const [environment, setEnvironment] = useState<DeploymentEnvironment>("production");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const openUserProfile = (userId: number) => setLocation(`/admin/users/${userId}`);
  const [deployerFilter, setDeployerFilter] = useState<string>("");
  const [confirmRollback, setConfirmRollback] = useState<{ appId: string; from: string; to?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Unfiltered list — drives the deployer dropdown options so the choices
  // don't disappear once a filter is applied.
  const allDeployersQuery = useStandardQuery<ListResponse>({
    queryKey: ["deployments", "list", environment, "all-deployers"],
    queryFn: () => apiFetch<ListResponse>(`/deployments?environment=${environment}`),
    refetchInterval: 60_000,
  });

  const listQuery = useStandardQuery<ListResponse>({
    queryKey: ["deployments", "list", environment, deployerFilter || null],
    queryFn: () => {
      const qs = new URLSearchParams({ environment });
      if (deployerFilter) qs.set("deployedBy", deployerFilter);
      return apiFetch<ListResponse>(`/deployments?${qs.toString()}`);
    },
    refetchInterval: 30_000,
  });

  const historyQuery = useStandardQuery<HistoryResponse>({
    queryKey: ["deployments", "history", selectedAppId, environment, deployerFilter || null],
    queryFn: () => {
      const qs = new URLSearchParams({ environment });
      if (deployerFilter) qs.set("deployedBy", deployerFilter);
      return apiFetch<HistoryResponse>(
        `/deployments/${selectedAppId}/history?${qs.toString()}`,
      );
    },
    enabled: !!selectedAppId,
  });

  // Build deployer options from the unfiltered active list, sorted by display
  // name. Each option keeps the principal string (the actual filter value)
  // and an optional resolved user summary for avatars/initials in the menu.
  const deployerOptions = useMemo(() => {
    const map = new Map<
      string,
      { value: string; label: string; user?: DeploymentUserSummary }
    >();
    for (const d of allDeployersQuery.data?.deployments ?? []) {
      if (!d.deployedBy || d.deployedBy === "system") continue;
      if (!map.has(d.deployedBy)) {
        map.set(d.deployedBy, {
          value: d.deployedBy,
          label: d.deployedByUser?.displayName ?? d.deployedBy,
          user: d.deployedByUser,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [allDeployersQuery.data]);

  // If the active filter no longer matches any known deployer (env change,
  // person no longer has active deploys), clear it so the UI doesn't get
  // stuck showing an empty list with no obvious reason.
  if (
    deployerFilter &&
    allDeployersQuery.data &&
    !deployerOptions.some((o) => o.value === deployerFilter)
  ) {
    // Defer the state change to avoid setState-during-render warning.
    queueMicrotask(() => setDeployerFilter(""));
  }

  const rollbackMutation = useStandardMutation({
    mutationFn: async (vars: { appId: string; version?: string }) => {
      return apiFetch<RollbackResponse>(`/deployments/${vars.appId}/rollback`, {
        method: "POST",
        body: JSON.stringify({ environment, version: vars.version }),
      });
    },
    onSuccess: (data, vars) => {
      setError(null);
      setSuccess(
        `Rolled back ${vars.appId} from ${data.previous.version} to ${data.current.version}.`,
      );
      setConfirmRollback(null);
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
    },
    onError: (err: unknown) => {
      setSuccess(null);
      setError(err instanceof ApiError ? err.message : "Rollback failed");
    },
  });

  const deployments = listQuery.data?.deployments ?? [];
  const sortedDeployments = useMemo(
    () => [...deployments].sort((a, b) => a.appName.localeCompare(b.appName)),
    [deployments],
  );

  const selectedActive = sortedDeployments.find((d) => d.appId === selectedAppId);
  const history = historyQuery.data?.history ?? [];
  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime()),
    [history],
  );

  return (
    <div
      className="min-h-full p-6 lg:p-8"
      style={{ backgroundColor: "var(--color-bg-primary)", color: "var(--color-fg-primary)" }}
    >
      <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: "color-mix(in srgb, #8b7ac8 14%, transparent)",
                border: "1px solid color-mix(in srgb, #8b7ac8 30%, transparent)",
              }}
            >
              <Rocket className="w-4 h-4" style={{ color: "#8b7ac8" }} />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-[0.18em]" style={{ color: "var(--color-fg-muted)" }}>
                Operator Console
              </div>
              <h1 className="text-xl font-bold tracking-tight">Deployments</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)" }}>
              <User className="w-3 h-3" style={{ color: "var(--color-fg-muted)" }} />
              <select
                value={deployerFilter}
                onChange={(e) => setDeployerFilter(e.target.value)}
                aria-label="Filter by deployer"
                className="bg-transparent text-[11px] font-mono outline-none cursor-pointer"
                style={{
                  color: deployerFilter ? "#cdb8f0" : "var(--color-fg-muted)",
                  maxWidth: 180,
                }}
              >
                <option value="">All deployers</option>
                {deployerOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {deployerFilter && (
                <button
                  onClick={() => setDeployerFilter("")}
                  aria-label="Clear deployer filter"
                  className="opacity-70 hover:opacity-100"
                  style={{ color: "var(--color-fg-muted)" }}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)" }}>
              {ENVIRONMENTS.map((env) => (
                <button
                  key={env}
                  onClick={() => {
                    setEnvironment(env);
                    setSelectedAppId(null);
                  }}
                  className="px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all"
                  style={{
                    backgroundColor: environment === env ? "color-mix(in srgb, #8b7ac8 18%, transparent)" : "transparent",
                    color: environment === env ? "#cdb8f0" : "var(--color-fg-muted)",
                  }}
                >
                  {env}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                listQuery.refetch();
                if (selectedAppId) historyQuery.refetch();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs"
              style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)", color: "var(--color-fg-muted)" }}
            >
              <RefreshCw className={`w-3 h-3 ${listQuery.isFetching ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{ backgroundColor: "color-mix(in srgb, #ef4444 10%, transparent)", border: "1px solid color-mix(in srgb, #ef4444 25%, transparent)", color: "#fca5a5" }}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {error}
            <button className="ml-auto opacity-70 hover:opacity-100" onClick={() => setError(null)}>×</button>
          </div>
        )}
        {success && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{ backgroundColor: "color-mix(in srgb, #10b981 10%, transparent)", border: "1px solid color-mix(in srgb, #10b981 25%, transparent)", color: "#86efac" }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {success}
            <button className="ml-auto opacity-70 hover:opacity-100" onClick={() => setSuccess(null)}>×</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6">
          {/* Active deployments list */}
          <section
            className="rounded-xl overflow-hidden flex flex-col"
            style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)" }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--color-surface-border)" }}>
              <div className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5" style={{ color: "var(--color-fg-muted)" }} />
                <h2 className="text-xs font-bold uppercase tracking-[0.15em]">Active Versions</h2>
              </div>
              <span className="text-[10px] font-mono" style={{ color: "var(--color-fg-muted)" }}>
                {sortedDeployments.length} app{sortedDeployments.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex-1">
              {listQuery.isLoading ? (
                <div className="flex items-center justify-center py-10 text-xs" style={{ color: "var(--color-fg-muted)" }}>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading deployments…
                </div>
              ) : listQuery.isError ? (
                <div className="px-4 py-6 text-xs" style={{ color: "#fca5a5" }}>
                  Failed to load deployments: {(listQuery.error as Error)?.message ?? "Unknown error"}
                </div>
              ) : sortedDeployments.length === 0 ? (
                <div className="px-4 py-10 text-center text-xs" style={{ color: "var(--color-fg-muted)" }}>
                  No active deployments registered for <span className="font-mono">{environment}</span>.
                </div>
              ) : (
                <ul>
                  {sortedDeployments.map((d) => {
                    const active = selectedAppId === d.appId;
                    return (
                      <li key={d.appId}>
                        <button
                          onClick={() => setSelectedAppId(d.appId)}
                          className="w-full text-left px-4 py-3 flex items-center gap-3 transition-all"
                          style={{
                            backgroundColor: active ? "color-mix(in srgb, #8b7ac8 10%, transparent)" : "transparent",
                            borderBottom: "1px solid var(--color-surface-border)",
                            borderLeft: active ? "3px solid #8b7ac8" : "3px solid transparent",
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm font-semibold truncate">{d.appName}</span>
                              <span className="text-[10px] font-mono" style={{ color: "var(--color-fg-muted)" }}>
                                {d.appId}
                              </span>
                              {d.ownerTeam && <TeamPill team={d.ownerTeam} tone="owner" onClick={setSelectedTeam} />}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-mono" style={{ color: "#cdb8f0" }}>{d.version}</span>
                              <StatusBadge status={d.status} />
                              <span className="text-[10px] font-mono" style={{ color: "var(--color-fg-muted)" }}>
                                {formatTime(d.deployedAt)}
                              </span>
                              <DeployerBadge record={d} onTeamClick={setSelectedTeam} onUserClick={openUserProfile} />
                            </div>
                          </div>
                          <ChevronRight
                            className="w-3.5 h-3.5"
                            style={{ color: active ? "#8b7ac8" : "var(--color-fg-muted)" }}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* History panel */}
          <section
            className="rounded-xl overflow-hidden flex flex-col"
            style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)" }}
          >
            <div className="flex items-center justify-between px-4 py-3 gap-3" style={{ borderBottom: "1px solid var(--color-surface-border)" }}>
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <History className="w-3.5 h-3.5" style={{ color: "var(--color-fg-muted)" }} />
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] truncate">
                  {selectedActive ? `${selectedActive.appName} History` : "Deployment History"}
                </h2>
                {selectedActive?.ownerTeam && (
                  <TeamPill team={selectedActive.ownerTeam} tone="owner" onClick={setSelectedTeam} />
                )}
              </div>
              {selectedActive && (
                <button
                  onClick={() =>
                    setConfirmRollback({
                      appId: selectedActive.appId,
                      from: selectedActive.version,
                    })
                  }
                  disabled={sortedHistory.length < 2 || rollbackMutation.isPending}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-mono uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "color-mix(in srgb, #f59e0b 14%, transparent)",
                    border: "1px solid color-mix(in srgb, #f59e0b 35%, transparent)",
                    color: "#fbbf24",
                  }}
                >
                  <RotateCcw className="w-3 h-3" />
                  Roll back
                </button>
              )}
            </div>
            <div className="flex-1">
              {!selectedAppId ? (
                <div className="px-6 py-12 text-center text-xs" style={{ color: "var(--color-fg-muted)" }}>
                  Select an app on the left to view its deployment history.
                </div>
              ) : historyQuery.isLoading ? (
                <div className="flex items-center justify-center py-10 text-xs" style={{ color: "var(--color-fg-muted)" }}>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading history…
                </div>
              ) : historyQuery.isError ? (
                <div className="px-4 py-6 text-xs" style={{ color: "#fca5a5" }}>
                  Failed to load history: {(historyQuery.error as Error)?.message ?? "Unknown error"}
                </div>
              ) : sortedHistory.length === 0 ? (
                <div className="px-4 py-10 text-center text-xs" style={{ color: "var(--color-fg-muted)" }}>
                  No deployment records for this app in <span className="font-mono">{environment}</span>.
                </div>
              ) : (
                <ol className="px-4 py-3 flex flex-col gap-2">
                  {sortedHistory.map((entry, idx) => {
                    const isCurrentActive = entry.status === "active";
                    const canRollbackTo = !isCurrentActive && entry.status !== "failed";
                    return (
                      <li
                        key={`${entry.version}-${entry.deployedAt}-${idx}`}
                        className="rounded-lg p-3 flex items-start gap-3"
                        style={{
                          backgroundColor: isCurrentActive
                            ? "color-mix(in srgb, #10b981 8%, transparent)"
                            : "var(--color-bg-elevated)",
                          border: isCurrentActive
                            ? "1px solid color-mix(in srgb, #10b981 30%, transparent)"
                            : "1px solid var(--color-surface-border)",
                        }}
                      >
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: "color-mix(in srgb, #8b7ac8 14%, transparent)",
                            border: "1px solid color-mix(in srgb, #8b7ac8 25%, transparent)",
                          }}
                        >
                          <GitCommit className="w-3.5 h-3.5" style={{ color: "#cdb8f0" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-sm font-mono font-semibold" style={{ color: "var(--color-fg-primary)" }}>
                              {entry.version}
                            </span>
                            <StatusBadge status={entry.status} />
                            {entry.commitSha && (
                              <span
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: "var(--color-bg-elevated)",
                                  border: "1px solid var(--color-surface-border)",
                                  color: "var(--color-fg-muted)",
                                }}
                              >
                                {entry.commitSha.slice(0, 8)}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono mb-1" style={{ color: "var(--color-fg-muted)" }}>
                            {formatTime(entry.deployedAt)}
                          </div>
                          {(() => {
                            const isRollback = entry.notes?.startsWith("Rolled back from") ?? false;
                            const original = isRollback
                              ? findOriginalDeployerFor(entry, sortedHistory)
                              : undefined;
                            return (
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                                <DeployerBadge
                                  record={entry}
                                  prefix={isRollback ? "Rolled back by" : "Shipped by"}
                                  onTeamClick={setSelectedTeam} onUserClick={openUserProfile}
                                />
                                {original && original.deployedBy !== entry.deployedBy && (
                                  <DeployerBadge
                                    record={original}
                                    prefix="originally shipped by"
                                    onTeamClick={setSelectedTeam} onUserClick={openUserProfile}
                                  />
                                )}
                              </div>
                            );
                          })()}
                          {entry.notes && (
                            <div className="text-xs leading-relaxed" style={{ color: "var(--color-fg-secondary, var(--color-fg-muted))" }}>
                              {entry.notes}
                            </div>
                          )}
                        </div>
                        {canRollbackTo && (
                          <button
                            onClick={() =>
                              setConfirmRollback({
                                appId: entry.appId,
                                from: selectedActive?.version ?? "current",
                                to: entry.version,
                              })
                            }
                            disabled={rollbackMutation.isPending}
                            className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-md shrink-0 disabled:opacity-40"
                            style={{
                              backgroundColor: "color-mix(in srgb, #f59e0b 12%, transparent)",
                              border: "1px solid color-mix(in srgb, #f59e0b 30%, transparent)",
                              color: "#fbbf24",
                            }}
                          >
                            Roll back to this
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Team detail modal */}
      {selectedTeam && (
        <TeamDetailModal team={selectedTeam} onClose={() => setSelectedTeam(null)} />
      )}

      {/* Confirm rollback modal */}
      {confirmRollback && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(8,12,20,0.72)" }}
          onClick={() => !rollbackMutation.isPending && setConfirmRollback(null)}
        >
          <div
            className="max-w-md w-full rounded-xl p-5"
            style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-surface-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: "color-mix(in srgb, #f59e0b 14%, transparent)",
                  border: "1px solid color-mix(in srgb, #f59e0b 35%, transparent)",
                }}
              >
                <AlertTriangle className="w-4 h-4" style={{ color: "#fbbf24" }} />
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--color-fg-muted)" }}>
                  Confirm Rollback
                </div>
                <h3 className="text-base font-bold">
                  {confirmRollback.appId} · {environment}
                </h3>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--color-fg-muted)" }}>
              This will roll <span className="font-mono" style={{ color: "var(--color-fg-primary)" }}>{confirmRollback.appId}</span> back from{" "}
              <span className="font-mono" style={{ color: "#fbbf24" }}>{confirmRollback.from}</span> to{" "}
              <span className="font-mono" style={{ color: "#86efac" }}>
                {confirmRollback.to ?? "the previous version"}
              </span>{" "}
              in the <span className="font-mono">{environment}</span> environment. The current version will be marked rolled-back.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                disabled={rollbackMutation.isPending}
                onClick={() => setConfirmRollback(null)}
                className="px-3 py-1.5 rounded-md text-xs"
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid var(--color-surface-border)",
                  color: "var(--color-fg-muted)",
                }}
              >
                Cancel
              </button>
              <button
                disabled={rollbackMutation.isPending}
                onClick={() =>
                  rollbackMutation.mutate({ appId: confirmRollback.appId, version: confirmRollback.to })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold"
                style={{
                  backgroundColor: "color-mix(in srgb, #f59e0b 22%, transparent)",
                  border: "1px solid color-mix(in srgb, #f59e0b 45%, transparent)",
                  color: "#fbbf24",
                }}
              >
                {rollbackMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                Confirm rollback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
