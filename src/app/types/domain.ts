/**
 * Domain shapes shared across components, stores and services/mock-api.
 * The React original encoded these as JSDoc @typedef because it had no
 * compiler (specs.md RT-01/RT-06); here TypeScript enforces them directly.
 */

export const TRIP_TYPES = ['one_way', 'round_trip'] as const;

export const CABIN_CLASSES = ['economy', 'premium_economy', 'business'] as const;

export const PAYMENT_METHODS = ['credit_card', 'pix', 'miles'] as const;

export type TripType = (typeof TRIP_TYPES)[number];
export type CabinClass = (typeof CABIN_CLASSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const CABIN_CLASS_LABELS: Record<CabinClass, string> = {
  economy: 'Econômica',
  premium_economy: 'Econômica Premium',
  business: 'Executiva',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  credit_card: 'Cartão de crédito',
  pix: 'Pix',
  miles: 'Milhas',
};

export interface Airport {
  iataCode: string;
  city: string;
  country: string;
}

export interface SearchCriteria {
  searchId: string;
  tripType: TripType;
  originIata: string;
  destinationIata: string;
  /** YYYY-MM-DD */
  departureDate: string;
  /** YYYY-MM-DD, required when tripType is round_trip */
  returnDate?: string;
  passengerAdultCount: number;
  cabinClass: CabinClass;
}

export interface FareFamily {
  id: string;
  name: string;
  price: number;
  currency: string;
  benefits: string[];
}

export interface FlightOffer {
  flightNumber: string;
  airline: string;
  originIata: string;
  destinationIata: string;
  /** ISO datetime */
  departureTime: string;
  /** ISO datetime */
  arrivalTime: string;
  durationMinutes: number;
  stops: number;
  fareFamilies: FareFamily[];
}

export interface SearchResults {
  searchId: string;
  outboundOffers: FlightOffer[];
  inboundOffers?: FlightOffer[];
}

export interface SelectedTrip {
  outboundFlightNumber?: string;
  outboundFareFamilyId?: string;
  inboundFlightNumber?: string;
  inboundFareFamilyId?: string;
}

export interface Passenger {
  passengerId: string;
  firstName: string;
  lastName: string;
  /** YYYY-MM-DD */
  birthDate: string;
  documentNumber: string;
  email: string;
  phone: string;
}

export interface PriceBreakdown {
  fareTotal: number;
  taxesTotal: number;
  grandTotal: number;
  currency: string;
}

export interface PaymentDetails {
  method: PaymentMethod;
  /** only for credit_card */
  installments?: number;
  /** mocked, never persisted (RS-02) */
  cardHolderName?: string;
  /** mocked, never persisted (RS-02) */
  cardLast4?: string;
  /** derived from the issuer prefix, never the number itself (RS-02) */
  cardBrand?: 'visa' | 'mastercard' | 'amex';
}

export interface Order {
  orderId: string;
  bookingId: string;
  pnr: string;
  status: 'confirmed';
}

/** Shape shared by lib/validators and the mock-api's re-validation pass. */
export interface PassengerFieldError {
  fieldName: keyof Omit<Passenger, 'passengerId'>;
  errorType: 'required' | 'invalid_format';
}

export interface PassengerFieldErrorWithId extends PassengerFieldError {
  passengerId: string;
}
