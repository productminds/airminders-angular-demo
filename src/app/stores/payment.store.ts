import { inject, Injectable, signal } from '@angular/core';
import { MockApiError } from '../services/mock-api/errors';
import { submitPayment } from '../services/mock-api';
import type { Order, PaymentDetails } from '../types/domain';
import { JourneyStore } from './journey.store';
import type { RequestStatus } from './flight-search.store';

/**
 * RF-09/11/12: authorizes payment against the mock-api and, on success, mints
 * the order_id client-side (specs.md §4.2) at the moment of purchase
 * confirmation. Besides setting state, `pay` resolves with the outcome so the
 * caller can track it against the actual mock-api response.
 */
@Injectable()
export class PaymentStore {
  private readonly journey = inject(JourneyStore);

  private readonly _status = signal<RequestStatus>('idle');
  private readonly _error = signal<MockApiError | null>(null);

  readonly status = this._status.asReadonly();
  readonly error = this._error.asReadonly();

  async pay({
    bookingId,
    payment,
  }: {
    bookingId: string;
    payment: PaymentDetails;
  }): Promise<{ order: Order | null; error: MockApiError | null }> {
    this._status.set('loading');
    this._error.set(null);

    try {
      const { pnr, status } = await submitPayment({ bookingId, payment });
      const order: Order = {
        orderId: this.journey.createOrderId(),
        bookingId,
        pnr,
        status,
      };
      this._status.set('success');
      return { order, error: null };
    } catch (caughtError) {
      const error = caughtError as MockApiError;
      this._error.set(error);
      this._status.set('error');
      return { order: null, error };
    }
  }
}
