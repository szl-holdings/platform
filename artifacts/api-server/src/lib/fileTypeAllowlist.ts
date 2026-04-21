/**
 * Domain-specific file type allowlists.
 *
 * Each domain key corresponds to one of the platform's product domains.
 * When a domain is specified on an upload request, the content type is validated
 * against that domain's allowlist. Unknown domains fall back to the default allowlist.
 *
 * "default" is used when no domain is specified or the domain is unrecognised.
 */

export type UploadDomain =
  | 'prism'
  | 'terra'
  | 'vessels'
  | 'aegis'
  | 'lyte'
  | 'szl'
  | 'carlota-jo'
  | 'default';

interface DomainAllowlist {
  label: string;
  mimeTypes: Set<string>;
  maxFileSizeBytes: number;
}

const MB = 1024 * 1024;
const GB = 1024 * MB;

const ALLOWLISTS: Record<UploadDomain, DomainAllowlist> = {
  prism: {
    label: 'Counsel',
    mimeTypes: new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/rtf',
      'application/zip',
      'application/x-zip-compressed',
    ]),
    maxFileSizeBytes: 100 * MB,
  },

  terra: {
    label: 'Terra Real Estate',
    mimeTypes: new Set([
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'image/tiff',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ]),
    maxFileSizeBytes: 200 * MB,
  },

  vessels: {
    label: 'Vessels Maritime',
    mimeTypes: new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/zip',
      'application/x-zip-compressed',
      'application/xml',
      'text/xml',
    ]),
    maxFileSizeBytes: 150 * MB,
  },

  aegis: {
    label: 'Aegis Security',
    mimeTypes: new Set([
      'application/pdf',
      'application/json',
      'text/plain',
      'text/csv',
      'application/xml',
      'text/xml',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/zip',
      'application/x-zip-compressed',
    ]),
    maxFileSizeBytes: 50 * MB,
  },

  lyte: {
    label: 'Lyte AIOps',
    mimeTypes: new Set([
      'application/json',
      'text/plain',
      'text/csv',
      'application/pdf',
      'application/xml',
      'text/xml',
      'application/zip',
      'application/x-zip-compressed',
      'application/octet-stream',
    ]),
    maxFileSizeBytes: 500 * MB,
  },

  szl: {
    label: 'SZL Holdings',
    mimeTypes: new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/zip',
      'application/x-zip-compressed',
    ]),
    maxFileSizeBytes: 100 * MB,
  },

  'carlota-jo': {
    label: 'Carlota Jo Consulting',
    mimeTypes: new Set([
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]),
    maxFileSizeBytes: 50 * MB,
  },

  default: {
    label: 'Default',
    mimeTypes: new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/zip',
      'application/x-zip-compressed',
      'application/json',
      'application/xml',
      'text/xml',
      'application/octet-stream',
    ]),
    maxFileSizeBytes: 100 * MB,
  },
};

const GLOBAL_MAX_FILE_SIZE_BYTES = 1 * GB;

function resolveDomain(domain?: string | null): UploadDomain {
  if (!domain) return 'default';
  if (domain in ALLOWLISTS) return domain as UploadDomain;
  return 'default';
}

export interface FileTypeValidationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Validate a file's MIME type and size against the allowlist for a given domain.
 */
export function validateFileType(
  contentType: string,
  sizeBytes: number,
  domain?: string | null,
): FileTypeValidationResult {
  const resolved = resolveDomain(domain);
  const allowlist = ALLOWLISTS[resolved];

  if (!allowlist.mimeTypes.has(contentType.toLowerCase().split(';')[0].trim())) {
    const allowed = Array.from(allowlist.mimeTypes).join(', ');
    return {
      allowed: false,
      reason: `File type "${contentType}" is not allowed for domain "${allowlist.label}". Allowed types: ${allowed}`,
    };
  }

  if (sizeBytes > GLOBAL_MAX_FILE_SIZE_BYTES) {
    return {
      allowed: false,
      reason: `File size ${sizeBytes} bytes exceeds the global maximum of ${GLOBAL_MAX_FILE_SIZE_BYTES} bytes (1 GB).`,
    };
  }

  if (sizeBytes > allowlist.maxFileSizeBytes) {
    return {
      allowed: false,
      reason: `File size ${sizeBytes} bytes exceeds the maximum of ${allowlist.maxFileSizeBytes} bytes for domain "${allowlist.label}".`,
    };
  }

  return { allowed: true };
}

/**
 * Get the allowlist config for a domain (for informational/docs use).
 */
export function getDomainAllowlist(domain?: string | null): DomainAllowlist {
  return ALLOWLISTS[resolveDomain(domain)];
}
