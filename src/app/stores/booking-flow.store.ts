import { Injectable, signal } from '@angular/core';
import type {
  Order,
  Passenger,
  SearchCriteria,
  SearchResults,
  SelectedTrip,
} from '../types/domain';

/**
 * The flow's step-to-step data. Provided on the booking flow's route rather
 * than at the root, so it is scoped exactly to the steps that share it — the
 * journey correlation IDs are the separate, genuinely global concern (see
 * JourneyStore).
 */
@Injectable()
export class BookingFlowStore {
  readonly criteria = signal<SearchCriteria | null>(null);
  readonly results = signal<SearchResults | null>(null);
  readonly selectedTrip = signal<SelectedTrip | null>(null);
  readonly passengers = signal<Passenger[] | null>(null);
  readonly order = signal<Order | null>(null);

  /** A new search invalidates everything chosen against the previous one. */
  resetAfterSearch(): void {
    this.selectedTrip.set(null);
    this.passengers.set(null);
    this.order.set(null);
  }

  resetFlow(): void {
    this.criteria.set(null);
    this.results.set(null);
    this.resetAfterSearch();
  }
}
