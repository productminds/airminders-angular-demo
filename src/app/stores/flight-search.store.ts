import { inject, Injectable, signal } from '@angular/core';
import { Analytics } from '../analytics/analytics';
import { MockApiError } from '../services/mock-api/errors';
import { searchFlights } from '../services/mock-api';
import type { SearchCriteria, SearchResults } from '../types/domain';

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * RF-01/12/13: orchestrates a flight search against the mock-api, tracking
 * loading/error state so a failure never surfaces as an unhandled error
 * (RNF-02). Provided per screen, so leaving the search step discards it.
 */
@Injectable()
export class FlightSearchStore {
  private readonly analytics = inject(Analytics);

  private readonly _status = signal<RequestStatus>('idle');
  private readonly _error = signal<MockApiError | null>(null);

  readonly status = this._status.asReadonly();
  readonly error = this._error.asReadonly();

  /** @returns the results, or null when the search failed. */
  async submitSearch(criteria: SearchCriteria): Promise<SearchResults | null> {
    const { searchId } = criteria;
    this._status.set('loading');
    this._error.set(null);

    // Intent event: fires on submit; the outcome events below fire only from
    // the mock-api's actual response — never optimistically.
    this.analytics.trackFlightSearchSubmitted(criteria);
    const startedAt = performance.now();

    try {
      const results = await searchFlights(criteria);
      this.analytics.trackFlightSearchResultsViewed({
        results,
        searchLatencyMs: Math.round(performance.now() - startedAt),
      });
      if (results.outboundOffers.length === 0) {
        this.analytics.trackFlightSearchFailed({ searchId, errorType: 'no_results' });
      }
      this._status.set('success');
      return results;
    } catch (caughtError) {
      const error = caughtError as MockApiError;
      this.analytics.trackFlightSearchFailed({
        searchId,
        errorType: error.type === 'timeout' ? 'timeout' : 'unexpected_error',
        errorCode: error.type,
      });
      this._error.set(error);
      this._status.set('error');
      return null;
    }
  }
}
