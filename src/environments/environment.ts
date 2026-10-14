/**
 * RT-03: nothing sensitive is hardcoded in app code. The Amplitude API key
 * is a publishable client-side key, so it lives here rather than in a
 * secret store, but it is still read from one place per environment.
 */
export const environment = {
  production: true,
  /** Ampli environment name, as declared in src/app/analytics/ampli. */
  amplitudeEnvironment: 'goldemoamplicli' as const,
  /**
   * Taxonomy event names forwarded to window.dataLayer. Empty forwards
   * every event (taxonomy doc §6.6) — narrow it per rollout phase (§14.1).
   */
  dataLayerAllowlist: [] as string[],
};
