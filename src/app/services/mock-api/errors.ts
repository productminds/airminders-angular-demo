import type { PassengerFieldErrorWithId } from '../../types/domain';

export type MockApiErrorType = 'timeout' | 'validation_failed' | 'payment_declined';

export class MockApiError extends Error {
  readonly type: MockApiErrorType;
  /** Populated only for 'validation_failed' (RF-07). */
  fieldErrors?: PassengerFieldErrorWithId[];

  constructor(message: string, type: MockApiErrorType) {
    super(message);
    this.name = 'MockApiError';
    this.type = type;
  }
}
