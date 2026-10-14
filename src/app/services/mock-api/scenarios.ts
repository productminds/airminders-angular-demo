/**
 * RF-12: forced failure scenarios, selectable via a debug query param so
 * every failure path is reproducible without touching app state.
 * Usage: append ?mockScenario=empty|timeout|validationFail|paymentDeclined
 * to any URL. Optionally pin the pseudo-random seed with &mockSeed=1234.
 */

export const MOCK_SCENARIOS = ['empty', 'timeout', 'validationFail', 'paymentDeclined'] as const;

export type MockScenario = (typeof MOCK_SCENARIOS)[number];

export function getForcedScenario(): MockScenario | null {
  const value = new URLSearchParams(window.location.search).get('mockScenario');
  return MOCK_SCENARIOS.includes(value as MockScenario) ? (value as MockScenario) : null;
}

export function getPinnedSeed(): number | null {
  const value = new URLSearchParams(window.location.search).get('mockSeed');
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
