import type { Passenger, PassengerFieldError } from '../types/domain';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const REQUIRED_FIELDS = [
  'firstName',
  'lastName',
  'birthDate',
  'documentNumber',
  'email',
  'phone',
] as const satisfies readonly PassengerFieldError['fieldName'][];

export function validatePassenger(passenger: Passenger): PassengerFieldError[] {
  const errors: PassengerFieldError[] = [];

  for (const fieldName of REQUIRED_FIELDS) {
    if (!passenger[fieldName]?.trim()) {
      errors.push({ fieldName, errorType: 'required' });
    }
  }

  if (passenger.email && !EMAIL_PATTERN.test(passenger.email)) {
    errors.push({ fieldName: 'email', errorType: 'invalid_format' });
  }

  if (passenger.birthDate && Number.isNaN(Date.parse(passenger.birthDate))) {
    errors.push({ fieldName: 'birthDate', errorType: 'invalid_format' });
  }

  return errors;
}
