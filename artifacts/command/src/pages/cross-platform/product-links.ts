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

export type ProductKey =
  | "lyte"
  | "vessels"
  | "terra"
  | "prism"
  | "aegis"
  | "carlota";

const enc = (s: string) => encodeURIComponent(s);

/** Dashboard / home URL for a given product. */
export function productDashboardUrl(product: string): string {
  switch (product.toLowerCase()) {
    case "vessels":
      return "/vessels/dashboard";
    case "terra":
      return "/terra/dashboard";
    case "carlota":
      return "/carlota-jo/";
    case "aegis":
      return "/aegis/";
    case "prism":
      return "/operations/prism";
    case "lyte":
      return "/operations";
    default:
      return "/";
  }
}

/**
 * Detail-page URL for a specific entity inside a product.
 * Returns null if the product does not have a per-entity detail surface.
 */
export function productEntityUrl(
  product: string,
  entityId: string
): string | null {
  if (!entityId) return null;
  const id = enc(entityId);
  switch (product.toLowerCase()) {
    case "vessels":
      // Wouter route `/vessels/:id` mounted under base `/vessels`.
      return `/vessels/vessels/${id}`;
    case "terra":
      // Wouter route `/property/:id` mounted under base `/terra`.
      return `/terra/property/${id}`;
    case "carlota":
      return `/carlota-jo/inquiries?entity=${id}`;
    case "prism":
      return `/operations/prism?entity=${id}`;
    case "aegis":
      return `/aegis/?entity=${id}`;
    case "lyte":
      return `/operations?entity=${id}`;
    default:
      return null;
  }
}

/**
 * Best-guess origin product for an entity ID, used when a correlation spans
 * multiple products and we need to pick a primary drill-through target.
 *
 * Falls back to the first product in `candidateProducts` when no prefix
 * heuristic matches, and finally to "lyte" if the candidate list is empty.
 */
export function inferProductForEntity(
  entityId: string,
  candidateProducts: string[] = []
): ProductKey {
  const id = entityId.toLowerCase();

  // Vessels / maritime
  if (
    id.startsWith("imo") ||
    id.startsWith("mmsi") ||
    id.startsWith("vessel") ||
    id.startsWith("voyage") ||
    id.startsWith("port-")
  ) {
    return "vessels";
  }

  // Terra / real estate
  if (
    id.startsWith("bbl") ||
    id.startsWith("bin-") ||
    id.startsWith("dp-") ||
    id.startsWith("prop") ||
    id.startsWith("nyc-") ||
    id.startsWith("parcel") ||
    id.startsWith("listing")
  ) {
    return "terra";
  }

  // PRISM Counsel
  if (
    id.startsWith("matter") ||
    id.startsWith("case-") ||
    id.startsWith("prism") ||
    id.startsWith("filing")
  ) {
    return "prism";
  }

  // Aegis Security
  if (
    id.startsWith("cve") ||
    id.startsWith("finding") ||
    id.startsWith("threat") ||
    id.startsWith("ioc-") ||
    id.startsWith("aegis")
  ) {
    return "aegis";
  }

  // Carlota Jo Consulting
  if (
    id.startsWith("carlota") ||
    id.startsWith("engagement") ||
    id.startsWith("partner") ||
    id.startsWith("inq-")
  ) {
    return "carlota";
  }

  // Lyte AIOps
  if (
    id.startsWith("inc-") ||
    id.startsWith("incident") ||
    id.startsWith("lyte") ||
    id.startsWith("run-")
  ) {
    return "lyte";
  }

  // Fallback: first product attached to the correlation.
  const fallback = candidateProducts[0]?.toLowerCase();
  const known: ProductKey[] = ["lyte", "vessels", "terra", "prism", "aegis", "carlota"];
  if (fallback && (known as string[]).includes(fallback)) {
    return fallback as ProductKey;
  }
  return "lyte";
}
