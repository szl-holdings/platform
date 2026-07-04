import { useCallback, useState } from 'react';
import { MergeNotification } from './merge-notification';
import { type EntitySchema, useCrdtEntity } from './use-crdt-entity';

export interface CrdtEntityPanelProps {
  entityType: string;
  entityId: string;
  actorId?: string;
  initialNotes?: string;
  initialStatus?: string;
  schema?: EntitySchema;
  apiBaseUrl?: string;
  label?: string;
}

export function CrdtEntityPanel({
  entityType,
  entityId,
  actorId = 'user',
  initialNotes = '',
  initialStatus = '',
  schema,
  apiBaseUrl = '/api',
  label = 'Collaborative Notes',
}: CrdtEntityPanelProps) {
  const [showMerge, setShowMerge] = useState(true);

  const { fields, setField, isConnected, pendingMerges, clearMerges } = useCrdtEntity(
    entityType,
    entityId,
    { notes: initialNotes, status: initialStatus },
    {
      actorId,
      ...(schema !== undefined ? { schema } : {}),
      apiBaseUrl,
      onMerge: () => setShowMerge(true),
    },
  );

  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setField('notes', e.target.value);
    },
    [setField],
  );

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setField('status', e.target.value);
    },
    [setField],
  );

  const handleDismiss = useCallback(() => {
    clearMerges();
    setShowMerge(false);
  }, [clearMerges]);

  return (
    <>
      <div
        style={{
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10,
          padding: '14px 16px',
          background: 'rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#94a3b8',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: isConnected ? '#22c55e' : '#94a3b8',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: isConnected ? '#22c55e' : '#94a3b8',
              }}
            />
            {isConnected ? 'Live sync' : 'Offline'}
          </span>
        </div>

        <div>
          <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
            Status
          </label>
          <input
            type="text"
            value={String(fields.status ?? '')}
            onChange={handleStatusChange}
            placeholder="e.g. In Review, Approved…"
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              padding: '6px 10px',
              color: '#e2e8f0',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
            Notes
          </label>
          <textarea
            value={String(fields.notes ?? '')}
            onChange={handleNotesChange}
            rows={3}
            placeholder="Add notes — edits sync in real time…"
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              padding: '6px 10px',
              color: '#e2e8f0',
              fontSize: 13,
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {showMerge && pendingMerges.length > 0 && (
        <MergeNotification merges={pendingMerges} onDismiss={handleDismiss} />
      )}
    </>
  );
}
