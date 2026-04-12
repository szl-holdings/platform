export type CitationType = "case_citation" | "statute" | "regulation" | "docket" | "constitution";

export type VerificationStatus = "verified" | "unverified" | "suspicious";

export interface Citation {
  id: string;
  raw: string;
  type: CitationType;
  normalizedText: string;
  caseName?: string;
  reporter?: string;
  volume?: string;
  page?: string;
  year?: string;
  court?: string;
  docketNumber?: string;
  code?: string;
  section?: string;
  startIndex: number;
  endIndex: number;
}

export interface VerifiedCitation extends Citation {
  status: VerificationStatus;
  confidenceScore: number;
  verificationNotes: string;
  suspicionReasons?: string[];
  verifiedAt: string;
}

export interface CitationAuditReport {
  id: string;
  documentId: string;
  documentTitle: string;
  matterId?: number;
  verifiedAt: string;
  totalCitations: number;
  verifiedCount: number;
  unverifiedCount: number;
  suspiciousCount: number;
  citations: VerifiedCitation[];
  overallStatus: "clear" | "needs_review" | "blocked";
  blockingCitations: VerifiedCitation[];
  averageConfidence: number;
  verificationDurationMs: number;
}

const CASE_CITATION_PATTERN =
  /\b(\d+)\s+([A-Z][a-zA-Z.]+(?:\s+[A-Z][a-zA-Z.]+)*)\s+(\d+)(?:,\s*\d+)?(?:\s*\(([^)]+)\s+(\d{4})\))?\b/g;

const STATUTE_PATTERN =
  /\b(\d+)\s+U\.?S\.?C\.?\s*§\s*([\d\w.()–-]+)/gi;

const STATE_STATUTE_PATTERN =
  /\b([A-Z][a-z]+\.?)\s+(?:Stat\.|Code|Rev\.?\s+Stat\.|Gen\.?\s+Laws?|Ann\.?)\s*(?:§|ch\.?|sec\.?)?\s*([\d.\w()–-]+)/gi;

const REGULATION_PATTERN =
  /\b(\d+)\s+C\.?F\.?R\.?\s*(?:§|pt\.?)?\s*([\d.\w()–-]+)/gi;

const DOCKET_PATTERN =
  /\bNo\.?\s+([\d\w:.-]+\s*(?:cv|cr|civ|crim|misc|ca|dc|mc|bk|ap|adv)[\w.-]*)\b/gi;

const CONSTITUTIONAL_PATTERN =
  /\b(?:U\.?S\.?\s+)?Const(?:itution)?\.?\s+(?:art(?:icle)?\.?\s+[IVX]+|amend(?:ment)?\.?\s+(?:[IVX]+|\d+))\b/gi;

export function extractCitations(documentText: string): Citation[] {
  const citations: Citation[] = [];
  let idCounter = 1;

  const addCitation = (
    raw: string,
    type: CitationType,
    startIndex: number,
    props: Partial<Citation>
  ) => {
    citations.push({
      id: `cit_${idCounter++}`,
      raw,
      type,
      normalizedText: raw.replace(/\s+/g, " ").trim(),
      startIndex,
      endIndex: startIndex + raw.length,
      ...props,
    });
  };

  let match: RegExpExecArray | null;

  CASE_CITATION_PATTERN.lastIndex = 0;
  while ((match = CASE_CITATION_PATTERN.exec(documentText)) !== null) {
    addCitation(match[0], "case_citation", match.index, {
      volume: match[1],
      reporter: match[2],
      page: match[3],
      court: match[4],
      year: match[5],
    });
  }

  STATUTE_PATTERN.lastIndex = 0;
  while ((match = STATUTE_PATTERN.exec(documentText)) !== null) {
    addCitation(match[0], "statute", match.index, {
      code: `${match[1]} U.S.C.`,
      section: match[2],
    });
  }

  STATE_STATUTE_PATTERN.lastIndex = 0;
  while ((match = STATE_STATUTE_PATTERN.exec(documentText)) !== null) {
    addCitation(match[0], "statute", match.index, {
      code: match[1],
      section: match[2],
    });
  }

  REGULATION_PATTERN.lastIndex = 0;
  while ((match = REGULATION_PATTERN.exec(documentText)) !== null) {
    addCitation(match[0], "regulation", match.index, {
      code: `${match[1]} C.F.R.`,
      section: match[2],
    });
  }

  DOCKET_PATTERN.lastIndex = 0;
  while ((match = DOCKET_PATTERN.exec(documentText)) !== null) {
    addCitation(match[0], "docket", match.index, {
      docketNumber: match[1],
    });
  }

  CONSTITUTIONAL_PATTERN.lastIndex = 0;
  while ((match = CONSTITUTIONAL_PATTERN.exec(documentText)) !== null) {
    addCitation(match[0], "constitution", match.index, {});
  }

  const seen = new Set<string>();
  return citations.filter(c => {
    const key = `${c.type}:${c.normalizedText}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const KNOWN_REPORTERS = new Set([
  "U.S.", "S.Ct.", "L.Ed.", "L.Ed.2d", "F.2d", "F.3d", "F.4th", "F.Supp.",
  "F.Supp.2d", "F.Supp.3d", "B.R.", "Fed.Appx.", "Fed.", "F.",
  "A.2d", "A.3d", "B.2d", "Cal.", "Cal.App.", "Cal.App.2d", "Cal.App.3d",
  "Cal.App.4th", "Cal.App.5th", "N.Y.", "N.Y.2d", "N.Y.3d", "N.Y.S.",
  "N.Y.S.2d", "N.Y.S.3d", "N.E.", "N.E.2d", "N.E.3d", "So.2d", "So.3d",
  "S.W.", "S.W.2d", "S.W.3d", "N.W.", "N.W.2d", "P.", "P.2d", "P.3d",
  "Fla.", "Fla.App.", "Tex.", "Tex.App.", "Ill.", "Ill.App.",
  "Wash.", "Wash.App.", "Ohio St.", "Ohio App.", "Mich.", "N.J.", "N.J.Super.",
  "Pa.", "Pa.Super.", "Va.", "Ga.", "Ga.App.", "Ariz.", "Colo.",
]);

const KNOWN_COURTS = new Set([
  "1st Cir.", "2d Cir.", "3d Cir.", "4th Cir.", "5th Cir.", "6th Cir.",
  "7th Cir.", "8th Cir.", "9th Cir.", "10th Cir.", "11th Cir.", "D.C. Cir.",
  "Fed. Cir.", "S.D.N.Y.", "E.D.N.Y.", "N.D.Cal.", "S.D.Cal.", "C.D.Cal.",
  "M.D.Fla.", "S.D.Fla.", "N.D.Fla.", "N.D.Ill.", "S.D.Tex.", "E.D.Pa.",
  "W.D.Pa.", "D.N.J.", "D.Mass.", "D.Conn.", "D.Md.", "E.D.Va.", "W.D.Va.",
  "W.D.Wash.", "D.Ariz.", "D.Colo.", "D.Nev.", "W.D.Tex.", "N.D.Tex.",
  "N.D.Ohio", "S.D.Ohio", "D.Or.", "D.Utah", "D.Minn.", "E.D.Mich.",
  "W.D.Mich.", "N.D.Ga.", "N.D.N.Y.", "W.D.N.Y.", "E.D.Mich.",
]);

const SUSPICIOUS_HALLUCINATION_PATTERNS = [
  /\b\d{4}\s+U\.S\.\s+\d+\b/,
  /\b1[5-9]\d{2}\b/,
  /\b20[3-9]\d\b/,
];

function assessCaseCitation(citation: Citation): {
  status: VerificationStatus;
  confidence: number;
  notes: string;
  reasons?: string[];
} {
  const reasons: string[] = [];
  let confidence = 0.5;

  const reporter = citation.reporter?.trim() ?? "";
  const isKnownReporter = [...KNOWN_REPORTERS].some(
    r => reporter.includes(r) || r.includes(reporter)
  );
  if (isKnownReporter) {
    confidence += 0.25;
  } else {
    reasons.push(`Unknown reporter: "${reporter}"`);
    confidence -= 0.2;
  }

  const year = citation.year ? parseInt(citation.year) : null;
  const currentYear = new Date().getFullYear();
  if (year !== null) {
    if (year < 1800 || year > currentYear) {
      reasons.push(`Implausible year: ${year}`);
      confidence -= 0.3;
    } else if (year >= 1900 && year <= currentYear) {
      confidence += 0.1;
    }
  }

  const volume = citation.volume ? parseInt(citation.volume) : null;
  if (volume !== null && (volume < 1 || volume > 999)) {
    reasons.push(`Unusual volume number: ${volume}`);
    confidence -= 0.15;
  }

  const court = citation.court?.trim();
  if (court) {
    const isKnownCourt = [...KNOWN_COURTS].some(c => court.includes(c));
    if (isKnownCourt) confidence += 0.1;
  }

  for (const pattern of SUSPICIOUS_HALLUCINATION_PATTERNS) {
    if (pattern.test(citation.raw)) {
      reasons.push("Citation matches known AI hallucination pattern");
      confidence -= 0.35;
    }
  }

  confidence = Math.max(0, Math.min(1, confidence));

  let status: VerificationStatus;
  if (confidence >= 0.7) {
    status = "verified";
  } else if (confidence >= 0.4) {
    status = "unverified";
  } else {
    status = "suspicious";
  }

  return {
    status,
    confidence,
    notes: reasons.length === 0
      ? "Citation format consistent with known legal reporters and courts"
      : `Verification concerns: ${reasons.join("; ")}`,
    reasons: reasons.length > 0 ? reasons : undefined,
  };
}

function assessStatute(citation: Citation): {
  status: VerificationStatus;
  confidence: number;
  notes: string;
  reasons?: string[];
} {
  const VALID_USC_TITLES = new Set([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
    39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 54,
  ]);

  const reasons: string[] = [];
  let confidence = 0.65;

  if (citation.code?.includes("U.S.C.")) {
    const titleMatch = citation.raw.match(/(\d+)\s+U\.?S\.?C/i);
    const title = titleMatch ? parseInt(titleMatch[1]) : null;
    if (title !== null && !VALID_USC_TITLES.has(title)) {
      reasons.push(`Title ${title} does not exist in U.S.C.`);
      confidence -= 0.4;
    } else if (title !== null) {
      confidence += 0.2;
    }
  }

  const sectionStr = citation.section ?? "";
  if (/[a-z]{3,}/i.test(sectionStr) && !/[A-Z]/.test(sectionStr)) {
    reasons.push("Section designator contains unusual alphabetic sequences");
    confidence -= 0.2;
  }

  confidence = Math.max(0, Math.min(1, confidence));
  const status: VerificationStatus =
    confidence >= 0.7 ? "verified" : confidence >= 0.4 ? "unverified" : "suspicious";

  return {
    status,
    confidence,
    notes: reasons.length === 0
      ? "Statute reference format is valid"
      : `Statute concerns: ${reasons.join("; ")}`,
    reasons: reasons.length > 0 ? reasons : undefined,
  };
}

function assessRegulation(citation: Citation): {
  status: VerificationStatus;
  confidence: number;
  notes: string;
  reasons?: string[];
} {
  const VALID_CFR_TITLES = new Set([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
    39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
  ]);

  const reasons: string[] = [];
  let confidence = 0.6;

  const titleMatch = citation.raw.match(/(\d+)\s+C\.?F\.?R/i);
  const title = titleMatch ? parseInt(titleMatch[1]) : null;
  if (title !== null && !VALID_CFR_TITLES.has(title)) {
    reasons.push(`Title ${title} does not exist in C.F.R.`);
    confidence -= 0.35;
  } else if (title !== null) {
    confidence += 0.15;
  }

  confidence = Math.max(0, Math.min(1, confidence));
  const status: VerificationStatus =
    confidence >= 0.7 ? "verified" : confidence >= 0.4 ? "unverified" : "suspicious";

  return {
    status,
    confidence,
    notes: reasons.length === 0
      ? "C.F.R. reference format valid"
      : `Regulation concerns: ${reasons.join("; ")}`,
    reasons: reasons.length > 0 ? reasons : undefined,
  };
}

function assessDocket(citation: Citation): {
  status: VerificationStatus;
  confidence: number;
  notes: string;
  reasons?: string[];
} {
  const docket = citation.docketNumber ?? "";
  const isPlausible = /\d{2,4}/.test(docket) && docket.length >= 4;
  return {
    status: isPlausible ? "unverified" : "suspicious",
    confidence: isPlausible ? 0.55 : 0.25,
    notes: isPlausible
      ? "Docket format plausible — cannot verify without court records access"
      : "Docket number format unusual",
    reasons: isPlausible ? undefined : ["Docket number too short or malformed"],
  };
}

function assessConstitution(citation: Citation): {
  status: VerificationStatus;
  confidence: number;
  notes: string;
} {
  return {
    status: "verified",
    confidence: 0.95,
    notes: "Constitutional citation format verified",
  };
}

export function verifyCitations(citations: Citation[]): VerifiedCitation[] {
  return citations.map(citation => {
    let result: { status: VerificationStatus; confidence: number; notes: string; reasons?: string[] };

    switch (citation.type) {
      case "case_citation":
        result = assessCaseCitation(citation);
        break;
      case "statute":
        result = assessStatute(citation);
        break;
      case "regulation":
        result = assessRegulation(citation);
        break;
      case "docket":
        result = assessDocket(citation);
        break;
      case "constitution":
        result = assessConstitution(citation);
        break;
      default:
        result = { status: "unverified", confidence: 0.5, notes: "Unknown citation type" };
    }

    return {
      ...citation,
      status: result.status,
      confidenceScore: result.confidence,
      verificationNotes: result.notes,
      suspicionReasons: result.reasons,
      verifiedAt: new Date().toISOString(),
    };
  });
}

export function generateAuditReport(
  documentId: string,
  documentTitle: string,
  documentText: string,
  matterId?: number
): CitationAuditReport {
  const start = Date.now();
  const citations = extractCitations(documentText);
  const verified = verifyCitations(citations);

  const verifiedCount = verified.filter(c => c.status === "verified").length;
  const unverifiedCount = verified.filter(c => c.status === "unverified").length;
  const suspiciousCount = verified.filter(c => c.status === "suspicious").length;
  const blockingCitations = verified.filter(c => c.status === "suspicious");

  const avgConfidence =
    verified.length > 0
      ? verified.reduce((sum, c) => sum + c.confidenceScore, 0) / verified.length
      : 1;

  let overallStatus: "clear" | "needs_review" | "blocked";
  if (suspiciousCount > 0) {
    overallStatus = "blocked";
  } else if (unverifiedCount > 0) {
    overallStatus = "needs_review";
  } else {
    overallStatus = "clear";
  }

  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    documentId,
    documentTitle,
    matterId,
    verifiedAt: new Date().toISOString(),
    totalCitations: verified.length,
    verifiedCount,
    unverifiedCount,
    suspiciousCount,
    citations: verified,
    overallStatus,
    blockingCitations,
    averageConfidence: avgConfidence,
    verificationDurationMs: Date.now() - start,
  };
}
