import { Injectable } from '@angular/core';
import packageJson from '../../../package.json';
import { environment } from '../../environments/environment';
import { findFareFamily, findOffer, lowestFarePrice } from '../lib/pricing';
import { findAirport } from '../services/mock-api/data/airports';
import type { MockApiErrorType } from '../services/mock-api/errors';
import type {
  FareFamily,
  FlightOffer,
  Order,
  Passenger,
  PassengerFieldError,
  PaymentDetails,
  PriceBreakdown,
  SearchCriteria,
  SearchResults,
  SelectedTrip,
  TripType,
} from '../types/domain';
import { ampli } from './ampli';

/** Tracking-plan vocabulary. Kept here so it never leaks into app layers. */
export type ScreenName =
  | 'home'
  | 'search_results'
  | 'flight_selection'
  | 'passenger_details'
  | 'booking_review'
  | 'payment'
  | 'confirmation';

export type BookingStep = 'search' | 'select' | 'passenger' | 'review' | 'payment' | 'confirmation';

export type EntryPoint = 'home' | 'results_edit' | 'deeplink';
export type LegType = 'outbound' | 'inbound';
export type FilterType = 'stops' | 'departure_time' | 'duration' | 'airline' | 'price';
export type SortBy = 'price' | 'duration' | 'stops';
export type SearchErrorType = 'no_results' | 'invalid_route' | 'timeout' | 'unexpected_error';

const CURRENCY = 'BRL' as const;

// Tracking plan enum is light/plus/top; the app's fare families are
// basica/essencial/flex (services/mock-api/data/fare-families.ts). Mapped
// here so neither vocabulary leaks into the other layer.
const FARE_FAMILY_BY_ID: Record<string, 'light' | 'plus' | 'top'> = {
  basica: 'light',
  essencial: 'plus',
  flex: 'top',
};

const FIELD_NAME_BY_FORM_FIELD: Record<
  PassengerFieldError['fieldName'],
  'first_name' | 'last_name' | 'birth_date' | 'document_number' | 'email' | 'phone'
> = {
  firstName: 'first_name',
  lastName: 'last_name',
  birthDate: 'birth_date',
  documentNumber: 'document_number',
  email: 'email',
  phone: 'phone',
};

const SORT_TYPE_BY_SORT: Record<SortBy, 'price_asc' | 'duration_asc' | undefined> = {
  price: 'price_asc',
  duration: 'duration_asc',
  // The plan has no stops-ascending sort type; the filter_type already says 'stops'.
  stops: undefined,
};

// Mock-api error vocabulary → tracking plan failure_reason enum.
const FAILURE_REASON_BY_ERROR: Partial<
  Record<MockApiErrorType, 'card_declined' | 'gateway_timeout'>
> = {
  payment_declined: 'card_declined',
  timeout: 'gateway_timeout',
};

const MS_PER_DAY = 86_400_000;

/**
 * Analytics facade (docs/AMPLI-CLI.md §3): the only module allowed to import
 * ./ampli. Callers pass camelCase domain data; the snake_case event-property
 * convention and all tracking-plan vocabulary mappings stay contained here.
 */
@Injectable({ providedIn: 'root' })
export class Analytics {
  // Journey timing is a purely analytical concern, so it lives here instead
  // of in app state: feeds the optional time_to_* properties.
  private searchSubmittedAt: number | null = null;
  private selectionStartedAt: number | null = null;
  private passengerStartedAt: number | null = null;

  trackScreenViewed({
    screenName,
    bookingStep,
    referrerScreen,
  }: {
    screenName: ScreenName;
    bookingStep?: BookingStep;
    referrerScreen?: ScreenName;
  }): void {
    ampli.screenViewed({
      ...this.baseProperties(),
      screen_name: screenName,
      booking_step: bookingStep,
      referrer_screen: referrerScreen,
    });
  }

  trackLogoClicked({ screenName }: { screenName?: ScreenName } = {}): void {
    ampli.logoClicked({ ...this.baseProperties(), screen_name: screenName as ScreenName });
    ampli.returnToHomePage({current_page: 'page', environment: environment.production ? 'production' : 'development'});
  }

  trackFlightSearchStarted({ entryPoint }: { entryPoint: EntryPoint }): void {
    ampli.flightSearchStarted({ ...this.baseProperties(), entry_point: entryPoint });
  }

  /** Intent event: fires on submit, before the mock-api responds. */
  trackFlightSearchSubmitted(criteria: SearchCriteria): void {
    this.searchSubmittedAt = Date.now();
    this.selectionStartedAt = null;
    this.passengerStartedAt = null;

    const isRoundTrip = criteria.tripType === 'round_trip';
    ampli.flightSearchSubmitted({
      ...this.baseProperties(),
      search_id: criteria.searchId,
      trip_type: criteria.tripType,
      origin_iata: criteria.originIata,
      destination_iata: criteria.destinationIata,
      departure_date: criteria.departureDate,
      return_date: criteria.returnDate,
      cabin_class: criteria.cabinClass,
      days_to_departure: daysToDeparture(criteria.departureDate),
      is_domestic: isDomestic(criteria.originIata, criteria.destinationIata),
      trip_length_days:
        isRoundTrip && criteria.returnDate
          ? Math.round(
              (Date.parse(criteria.returnDate) - Date.parse(criteria.departureDate)) / MS_PER_DAY,
            )
          : undefined,
      passenger_adult_count: criteria.passengerAdultCount,
      // RF-01: the search form only books adult passengers today
      passenger_child_count: 0,
      passenger_infant_count: 0,
    });
  }

  /** Outcome event: fires only after the mock-api resolves. */
  trackFlightSearchResultsViewed({
    results,
    searchLatencyMs,
  }: {
    results: SearchResults;
    searchLatencyMs: number;
  }): void {
    this.selectionStartedAt = Date.now();

    const hasResults = results.outboundOffers.length > 0;
    ampli.flightSearchResultsViewed({
      ...this.baseProperties(),
      search_id: results.searchId,
      result_count: results.outboundOffers.length + (results.inboundOffers?.length ?? 0),
      has_results: hasResults,
      lowest_price_amount: hasResults
        ? Math.min(...results.outboundOffers.map(lowestFarePrice))
        : undefined,
      search_latency_ms: searchLatencyMs,
      currency: CURRENCY,
    });
  }

  /**
   * Outcome event. "Flight Search Failed" is not in tracking plan v5 yet, so
   * it goes through the wrapper's generic track(). Once the event is added in
   * Amplitude Data and the SDK re-pulled, replace this with the typed method.
   */
  trackFlightSearchFailed({
    searchId,
    errorType,
    errorCode,
  }: {
    searchId: string;
    errorType: SearchErrorType;
    errorCode?: string;
  }): void {
    ampli.track({
      event_type: 'Flight Search Failed',
      event_properties: {
        ...this.baseProperties(),
        search_id: searchId,
        error_type: errorType,
        error_code: errorCode,
      },
    });
  }

  trackFlightSearchFilterApplied({
    searchId,
    filterType,
    sortBy,
    resultCountAfter,
  }: {
    searchId: string;
    filterType: FilterType;
    /** present only for sort changes */
    sortBy?: SortBy;
    resultCountAfter: number;
  }): void {
    ampli.flightSearchFilterApplied({
      ...this.baseProperties(),
      search_id: searchId,
      filter_type: filterType,
      sort_type: sortBy ? SORT_TYPE_BY_SORT[sortBy] : undefined,
      result_count_after: resultCountAfter,
    });
  }

  trackFlightSelected({
    searchId,
    legType,
    offer,
    fare,
    position,
  }: {
    searchId: string;
    legType: LegType;
    offer: FlightOffer;
    fare: FareFamily;
    /** 1-based position in the visible result list */
    position: number;
  }): void {
    ampli.flightSelected({
      ...this.baseProperties(),
      search_id: searchId,
      leg_type: legType,
      flight_number: offer.flightNumber,
      carrier_code: offer.flightNumber.slice(0, 2),
      departure_hour: new Date(offer.departureTime).getHours(),
      duration_minutes: offer.durationMinutes,
      is_direct: offer.stops === 0,
      stops_count: offer.stops,
      price_amount: fare.price,
      result_position: position,
      currency: CURRENCY,
    });
  }

  trackFareSelected({
    searchId,
    legType,
    offer,
    fare,
  }: {
    searchId: string;
    legType: LegType;
    offer: FlightOffer;
    fare: FareFamily;
  }): void {
    ampli.fareSelected({
      ...this.baseProperties(),
      search_id: searchId,
      leg_type: legType,
      fare_family: FARE_FAMILY_BY_ID[fare.id],
      price_amount: fare.price,
      price_difference_from_lowest: fare.price - lowestFarePrice(offer),
      currency: CURRENCY,
    });
  }

  trackTripSelectionCompleted({
    searchId,
    tripType,
    totalAmount,
  }: {
    searchId: string;
    tripType: TripType;
    totalAmount: number;
  }): void {
    ampli.tripSelectionCompleted({
      ...this.baseProperties(),
      search_id: searchId,
      trip_type: tripType,
      total_amount: totalAmount,
      time_to_select_seconds: secondsSince(this.selectionStartedAt),
      currency: CURRENCY,
    });
  }

  trackCheckoutStarted({
    searchId,
    bookingId,
    tripType,
    totalAmount,
    passengerTotalCount,
  }: {
    searchId: string;
    bookingId: string;
    tripType: TripType;
    totalAmount: number;
    passengerTotalCount: number;
  }): void {
    ampli.checkoutStarted({
      ...this.baseProperties(),
      search_id: searchId,
      booking_id: bookingId,
      trip_type: tripType,
      total_amount: totalAmount,
      passenger_total_count: passengerTotalCount,
      currency: CURRENCY,
    });
  }

  trackPassengerDetailsStarted({
    bookingId,
    passengerTotalCount,
  }: {
    bookingId: string;
    passengerTotalCount: number;
  }): void {
    this.passengerStartedAt = Date.now();
    ampli.passengerDetailsStarted({
      ...this.baseProperties(),
      booking_id: bookingId,
      passenger_total_count: passengerTotalCount,
    });
  }

  trackPassengerDetailsValidationFailed({
    bookingId,
    fieldName,
    errorType,
    attemptCount,
  }: {
    bookingId: string;
    fieldName: PassengerFieldError['fieldName'];
    errorType: PassengerFieldError['errorType'];
    attemptCount: number;
  }): void {
    ampli.passengerDetailsValidationFailed({
      ...this.baseProperties(),
      booking_id: bookingId,
      field_name: FIELD_NAME_BY_FORM_FIELD[fieldName],
      error_type: errorType,
      attempt_count: attemptCount,
    });
  }

  /**
   * Intent event: metadata only — no name, document, or contact ever leaves
   * the form (specs.md RS-01).
   */
  trackPassengerDetailsSubmitted({
    bookingId,
    passengers,
  }: {
    bookingId: string;
    passengers: Passenger[];
  }): void {
    ampli.passengerDetailsSubmitted({
      ...this.baseProperties(),
      booking_id: bookingId,
      document_type: documentTypeOf(passengers[0].documentNumber),
      passenger_total_count: passengers.length,
      // RF-01: only adult passengers are bookable today
      has_infant: false,
      time_to_complete_seconds: secondsSince(this.passengerStartedAt),
    });
  }

  trackBookingReviewViewed({
    bookingId,
    breakdown,
  }: {
    bookingId: string;
    breakdown: PriceBreakdown;
  }): void {
    ampli.bookingReviewViewed({
      ...this.baseProperties(),
      booking_id: bookingId,
      base_fare_amount: breakdown.fareTotal,
      taxes_amount: breakdown.taxesTotal,
      total_amount: breakdown.grandTotal,
      currency: CURRENCY,
    });
  }

  trackBookingDetailsConfirmed({
    bookingId,
    totalAmount,
  }: {
    bookingId: string;
    totalAmount: number;
  }): void {
    ampli.bookingDetailsConfirmed({
      ...this.baseProperties(),
      booking_id: bookingId,
      total_amount: totalAmount,
      currency: CURRENCY,
    });
  }

  trackPaymentMethodSelected({
    bookingId,
    method,
    milesUsedCount,
  }: {
    bookingId: string;
    method: PaymentDetails['method'];
    milesUsedCount?: number;
  }): void {
    ampli.paymentMethodSelected({
      ...this.baseProperties(),
      booking_id: bookingId,
      payment_method: method,
      miles_used_count: milesUsedCount,
    });
  }

  /** Intent event: no card number, CVV or Pix key is ever sent (RS-02). */
  trackPaymentDetailsSubmitted({
    bookingId,
    payment,
    totalAmount,
  }: {
    bookingId: string;
    payment: PaymentDetails;
    totalAmount: number;
  }): void {
    ampli.paymentDetailsSubmitted({
      ...this.baseProperties(),
      booking_id: bookingId,
      payment_method: payment.method,
      card_brand: payment.cardBrand,
      installment_count: payment.installments,
      total_amount: totalAmount,
      currency: CURRENCY,
    });
  }

  /**
   * Outcome event: fires only from the mock-api's rejection, never
   * optimistically. "Payment Failed" is not in tracking plan v5 yet — see
   * trackFlightSearchFailed for why this uses the generic track().
   */
  trackPaymentFailed({
    bookingId,
    payment,
    totalAmount,
    attemptCount,
    mockErrorType,
  }: {
    bookingId: string;
    payment: PaymentDetails;
    totalAmount: number;
    attemptCount: number;
    mockErrorType?: MockApiErrorType;
  }): void {
    ampli.track({
      event_type: 'Payment Failed',
      event_properties: {
        ...this.baseProperties(),
        booking_id: bookingId,
        payment_method: payment.method,
        total_amount: totalAmount,
        attempt_count: attemptCount,
        failure_reason:
          (mockErrorType && FAILURE_REASON_BY_ERROR[mockErrorType]) ?? 'gateway_timeout',
        currency: CURRENCY,
      },
    });
  }

  /**
   * Outcome event and the only one authorized to carry revenue. Fires only
   * after the mock-api confirms the payment, with a deterministic insert_id
   * (the order_id) so a retried delivery can never double-count revenue.
   */
  trackPurchaseCompleted({
    order,
    criteria,
    results,
    selectedTrip,
    passengers,
    payment,
    breakdown,
  }: {
    order: Order;
    criteria: SearchCriteria;
    results: SearchResults;
    selectedTrip: SelectedTrip;
    passengers: Passenger[];
    payment: PaymentDetails;
    breakdown: PriceBreakdown;
  }): void {
    const outboundFare = findFareFamily(
      findOffer(results.outboundOffers, selectedTrip.outboundFlightNumber),
      selectedTrip.outboundFareFamilyId,
    );

    ampli.purchaseCompleted(
      {
        ...this.baseProperties(),
        order_id: order.orderId,
        booking_id: order.bookingId,
        booking_reference: order.pnr,
        search_id: results.searchId,
        trip_type: criteria.tripType,
        origin_iata: criteria.originIata,
        destination_iata: criteria.destinationIata,
        cabin_class: criteria.cabinClass,
        days_to_departure: daysToDeparture(criteria.departureDate),
        is_domestic: isDomestic(criteria.originIata, criteria.destinationIata),
        fare_family: FARE_FAMILY_BY_ID[outboundFare!.id],
        base_fare_amount: breakdown.fareTotal,
        taxes_amount: breakdown.taxesTotal,
        revenue: breakdown.grandTotal,
        passenger_total_count: passengers.length,
        payment_method: payment.method,
        installment_count: payment.installments,
        time_to_purchase_seconds: secondsSince(this.searchSubmittedAt),
        currency: CURRENCY,
      },
      { insert_id: order.orderId },
    );
  }

  trackBookingConfirmationViewed({
    bookingId,
    bookingReference,
  }: {
    bookingId: string;
    bookingReference: string;
  }): void {
    ampli.bookingConfirmationViewed({
      ...this.baseProperties(),
      booking_id: bookingId,
      booking_reference: bookingReference,
    });
  }

  private baseProperties() {
    return {
      app_version: packageJson.version,
      environment: environment.production ? ('production' as const) : ('development' as const),
      locale: navigator.language,
      platform: 'web' as const,
    };
  }
}

function secondsSince(timestamp: number | null): number | undefined {
  return timestamp ? Math.round((Date.now() - timestamp) / 1000) : undefined;
}

function daysToDeparture(departureDate: string): number {
  return Math.max(0, Math.round((Date.parse(departureDate) - Date.now()) / MS_PER_DAY));
}

function isDomestic(originIata: string, destinationIata: string): boolean {
  return (
    findAirport(originIata)?.country === 'Brasil' &&
    findAirport(destinationIata)?.country === 'Brasil'
  );
}

/**
 * The passenger form collects a single free-form document number (RF-07),
 * so the plan's document_type enum is inferred from its shape.
 */
function documentTypeOf(documentNumber: string): 'cpf' | 'passport' | 'rg' {
  if (/[a-zA-Z]/.test(documentNumber)) return 'passport';
  return documentNumber.replace(/\D/g, '').length === 11 ? 'cpf' : 'rg';
}
