// GA4 event/parameter names: up to 40 characters, letters, numbers and
// underscore only, starting with a letter. Applied so the mirrored dataLayer
// event names are valid across GTM-fed providers (RF03 in the taxonomy doc).
const GA4_MAX_LENGTH = 40;

/**
 * Normalize a taxonomy string to snake_case: strip accents, lowercase, and
 * collapse every run of non-alphanumeric characters into a single underscore.
 */
export const toSnakeCase = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove accents
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

/**
 * Map an Amplitude event_type to a GA4-compatible dataLayer event name.
 * Guarantees a leading letter and the 40-character ceiling.
 *
 * @param eventType original taxonomy name, e.g. "Flight Searched"
 * @returns e.g. "flight_searched"
 */
export const toGtmEventName = (eventType: string): string => {
  const name = toSnakeCase(eventType);
  const safe = /^[a-z]/.test(name) ? name : `e_${name}`;
  return safe.slice(0, GA4_MAX_LENGTH);
};

/**
 * Return a copy of an event-properties object with every key converted to
 * snake_case. Values are passed through untouched.
 */
export const normalizeKeys = (props: Record<string, unknown> = {}): Record<string, unknown> =>
  Object.fromEntries(Object.entries(props).map(([key, value]) => [toSnakeCase(key), value]));
