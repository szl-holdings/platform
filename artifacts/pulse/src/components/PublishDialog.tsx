import { Building2, CheckCircle, Info, Loader2, Send, Users, X } from 'lucide-react';
import { useState } from 'react';
import type { PublishBriefingInput } from '../lib/api';

const ROLE_OPTIONS = [
  { value: 'exec', label: 'Executives' },
  { value: 'ops', label: 'Operations' },
  { value: 'admin', label: 'Administrators' },
  { value: 'owner', label: 'Owners' },
  { value: 'viewer', label: 'Viewers' },
];

interface PublishDialogProps {
  briefingId: string;
  briefingHeadline: string;
  forceRepublish?: boolean;
  onClose: () => void;
  onPublish: (input: PublishBriefingInput) => Promise<{
    success: true;
    publication: {
      publicationId: string;
      briefingId: string;
      audienceType: string;
      channels: string[];
      totalRecipients: number;
      status: string;
    };
  }>;
}

export function PublishDialog({
  briefingHeadline,
  forceRepublish,
  onClose,
  onPublish,
}: PublishDialogProps) {
  const [audienceType, setAudienceType] = useState<'all' | 'roles'>('all');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [headlineOverride, setHeadlineOverride] = useState('');
  const [messageOverride, setMessageOverride] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    publicationId: string;
    totalRecipients: number;
  } | null>(null);

  function toggleRole(role: string) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  async function handlePublish() {
    setLoading(true);
    setError(null);
    try {
      const channels: string[] = ['in_app'];
      if (pushEnabled) channels.push('push');

      const input: PublishBriefingInput = {
        audienceType,
        audienceRoles: audienceType === 'roles' ? selectedRoles : [],
        channels,
        headlineOverride: headlineOverride.trim() || undefined,
        messageOverride: messageOverride.trim() || undefined,
        force: forceRepublish === true,
      };

      const res = await onPublish(input);
      setResult({
        publicationId: res.publication.publicationId,
        totalRecipients: res.publication.totalRecipients,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to publish briefing';
      if (msg.includes('403') || msg.includes('Forbidden')) {
        setError('You do not have permission to publish briefings. Required role: owner, exec, or ops.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  const canPublish =
    !loading &&
    (audienceType === 'all' || selectedRoles.length > 0);

  if (result) {
    return (
      <div style={overlayStyle}>
        <div style={dialogStyle}>
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <CheckCircle size={40} style={{ color: '#4eca8b', marginBottom: 12 }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--pulse-text)', marginBottom: 8 }}>
              Briefing Published
            </div>
            <div style={{ color: 'var(--pulse-text-muted)', fontSize: '0.88rem', lineHeight: 1.5 }}>
              Dispatched to <strong style={{ color: 'var(--pulse-text)' }}>{result.totalRecipients}</strong>{' '}
              org member{result.totalRecipients !== 1 ? 's' : ''} via in-app{' '}
              {pushEnabled ? '+ push notifications' : 'notifications'}.
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: '0.72rem',
                color: 'var(--pulse-text-muted)',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {result.publicationId}
            </div>
          </div>
          <button onClick={onClose} style={primaryBtnStyle}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <div style={dialogStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={16} style={{ color: 'var(--pulse-gold)' }} />
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--pulse-text)' }}>
              {forceRepublish ? 'Republish to Organization' : 'Publish to Organization'}
            </span>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--pulse-text-muted)',
            marginBottom: 18,
            padding: '8px 12px',
            background: 'rgba(200,168,75,0.07)',
            borderRadius: 6,
            border: '1px solid rgba(200,168,75,0.2)',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: 'var(--pulse-gold)' }}>{briefingHeadline}</strong>
        </div>

        {/* Audience */}
        <div style={sectionStyle}>
          <div style={sectionLabelStyle}>
            <Users size={13} />
            AUDIENCE
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {(['all', 'roles'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setAudienceType(opt)}
                style={{
                  ...segmentBtnStyle,
                  ...(audienceType === opt ? segmentBtnActiveStyle : {}),
                }}
              >
                {opt === 'all' ? 'Everyone in org' : 'Filter by role'}
              </button>
            ))}
          </div>
          {audienceType === 'roles' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => toggleRole(r.value)}
                  style={{
                    ...rolePillStyle,
                    ...(selectedRoles.includes(r.value) ? rolePillActiveStyle : {}),
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Channels */}
        <div style={sectionStyle}>
          <div style={sectionLabelStyle}>
            <Send size={13} />
            CHANNELS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ChannelRow
              label="In-App Notification"
              desc="Always on — delivered to every targeted member's notification feed."
              enabled={true}
              locked
            />
            <ChannelRow
              label="Push Notification"
              desc="Web & mobile push — respects each user's quiet hours."
              enabled={pushEnabled}
              onChange={setPushEnabled}
            />
            <ChannelRow
              label="Email"
              desc="Org-wide email digest"
              enabled={false}
              disabled
              comingSoon
            />
            <ChannelRow
              label="SMS"
              desc="SMS broadcast"
              enabled={false}
              disabled
              comingSoon
            />
          </div>
        </div>

        {/* Optional overrides */}
        <div style={sectionStyle}>
          <div style={sectionLabelStyle}>
            <Info size={13} />
            OPTIONAL OVERRIDES
          </div>
          <input
            placeholder="Headline override (leave blank to use briefing headline)"
            value={headlineOverride}
            onChange={(e) => setHeadlineOverride(e.target.value)}
            maxLength={200}
            style={inputStyle}
          />
          <textarea
            placeholder="Short message to include with the notification (optional)"
            value={messageOverride}
            onChange={(e) => setMessageOverride(e.target.value)}
            maxLength={500}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical', marginTop: 8 }}
          />
        </div>

        {error && (
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 6,
              fontSize: '0.8rem',
              color: '#ef4444',
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={cancelBtnStyle}>
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={!canPublish}
            style={{
              ...primaryBtnStyle,
              flex: 1,
              opacity: canPublish ? 1 : 0.5,
              cursor: canPublish ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Publishing…
              </>
            ) : (
              <>
                <Send size={14} /> Publish to Organization
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChannelRow({
  label,
  desc,
  enabled,
  locked,
  disabled,
  comingSoon,
  onChange,
}: {
  label: string;
  desc: string;
  enabled: boolean;
  locked?: boolean;
  disabled?: boolean;
  comingSoon?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        borderRadius: 6,
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid var(--pulse-border)',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--pulse-text)', fontWeight: 500 }}>
          {label}
          {comingSoon && (
            <span
              title="Coming in v2"
              style={{
                marginLeft: 6,
                fontSize: '0.62rem',
                padding: '1px 5px',
                borderRadius: 3,
                background: 'rgba(200,168,75,0.15)',
                color: 'var(--pulse-gold)',
                border: '1px solid rgba(200,168,75,0.3)',
              }}
            >
              COMING SOON
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--pulse-text-muted)', marginTop: 1 }}>
          {desc}
        </div>
      </div>
      <div>
        {locked ? (
          <div
            style={{
              width: 36,
              height: 20,
              borderRadius: 10,
              background: 'rgba(78,202,139,0.4)',
              border: '1px solid rgba(78,202,139,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              padding: '0 3px',
            }}
          >
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#4eca8b' }} />
          </div>
        ) : (
          <button
            disabled={disabled}
            onClick={() => !disabled && onChange && onChange(!enabled)}
            style={{
              width: 36,
              height: 20,
              borderRadius: 10,
              background: enabled ? 'rgba(78,202,139,0.4)' : 'rgba(255,255,255,0.08)',
              border: enabled ? '1px solid rgba(78,202,139,0.5)' : '1px solid rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: enabled ? 'flex-end' : 'flex-start',
              padding: '0 3px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: enabled ? '#4eca8b' : 'rgba(255,255,255,0.3)',
                transition: 'background 0.15s',
              }}
            />
          </button>
        )}
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 16,
};

const dialogStyle: React.CSSProperties = {
  background: '#101216',
  border: '1px solid rgba(200,168,75,0.3)',
  borderRadius: 12,
  padding: 24,
  width: '100%',
  maxWidth: 480,
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: 18,
};

const sectionLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  fontSize: '0.65rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--pulse-text-muted)',
  marginBottom: 8,
  fontFamily: 'JetBrains Mono, monospace',
};

const segmentBtnStyle: React.CSSProperties = {
  padding: '5px 12px',
  borderRadius: 6,
  border: '1px solid var(--pulse-border)',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--pulse-text-muted)',
  fontSize: '0.8rem',
  cursor: 'pointer',
};

const segmentBtnActiveStyle: React.CSSProperties = {
  background: 'rgba(200,168,75,0.15)',
  border: '1px solid rgba(200,168,75,0.4)',
  color: 'var(--pulse-gold)',
};

const rolePillStyle: React.CSSProperties = {
  padding: '3px 10px',
  borderRadius: 12,
  border: '1px solid var(--pulse-border)',
  background: 'transparent',
  color: 'var(--pulse-text-muted)',
  fontSize: '0.75rem',
  cursor: 'pointer',
};

const rolePillActiveStyle: React.CSSProperties = {
  background: 'rgba(200,168,75,0.15)',
  border: '1px solid rgba(200,168,75,0.4)',
  color: 'var(--pulse-gold)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid var(--pulse-border)',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--pulse-text)',
  fontSize: '0.82rem',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const primaryBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '9px 16px',
  borderRadius: 7,
  border: 'none',
  background: 'rgba(200,168,75,0.2)',
  color: 'var(--pulse-gold)',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 0.15s',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '9px 16px',
  borderRadius: 7,
  border: '1px solid var(--pulse-border)',
  background: 'transparent',
  color: 'var(--pulse-text-muted)',
  fontSize: '0.85rem',
  cursor: 'pointer',
};

const closeBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  borderRadius: 6,
  border: '1px solid var(--pulse-border)',
  background: 'transparent',
  color: 'var(--pulse-text-muted)',
  cursor: 'pointer',
};

