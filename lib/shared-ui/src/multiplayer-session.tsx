import { useCallback, useEffect, useRef, useState } from 'react';
import { typography } from './tokens';

export interface SessionParticipant {
  userId: string;
  displayName: string;
  avatarColor: string;
  avatarInitials: string;
  cursor?: { x: number; y: number };
  focusedEntityId?: string;
  lastSeen: number;
}

export interface SessionComment {
  id: string;
  entityId: string;
  entityType: string;
  authorId: string;
  authorName: string;
  authorColor: string;
  text: string;
  timestamp: number;
  resolved?: boolean;
}

export interface MultiplayerSessionProps {
  sessionId: string;
  currentUserId: string;
  currentUserName: string;
  accentColor?: string;
}

const AVATAR_COLORS = [
  '#8b7ac8',
  '#0ea5e9',
  '#22c55e',
  '#ef4444',
  '#f59e0b',
  '#a855f7',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#14b8a6',
];

function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const DEMO_PARTICIPANTS: SessionParticipant[] = [
  {
    userId: 'user-1',
    displayName: 'Stephen L.',
    avatarColor: '#8b7ac8',
    avatarInitials: 'SL',
    lastSeen: Date.now() - 5000,
  },
  {
    userId: 'user-2',
    displayName: 'Carlota J.',
    avatarColor: '#ec4899',
    avatarInitials: 'CJ',
    lastSeen: Date.now() - 12000,
  },
  {
    userId: 'user-3',
    displayName: 'Marcus T.',
    avatarColor: '#0ea5e9',
    avatarInitials: 'MT',
    lastSeen: Date.now() - 30000,
  },
];

const DEMO_COMMENTS: SessionComment[] = [
  {
    id: 'c1',
    entityId: 'vessel-poseidon',
    entityType: 'vessel',
    authorId: 'user-2',
    authorName: 'Carlota J.',
    authorColor: '#ec4899',
    text: 'This vessel has been in restricted waters for 48h. Legal hold recommended before crew rotation.',
    timestamp: Date.now() - 3600000,
    resolved: false,
  },
  {
    id: 'c2',
    entityId: 'incident-447',
    entityType: 'incident',
    authorId: 'user-3',
    authorName: 'Marcus T.',
    authorColor: '#0ea5e9',
    text: 'MITRE T1190 pattern confirmed. Escalating to tier-2 SOC. Playbook executed.',
    timestamp: Date.now() - 7200000,
    resolved: true,
  },
];

interface ParticipantAvatarProps {
  participant: SessionParticipant;
  size?: number;
  showTooltip?: boolean;
}

function ParticipantAvatar({ participant, size = 28, showTooltip = true }: ParticipantAvatarProps) {
  const [hovered, setHovered] = useState(false);
  const age = Date.now() - participant.lastSeen;
  const isActive = age < 30000;

  return (
    <div
      style={{ position: 'relative', flexShrink: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: `${participant.avatarColor}25`,
          border: `2px solid ${participant.avatarColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${size * 0.35}px`,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.92)',
          opacity: isActive ? 1 : 0.5,
          transition: 'opacity 0.2s',
          cursor: 'default',
          fontFamily: typography.fontFamily.body,
        }}
      >
        {participant.avatarInitials}
      </div>
      {isActive && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#22c55e',
            border: '1.5px solid rgba(8,10,18,0.95)',
          }}
        />
      )}
      {showTooltip && hovered && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(8,10,18,0.95)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.8)',
            whiteSpace: 'nowrap',
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
          {participant.displayName}
          {!isActive && (
            <span style={{ color: 'rgba(255,255,255,0.35)', marginLeft: '4px' }}>(away)</span>
          )}
        </div>
      )}
    </div>
  );
}

interface SessionPresenceBarProps {
  sessionId: string;
  currentUserName: string;
  participants?: SessionParticipant[];
  accentColor?: string;
}

export function SessionPresenceBar({
  sessionId,
  currentUserName,
  participants = DEMO_PARTICIPANTS,
  accentColor = '#8b7ac8',
}: SessionPresenceBarProps) {
  const [showPanel, setShowPanel] = useState(false);
  const activeCount = participants.filter((p) => Date.now() - p.lastSeen < 30000).length;

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: typography.fontFamily.body,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px 5px 6px',
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onClick={() => setShowPanel((v) => !v)}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {participants.slice(0, 4).map((p, i) => (
            <div key={p.userId} style={{ marginLeft: i > 0 ? '-6px' : 0, zIndex: 4 - i }}>
              <ParticipantAvatar participant={p} size={22} showTooltip={false} />
            </div>
          ))}
          {participants.length > 4 && (
            <div
              style={{
                marginLeft: '-6px',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                border: '2px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                color: 'rgba(255,255,255,0.85)',
                fontWeight: 700,
              }}
            >
              +{participants.length - 4}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: activeCount > 0 ? '#22c55e' : 'rgba(255,255,255,0.2)',
            }}
          />
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
            {activeCount} active
          </span>
        </div>
      </div>

      {showPanel && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '260px',
            background: 'rgba(8,10,18,0.97)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Live Session · {sessionId}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
              {participants.length} participants
            </div>
          </div>
          <div style={{ padding: '8px 4px' }}>
            {participants.map((p) => {
              const isActive = Date.now() - p.lastSeen < 30000;
              return (
                <div
                  key={p.userId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    margin: '0 4px',
                  }}
                >
                  <ParticipantAvatar participant={p} size={28} showTooltip={false} />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: isActive ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {p.displayName}
                      {p.displayName === currentUserName && (
                        <span
                          style={{
                            fontSize: '9px',
                            color: accentColor,
                            marginLeft: '6px',
                            background: `${accentColor}20`,
                            borderRadius: '3px',
                            padding: '1px 4px',
                          }}
                        >
                          you
                        </span>
                      )}
                    </div>
                    <div
                      style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}
                    >
                      {isActive
                        ? 'Active now'
                        : `${Math.round((Date.now() - p.lastSeen) / 60000)}m ago`}
                    </div>
                  </div>
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: isActive ? '#22c55e' : 'rgba(255,255,255,0.15)',
                      flexShrink: 0,
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href).catch(() => {});
                setShowPanel(false);
              }}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '8px',
                border: `1px solid ${accentColor}30`,
                background: `${accentColor}12`,
                color: accentColor,
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: typography.fontFamily.body,
              }}
            >
              Copy Session Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface EntityCommentThreadProps {
  entityId: string;
  entityType: string;
  entityLabel: string;
  comments?: SessionComment[];
  currentUserId?: string;
  currentUserName?: string;
  accentColor?: string;
  onAddComment?: (text: string) => void;
}

export function EntityCommentThread({
  entityId,
  entityType,
  entityLabel,
  comments: propComments,
  currentUserId = 'current-user',
  currentUserName = 'You',
  accentColor = '#8b7ac8',
  onAddComment,
}: EntityCommentThreadProps) {
  const [comments, setComments] = useState<SessionComment[]>(
    propComments ?? DEMO_COMMENTS.filter((c) => c.entityId === entityId),
  );
  const [newComment, setNewComment] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleAdd = useCallback(() => {
    if (!newComment.trim()) return;
    const comment: SessionComment = {
      id: `c-${Date.now()}`,
      entityId,
      entityType,
      authorId: currentUserId,
      authorName: currentUserName,
      authorColor: getAvatarColor(currentUserId),
      text: newComment.trim(),
      timestamp: Date.now(),
      resolved: false,
    };
    setComments((prev) => [...prev, comment]);
    onAddComment?.(newComment.trim());
    setNewComment('');
  }, [newComment, entityId, entityType, currentUserId, currentUserName, onAddComment]);

  const unresolvedCount = comments.filter((c) => !c.resolved).length;

  return (
    <div style={{ fontFamily: typography.fontFamily.body }}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px',
          borderRadius: '8px',
          border: `1px solid ${unresolvedCount > 0 ? `${accentColor}40` : 'rgba(255,255,255,0.12)'}`,
          background: unresolvedCount > 0 ? `${accentColor}12` : 'rgba(255,255,255,0.04)',
          color: unresolvedCount > 0 ? accentColor : 'rgba(255,255,255,0.4)',
          fontSize: '11px',
          cursor: 'pointer',
          fontFamily: typography.fontFamily.body,
          transition: 'all 0.15s',
        }}
      >
        <span>💬</span>
        <span>
          {comments.length > 0
            ? `${comments.length} comment${comments.length !== 1 ? 's' : ''}`
            : 'Add comment'}
        </span>
        {unresolvedCount > 0 && (
          <span
            style={{
              background: accentColor,
              color: '#fff',
              borderRadius: '10px',
              fontSize: '9px',
              fontWeight: 700,
              padding: '1px 5px',
              minWidth: '16px',
            }}
          >
            {unresolvedCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            marginTop: '8px',
            background: 'rgba(8,10,18,0.96)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            overflow: 'hidden',
            width: '320px',
          }}
        >
          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
              }}
            >
              {entityLabel}
            </div>
          </div>

          {comments.length > 0 ? (
            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
              {comments.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    opacity: c.resolved ? 0.5 : 1,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '5px',
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: `${c.authorColor}25`,
                        border: `1px solid ${c.authorColor}60`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8px',
                        fontWeight: 700,
                        color: c.authorColor,
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(c.authorName)}
                    </div>
                    <span
                      style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}
                    >
                      {c.authorName}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        color: 'rgba(255,255,255,0.3)',
                        marginLeft: 'auto',
                      }}
                    >
                      {new Date(c.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {c.resolved && (
                      <span
                        style={{
                          fontSize: '9px',
                          color: '#22c55e',
                          background: '#22c55e20',
                          borderRadius: '4px',
                          padding: '1px 5px',
                        }}
                      >
                        resolved
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.65)',
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {c.text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: '20px 14px',
                textAlign: 'center',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.25)',
              }}
            >
              No comments yet
            </div>
          )}

          <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <textarea
              ref={inputRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder="Add a comment... (Enter to submit)"
              rows={2}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '8px 10px',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '12px',
                resize: 'none',
                outline: 'none',
                fontFamily: typography.fontFamily.body,
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px', gap: '6px' }}
            >
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontFamily: typography.fontFamily.body,
                }}
              >
                Close
              </button>
              <button
                onClick={handleAdd}
                disabled={!newComment.trim()}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: newComment.trim() ? accentColor : 'rgba(255,255,255,0.06)',
                  color: newComment.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: newComment.trim() ? 'pointer' : 'default',
                  fontFamily: typography.fontFamily.body,
                }}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MultiplayerSessionBanner({
  sessionId,
  participants: initialParticipants = DEMO_PARTICIPANTS,
  currentUserName = 'You',
  accentColor = '#8b7ac8',
}: {
  sessionId: string;
  participants?: SessionParticipant[];
  currentUserName?: string;
  accentColor?: string;
}) {
  const [participants, setParticipants] = useState<SessionParticipant[]>(initialParticipants);

  useEffect(() => {
    let cancelled = false;

    async function fetchSession() {
      try {
        const res = await fetch(`/api/sessions/command/${encodeURIComponent(sessionId)}`, {
          credentials: 'include',
        });
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as { data?: { participants?: SessionParticipant[] } };
        if (
          !cancelled &&
          Array.isArray(json.data?.participants) &&
          (json.data?.participants?.length ?? 0) > 0
        ) {
          setParticipants(json.data?.participants!);
        }
      } catch {}
    }

    void fetchSession();
    const interval = setInterval(() => {
      void fetchSession();
    }, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionId]);

  const activeCount = participants.filter((p) => Date.now() - p.lastSeen < 30000).length;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 16px',
        background: `${accentColor}08`,
        borderBottom: `1px solid ${accentColor}20`,
        fontFamily: typography.fontFamily.body,
      }}
    >
      <div
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: '#22c55e',
          boxShadow: '0 0 6px #22c55e',
          animation: 'pulse-dot 2s ease-in-out infinite',
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
        Live session — {activeCount} participant{activeCount !== 1 ? 's' : ''} viewing
      </span>
      <SessionPresenceBar
        sessionId={sessionId}
        currentUserName={currentUserName}
        participants={participants}
        accentColor={accentColor}
      />
      <style>{`@keyframes pulse-dot { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
    </div>
  );
}
