import { inject, Injectable, signal } from '@angular/core';
import { Analytics } from '../analytics/analytics';
import { MockApiError } from '../services/mock-api/errors';
import { submitPassengers } from '../services/mock-api';
import type { Passenger, PassengerFieldErrorWithId } from '../types/domain';
import type { RequestStatus } from './flight-search.store';

/**
 * RF-07/12: submits passenger data for the (simulated) backend re-validation
 * pass, surfacing field-level errors instead of throwing unhandled (RNF-02).
 */
@Injectable()
export class PassengerSubmitStore {
  private readonly analytics = inject(Analytics);

  private readonly _status = signal<RequestStatus>('idle');
  private readonly _fieldErrors = signal<PassengerFieldErrorWithId[]>([]);

  readonly status = this._status.asReadonly();
  readonly fieldErrors = this._fieldErrors.asReadonly();

  /** @returns true when the mock-api accepted the passengers. */
  async submit({
    bookingId,
    passengers,
    attemptCount,
  }: {
    bookingId: string;
    passengers: Passenger[];
    attemptCount: number;
  }): Promise<boolean> {
    this._status.set('loading');
    this._fieldErrors.set([]);

    try {
      await submitPassengers({ bookingId, passengers });
      this._status.set('success');
      return true;
    } catch (caughtError) {
      const error = caughtError as MockApiError;
      const fieldErrors = error.fieldErrors ?? [];
      this._fieldErrors.set(fieldErrors);
      this._status.set('error');

      // Outcome: server-side (mock-api) validation failures, tracked from the
      // actual response — never optimistically.
      for (const fieldError of fieldErrors) {
        this.analytics.trackPassengerDetailsValidationFailed({
          bookingId,
          fieldName: fieldError.fieldName,
          errorType: fieldError.errorType,
          attemptCount,
        });
      }
      return false;
    }
  }
}
