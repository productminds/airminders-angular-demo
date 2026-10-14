import type {
  FareFamily,
  FlightOffer,
  PriceBreakdown,
  SearchResults,
  SelectedTrip,
} from '../types/domain';

const TAX_RATE = 0.2;

export function findOffer(
  offers: FlightOffer[] | undefined,
  flightNumber: string | undefined,
): FlightOffer | undefined {
  return offers?.find((offer) => offer.flightNumber === flightNumber);
}

export function findFareFamily(
  offer: FlightOffer | undefined,
  fareFamilyId: string | undefined,
): FareFamily | undefined {
  return offer?.fareFamilies.find((fareFamily) => fareFamily.id === fareFamilyId);
}

/**
 * RF-08: composes the price breakdown shown on the review screen from the
 * offers already fetched and the fares the user selected — no mock-api
 * round trip needed for this step.
 */
export function computePriceBreakdown({
  results,
  selectedTrip,
  passengerCount,
}: {
  results: SearchResults;
  selectedTrip: SelectedTrip;
  passengerCount: number;
}): PriceBreakdown {
  const outboundOffer = findOffer(results.outboundOffers, selectedTrip.outboundFlightNumber);
  const outboundFare = findFareFamily(outboundOffer, selectedTrip.outboundFareFamilyId);

  const inboundOffer = selectedTrip.inboundFlightNumber
    ? findOffer(results.inboundOffers, selectedTrip.inboundFlightNumber)
    : undefined;
  const inboundFare = findFareFamily(inboundOffer, selectedTrip.inboundFareFamilyId);

  const perPassengerFare = (outboundFare?.price ?? 0) + (inboundFare?.price ?? 0);
  const fareTotal = perPassengerFare * passengerCount;
  const taxesTotal = Math.round(fareTotal * TAX_RATE);

  return {
    fareTotal,
    taxesTotal,
    grandTotal: fareTotal + taxesTotal,
    currency: 'BRL',
  };
}

export function lowestFarePrice(offer: FlightOffer): number {
  return Math.min(...offer.fareFamilies.map((fareFamily) => fareFamily.price));
}
