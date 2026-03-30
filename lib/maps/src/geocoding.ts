export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  provider: "mapbox" | "google" | "mock";
  confidence?: number;
}

export interface ReverseGeocodeResult {
  formattedAddress: string;
  city?: string;
  country?: string;
  postalCode?: string;
  provider: "mapbox" | "google" | "mock";
}

async function geocodeViaMapbox(address: string): Promise<GeocodeResult> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) throw new Error("MAPBOX_ACCESS_TOKEN not configured");

  const encoded = encodeURIComponent(address);
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&limit=1`,
  );

  if (!res.ok) throw new Error(`Mapbox geocoding error: ${res.status}`);

  const data = (await res.json()) as {
    features: Array<{
      center: [number, number];
      place_name: string;
      relevance: number;
    }>;
  };

  if (!data.features || data.features.length === 0) {
    throw new Error("Mapbox: no results found for address");
  }

  const feature = data.features[0];
  return {
    latitude: feature.center[1],
    longitude: feature.center[0],
    formattedAddress: feature.place_name,
    provider: "mapbox",
    confidence: feature.relevance,
  };
}

async function geocodeViaGoogle(address: string): Promise<GeocodeResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY not configured");

  const encoded = encodeURIComponent(address);
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`,
  );

  if (!res.ok) throw new Error(`Google Maps geocoding error: ${res.status}`);

  const data = (await res.json()) as {
    status: string;
    results: Array<{
      formatted_address: string;
      geometry: {
        location: { lat: number; lng: number };
        location_type: string;
      };
    }>;
  };

  if (data.status !== "OK" || data.results.length === 0) {
    throw new Error(`Google Maps: ${data.status}`);
  }

  const result = data.results[0];
  return {
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
    formattedAddress: result.formatted_address,
    provider: "google",
  };
}

async function reverseGeocodeViaMapbox(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) throw new Error("MAPBOX_ACCESS_TOKEN not configured");

  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&limit=1`,
  );

  if (!res.ok) throw new Error(`Mapbox reverse geocoding error: ${res.status}`);

  const data = (await res.json()) as {
    features: Array<{
      place_name: string;
      context: Array<{ id: string; text: string }>;
    }>;
  };

  if (!data.features || data.features.length === 0) {
    throw new Error("Mapbox: no reverse geocoding results");
  }

  const feature = data.features[0];
  const city = feature.context?.find((c) => c.id.startsWith("place"))?.text;
  const country = feature.context?.find((c) => c.id.startsWith("country"))?.text;
  const postalCode = feature.context?.find((c) => c.id.startsWith("postcode"))?.text;

  return {
    formattedAddress: feature.place_name,
    city,
    country,
    postalCode,
    provider: "mapbox",
  };
}

async function reverseGeocodeViaGoogle(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY not configured");

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`,
  );

  if (!res.ok) throw new Error(`Google Maps reverse geocoding error: ${res.status}`);

  const data = (await res.json()) as {
    status: string;
    results: Array<{
      formatted_address: string;
      address_components: Array<{
        long_name: string;
        types: string[];
      }>;
    }>;
  };

  if (data.status !== "OK" || data.results.length === 0) {
    throw new Error(`Google Maps reverse geocoding: ${data.status}`);
  }

  const result = data.results[0];
  const getComponent = (type: string) =>
    result.address_components.find((c) => c.types.includes(type))?.long_name;

  return {
    formattedAddress: result.formatted_address,
    city: getComponent("locality"),
    country: getComponent("country"),
    postalCode: getComponent("postal_code"),
    provider: "google",
  };
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  if (process.env.MAPBOX_ACCESS_TOKEN) {
    try {
      return await geocodeViaMapbox(address);
    } catch (mapboxErr) {
      console.warn("[geocoding] Mapbox failed, trying Google Maps fallback:", (mapboxErr as Error).message);
    }
  }

  if (process.env.GOOGLE_MAPS_API_KEY) {
    return await geocodeViaGoogle(address);
  }

  console.warn("[geocoding] No geocoding provider configured, returning mock result");
  return {
    latitude: 0,
    longitude: 0,
    formattedAddress: address,
    provider: "mock",
    confidence: 0,
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  if (process.env.MAPBOX_ACCESS_TOKEN) {
    try {
      return await reverseGeocodeViaMapbox(lat, lng);
    } catch (mapboxErr) {
      console.warn("[geocoding] Mapbox reverse failed, trying Google Maps fallback:", (mapboxErr as Error).message);
    }
  }

  if (process.env.GOOGLE_MAPS_API_KEY) {
    return await reverseGeocodeViaGoogle(lat, lng);
  }

  return {
    formattedAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    provider: "mock",
  };
}

export function getGeocodingProviderStatus(): { mapbox: boolean; google: boolean } {
  return {
    mapbox: !!process.env.MAPBOX_ACCESS_TOKEN,
    google: !!process.env.GOOGLE_MAPS_API_KEY,
  };
}
