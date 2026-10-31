import { siteConfig } from "./site-config";

/**
 * Builds an external Google Maps "get directions" URL for the store.
 * Uses precise coordinates when `siteConfig.mapCoordinates` is set,
 * otherwise falls back to a text search on `siteConfig.address`.
 */
export function buildDirectionsUrl(): string {
  const { mapCoordinates, address } = siteConfig;

  const destination = mapCoordinates
    ? `${mapCoordinates.lat},${mapCoordinates.lng}`
    : address;

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    destination
  )}`;
}
