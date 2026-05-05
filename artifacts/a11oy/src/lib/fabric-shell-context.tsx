import type { AuditEvent } from '@szl-holdings/design-system/cockpit/audit-rail';
import type { EvidenceItem } from '@szl-holdings/design-system/cockpit/evidence-drawer';
import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';

interface FabricShellState {
  auditEvents: AuditEvent[];
  drawerOpen: boolean;
  drawerTitle: string;
  drawerEvidence: EvidenceItem[];
  pushAuditEvent: (event: AuditEvent) => void;
  openEvidenceDrawer: (title: string, evidence: EvidenceItem[]) => void;
  closeEvidenceDrawer: () => void;
}

const FabricShellContext = createContext<FabricShellState>({
  auditEvents: [],
  drawerOpen: false,
  drawerTitle: 'Evidence',
  drawerEvidence: [],
  pushAuditEvent: () => {},
  openEvidenceDrawer: () => {},
  closeEvidenceDrawer: () => {},
});

export function FabricShellProvider({ children }: { children: ReactNode }) {
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('Evidence');
  const [drawerEvidence, setDrawerEvidence] = useState<EvidenceItem[]>([]);

  const pushAuditEvent = useCallback((event: AuditEvent) => {
    setAuditEvents((prev) => [event, ...prev].slice(0, 60));
  }, []);

  const openEvidenceDrawer = useCallback((title: string, evidence: EvidenceItem[]) => {
    setDrawerTitle(title);
    setDrawerEvidence(evidence);
    setDrawerOpen(true);
  }, []);

  const closeEvidenceDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  return (
    <FabricShellContext.Provider
      value={{
        auditEvents,
        drawerOpen,
        drawerTitle,
        drawerEvidence,
        pushAuditEvent,
        openEvidenceDrawer,
        closeEvidenceDrawer,
      }}
    >
      {children}
    </FabricShellContext.Provider>
  );
}

export function useFabricShell() {
  return useContext(FabricShellContext);
}
