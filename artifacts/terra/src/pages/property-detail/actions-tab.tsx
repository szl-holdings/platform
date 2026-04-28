import { CheckCircle, Loader2, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { OperationalQueueRow } from '@szl-holdings/shared-ui';
import type { OperationalEntity } from '@szl-holdings/shared-ui';

interface ActionItem {
  id: string | number;
  issue: string;
  severity: string;
  ownerName: string;
  ownerRole: string;
  dueDate?: string | null;
  status?: string | null;
  recommendedAction?: string | null;
  updatedAt: string;
}

interface Props {
  actionItems: ActionItem[];
  actionItemsLoading: boolean;
  isLiveData: boolean;
  updatingActionId: string | null;
  propertyId: string;
  onUpdateStatus: (id: string, status: string, propertyId: string) => void;
}

export function ActionsTab({
  actionItems,
  actionItemsLoading,
  isLiveData,
  updatingActionId,
  propertyId,
  onUpdateStatus,
}: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
      {actionItemsLoading ? (
        <div className="rounded-xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" style={{ color: '#40856a' }} />
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading action items…</p>
        </div>
      ) : actionItems.length > 0 ? (
        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {actionItems.map((item) => {
            const isUpdating = updatingActionId === item.id;
            const statusNorm = ((item.status ?? 'open').replace('-', '_')) as OperationalEntity['status'];
            const entity: OperationalEntity & { entityType: string } = {
              id: String(item.id),
              entityType: `${item.severity.toUpperCase()} · ${item.ownerRole}`,
              title: item.issue,
              status: statusNorm,
              riskLevel: (item.severity === 'critical' || item.severity === 'high'
                ? item.severity
                : item.severity === 'medium' ? 'medium' : 'low') as OperationalEntity['riskLevel'],
              owner: { name: item.ownerName, role: item.ownerRole },
              nextAction: item.recommendedAction
                ? { label: item.recommendedAction, actionType: 'resolve', dueAt: item.dueDate ?? undefined }
                : undefined,
              updatedAt: item.updatedAt,
            };
            return (
              <div key={String(item.id)} className="border-b last:border-b-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                <OperationalQueueRow entity={entity} />
                {isLiveData && (
                  <div className="flex items-center gap-2 px-3 pb-2.5 justify-end">
                    {isUpdating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    ) : statusNorm !== 'resolved' ? (
                      <>
                        {statusNorm === 'open' && (
                          <button
                            onClick={() => onUpdateStatus(String(item.id), 'in_progress', propertyId)}
                            className="text-[10px] px-2 py-1 rounded transition-colors"
                            style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)' }}
                          >
                            Start
                          </button>
                        )}
                        <button
                          onClick={() => onUpdateStatus(String(item.id), 'resolved', propertyId)}
                          className="text-[10px] px-2 py-1 rounded transition-colors"
                          style={{ background: 'rgba(64,133,106,0.1)', color: '#40856a', border: '1px solid rgba(64,133,106,0.25)' }}
                        >
                          Resolve
                        </button>
                      </>
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5" style={{ color: '#40856a' }} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Target className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>No open action items for this asset</p>
        </div>
      )}
    </motion.div>
  );
}
