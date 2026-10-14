import { Injectable, signal } from '@angular/core';
import { generateId } from '../lib/ids';

/**
 * specs.md §4.2: search_id/booking_id/order_id correlate the same
 * search/reservation across steps and screens. This is the one piece of flow
 * state that spans the whole journey by nature, so it lives in a single
 * root-provided store instead of being threaded through inputs or duplicated
 * per step.
 */
@Injectable({ providedIn: 'root' })
export class JourneyStore {
  private readonly _searchId = signal<string | null>(null);
  private readonly _bookingId = signal<string | null>(null);
  private readonly _orderId = signal<string | null>(null);

  readonly searchId = this._searchId.asReadonly();
  readonly bookingId = this._bookingId.asReadonly();
  readonly orderId = this._orderId.asReadonly();

  createSearchId(): string {
    const id = generateId('search');
    this._searchId.set(id);
    this._bookingId.set(null);
    this._orderId.set(null);
    return id;
  }

  ensureBookingId(): string {
    const existing = this._bookingId();
    if (existing) return existing;

    const id = generateId('booking');
    this._bookingId.set(id);
    return id;
  }

  createOrderId(): string {
    const id = generateId('order');
    this._orderId.set(id);
    return id;
  }
}
