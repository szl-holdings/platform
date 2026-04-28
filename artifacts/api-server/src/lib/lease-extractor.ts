
export function extractLeaseFromText(
  text: string,
  _filename: string,
): {
  tenant: string;
  commencementDate: string;
  expirationDate: string;
  baseRent: number;
  rentPerSqft: number;
  sqft: number;
  leaseType: string;
  premises: string;
  propertyAddress: string;
  escalations: string;
  cam: number;
  tiAllowance: number;
  securityDeposit: number;
  terminationOption: string;
  exclusiveUse: string;
  options: string[];
  confidence: number;
} {
  let confidence = 50;
  const fields: string[] = [];

  const tenantMatch =
    text.match(/TENANT[:\s]+([A-Z][A-Za-z\s,.]+(?:LLC|Inc\.|Corp\.|LP|LLP|Co\.)?)/i) ??
    text.match(/LESSEE[:\s]+([A-Z][A-Za-z\s,.]+(?:LLC|Inc\.|Corp\.|LP|LLP|Co\.)?)/i);
  const tenant = tenantMatch?.[1]?.trim() ?? 'Unknown Tenant';
  if (tenantMatch) {
    confidence += 10;
    fields.push('tenant');
  }

  const sqftMatch = text.match(/([\d,]+)\s*(?:square feet|sq\.?\s*ft\.?|SF)/i);
  const sqft = sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, ''), 10) : 0;
  if (sqftMatch) {
    confidence += 8;
    fields.push('sqft');
  }

  const rentPatterns = [
    /base rent[:\s]+\$?([\d,]+(?:\.\d{2})?)\s*(?:per month)?/i,
    /monthly rent[:\s]+\$?([\d,]+(?:\.\d{2})?)/i,
    /rent[:\s]+\$?([\d,]+(?:\.\d{2})?)\s*per month/i,
  ];
  let baseRent = 0;
  for (const p of rentPatterns) {
    const m = text.match(p);
    if (m) {
      baseRent = parseFloat(m[1].replace(/,/g, ''));
      confidence += 10;
      fields.push('baseRent');
      break;
    }
  }

  const rentPerSqft = sqft > 0 && baseRent > 0 ? parseFloat((baseRent / sqft).toFixed(2)) : 0;

  const commenceDateMatch = text.match(
    /(?:commencement|commence|start)\s*date[:\s]+(\w+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  );
  const commencementDate = commenceDateMatch
    ? new Date(commenceDateMatch[1]).toISOString().slice(0, 10)
    : '';
  if (commenceDateMatch && !Number.isNaN(new Date(commenceDateMatch[1]).getTime())) {
    confidence += 8;
    fields.push('commencementDate');
  }

  const expireDateMatch = text.match(
    /(?:expir(?:ation|y)|termination|end)\s*date[:\s]+(\w+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  );
  const expirationDate = expireDateMatch
    ? new Date(expireDateMatch[1]).toISOString().slice(0, 10)
    : '';
  if (expireDateMatch && !Number.isNaN(new Date(expireDateMatch[1]).getTime())) {
    confidence += 8;
    fields.push('expirationDate');
  }

  const leaseTypeMatch = text.match(
    /\b(NNN|Triple Net|Modified Gross|Full Service Gross|Gross Lease|Net Lease)\b/i,
  );
  const leaseType = leaseTypeMatch?.[1] ?? '';
  if (leaseTypeMatch) {
    confidence += 5;
    fields.push('leaseType');
  }

  const premisesMatch = text.match(
    /(?:premises|suite|space)[:\s]+([A-Za-z0-9\s,-]+(?:Suite|Floor|Ste\.?)[\w\s,]+)/i,
  );
  const premises = premisesMatch?.[1]?.trim().slice(0, 100) ?? '';
  if (premisesMatch) {
    confidence += 5;
    fields.push('premises');
  }

  const addrMatch = text.match(
    /(\d+\s+[A-Za-z\s]+(?:Street|St\.|Avenue|Ave\.|Boulevard|Blvd\.|Drive|Dr\.|Lane|Ln\.|Road|Rd\.|Way)[,\s]+[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5})/i,
  );
  const propertyAddress = addrMatch?.[1]?.trim() ?? '';
  if (addrMatch) {
    confidence += 7;
    fields.push('address');
  }

  const escalationMatch = text.match(/(?:escalation|rent increase)[:\s]+([^.;]{10,80})/i);
  const escalations = escalationMatch?.[1]?.trim() ?? '';
  if (escalationMatch) {
    confidence += 5;
    fields.push('escalations');
  }

  const camMatch = text.match(/(?:CAM|common area maintenance)[:\s]+\$?([\d,]+(?:\.\d{2})?)/i);
  const cam = camMatch ? parseFloat(camMatch[1].replace(/,/g, '')) : 0;
  if (camMatch) {
    confidence += 4;
    fields.push('cam');
  }

  const tiMatch = text.match(
    /(?:tenant improvement|TI)\s*allowance[:\s]+\$?([\d,]+(?:\.\d{2})?)/i,
  );
  const tiAllowance = tiMatch ? parseFloat(tiMatch[1].replace(/,/g, '')) : 0;
  if (tiMatch) {
    confidence += 5;
    fields.push('tiAllowance');
  }

  const depositMatch = text.match(/security deposit[:\s]+\$?([\d,]+(?:\.\d{2})?)/i);
  const securityDeposit = depositMatch ? parseFloat(depositMatch[1].replace(/,/g, '')) : 0;
  if (depositMatch) {
    confidence += 4;
    fields.push('securityDeposit');
  }

  const termMatch = text.match(/(?:early termination|termination option)[:\s]+([^.;]{10,100})/i);
  const terminationOption = termMatch?.[1]?.trim() ?? 'No early termination clause';

  const exclusiveMatch = text.match(/exclusive use[:\s]+([^.;]{5,80})/i);
  const exclusiveUse = exclusiveMatch?.[1]?.trim() ?? 'No exclusive use clause';

  const options: string[] = [];
  const optionMatch = text.match(/(?:renewal option|option to renew)[:\s]+([^.;]{10,120})/gi);
  if (optionMatch)
    options.push(
      ...optionMatch.map((m) =>
        m
          .replace(/^[^:]+:\s*/i, '')
          .trim()
          .slice(0, 100),
      ),
    );
  if (options.length > 0) {
    confidence += 5;
    fields.push('renewalOptions');
  }

  void fields;

  return {
    tenant,
    commencementDate,
    expirationDate,
    baseRent,
    rentPerSqft,
    sqft,
    leaseType,
    premises,
    propertyAddress,
    escalations,
    cam,
    tiAllowance,
    securityDeposit,
    terminationOption,
    exclusiveUse,
    options,
    confidence: Math.min(100, confidence),
  };
}
