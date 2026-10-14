import { randomInt, type Rng } from './random';

const MIN_LATENCY_MS = 300;
const MAX_LATENCY_MS = 1200;

/** RF-13: artificial latency (300-1200ms) so loading states are demonstrable. */
export function simulateLatency(rng: Rng): Promise<void> {
  const delayMs = randomInt(rng, MIN_LATENCY_MS, MAX_LATENCY_MS);
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}
