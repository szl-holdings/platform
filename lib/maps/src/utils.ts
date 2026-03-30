export interface LatLon {
  lat: number;
  lon: number;
}

export function toMapCoords(
  lat: number,
  lon: number,
  width: number,
  height: number
): { x: number; y: number } {
  const x = ((lon + 180) / 360) * width;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = height / 2 - (mercN / Math.PI) * (height / 2);
  return { x, y };
}

export function greatCircleDistance(a: LatLon, b: LatLon): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const aVal =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLon *
      sinDLon;
  return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
}

export function bearingBetween(a: LatLon, b: LatLon): number {
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function formatCoordinate(value: number, axis: "lat" | "lon"): string {
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const min = ((abs - deg) * 60).toFixed(2);
  const dir =
    axis === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";
  return `${deg}°${min}'${dir}`;
}

export interface VesselCluster<T extends LatLon> {
  cx: number;
  cy: number;
  vessels: T[];
}

export function clusterVessels<T extends LatLon>(
  vessels: T[],
  width: number,
  height: number,
  threshold = 30
): VesselCluster<T>[] {
  const mapped = vessels.map((v) => ({
    v,
    ...toMapCoords(v.lat, v.lon, width, height),
  }));
  const visited = new Set<number>();
  const clusters: VesselCluster<T>[] = [];

  mapped.forEach((a, i) => {
    if (visited.has(i)) return;
    const group = [a];
    visited.add(i);
    mapped.forEach((b, j) => {
      if (i === j || visited.has(j)) return;
      const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
      if (dist < threshold) {
        group.push(b);
        visited.add(j);
      }
    });
    clusters.push({
      cx: group.reduce((s, p) => s + p.x, 0) / group.length,
      cy: group.reduce((s, p) => s + p.y, 0) / group.length,
      vessels: group.map((g) => g.v),
    });
  });

  return clusters;
}
