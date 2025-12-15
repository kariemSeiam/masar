// Application constants

export const DEFAULT_LOCATION = { lat: 30.5877, lng: 31.5020 };
export const GEOLOCATION_TIMEOUT = 10000;
export const GEOLOCATION_MAX_AGE = 60000; // 1 minute
export const DEBOUNCE_DELAY = 100;
export const ANIMATION_DURATION = 0.15;
export const MAP_UPDATE_DEBOUNCE = 100;

// Journey constants
export const ESTIMATED_TIME_PER_KM = 3; // minutes per kilometer (same as MINUTES_PER_KM in timing.ts)

// Re-export timing constants for backward compatibility
export { COPY_FEEDBACK_DURATION } from './constants/timing';

