// Map-related utility functions

import { GOOGLE_MAPS_DIR_URL } from '@/lib/constants/urls';

/**
 * Generates a Google Maps direction URL for the given coordinates
 */
export function getGoogleMapsDirectionUrl(lat: number, lng: number): string {
  return `${GOOGLE_MAPS_DIR_URL}=${lat},${lng}`;
}

