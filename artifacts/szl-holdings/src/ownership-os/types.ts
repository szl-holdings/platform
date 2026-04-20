export interface OwnershipScenario {
  id: number;
  name: string;
  description?: string;
  isTemplate: boolean;
  isActive: boolean;
  isPreferred: boolean;
  status: string;
  certificationFitSummary?: string;
  fundraisingFitScore?: number;
  bankFitScore?: number;
  investorClarityScore?: number;
  notes?: string;
}

export interface Allocation {
  id: number;
  scenarioId: number;
  personName: string;
  role: string;
  equityPct: string;
  votingRightsPct?: string;
  isControlling: boolean;
  isMajorityOwner: boolean;
  citizenshipConfirmed: boolean;
  notes?: string;
}

export interface ControlRole {
  id: number;
  personName: string;
  roleType?: string;
  hasDayToDayControl: boolean;
  hasLongTermDecisionAuthority: boolean;
  hasHiringFiringAuthority: boolean;
  hasStrategicVeto: boolean;
  controlDescription?: string;
}

export interface OfficerRole {
  id: number;
  personName: string;
  title: string;
  isPrimaryOfficer: boolean;
  isOnRegistration: boolean;
  isOnBankAccount: boolean;
  isOnOperatingAgreement: boolean;
  notes?: string;
}

export interface ManagerRole {
  id: number;
  personName: string;
  managementArea: string;
  responsibility?: string;
  isDocumented: boolean;
}

export interface SignatureAuthority {
  id: number;
  personName: string;
  authorityType: string;
  institution?: string;
  isActive: boolean;
  documentationStatus: string;
  notes?: string;
}

export interface CertReadiness {
  id: number;
  certificationName: string;
  certificationBody?: string;
  fitLevel: string;
  keyRequirements?: string;
  gapSummary?: string;
  requiredDocuments?: string[];
}

export interface LegalFlag {
  id: number;
  flagType: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  assignedTo?: string;
}

export interface GovernanceDoc {
  id: number;
  documentType: string;
  title: string;
  status: string;
  notes?: string;
}

export interface ScenarioDetail {
  scenario: OwnershipScenario;
  allocations: Allocation[];
  controlRoles: ControlRole[];
  officerRoles: OfficerRole[];
  managerRoles: ManagerRole[];
  signatureAuth: SignatureAuthority[];
  certReadiness: CertReadiness[];
  legalFlags: LegalFlag[];
  govDocs: GovernanceDoc[];
  decisionLog: Array<{
    id: number;
    decisionType: string;
    summary: string;
    madeBy?: string;
    occurredAt: string;
  }>;
}

export interface NextActions {
  openLegalFlags: LegalFlag[];
  missingDocuments: GovernanceDoc[];
  documentsNeedingUpdate: GovernanceDoc[];
  unconfirmedCitizenships: Allocation[];
  pendingSignatureAuthority: SignatureAuthority[];
  totalActionItems: number;
}
