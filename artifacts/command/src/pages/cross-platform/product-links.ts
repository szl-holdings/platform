/**
 * Deep-link helpers for cross-platform correlation surfaces.
 *
 * Maps a product domain (lyte, vessels, terra, prism, aegis, carlota) and an
 * optional entity identifier to the absolute URL of the originating product so
 * operators can drill from a correlation card directly into the product detail
 * page that emitted the signal.
 *
 * URLs are absolute (path-based artifact routing) and intended to be opened in
 * a new tab from the Command artifact.
 */

export type ProductKey = 'lyte' | 'vessels' | 'terra' | 'prism' | 'aegis' | 'carlota';

const enc = (s: string) => encodeURIComponent(s);

/** Dashboard / home URL for a given product. */
export function productDashboardUrl(product: string): string {
  switch (product.toLowerCase()) {
    case 'vessels':
      return '/vessels/dashboard';
    case 'terra':
      return '/terra/dashboard';
    case 'carlota':
      return '/carlota-jo/';
    case 'aegis':
      return '/aegis/';
    case 'prism':
      return '/operations/prism';
    case 'lyte':
      return '/operations';
    default:
      return '/';
  }
}

/**
 * Detail-page URL for a specific entity inside a product.
 * Returns null if the product does not have a per-entity detail surface.
 */
export function productEntityUrl(product: string, entityId: string): string | null {
  if (!entityId) return null;
  const id = enc(entityId);
  switch (product.toLowerCase()) {
    case 'vessels':
      // Wouter route `/vessels/:id` mounted under base `/vessels`.
      return `/vessels/vessels/${id}`;
    case 'terra':
      // Wouter route `/property/:id` mounted under base `/terra`.
      return `/terra/property/${id}`;
    case 'carlota':
      return `/carlota-jo/inquiries?entity=${id}`;
    case 'prism':
      return `/operations/prism?entity=${id}`;
    case 'aegis':
      return `/aegis/?entity=${id}`;
    case 'lyte':
      return `/operations?entity=${id}`;
    default:
      return null;
  }
}

