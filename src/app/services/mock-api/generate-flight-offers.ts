import type { CabinClass, FareFamily, FlightOffer } from '../../types/domain';
import { AIRLINES } from './data/airlines';
import { findAirport } from './data/airports';
import { CABIN_PRICE_MULTIPLIER, FARE_FAMILY_TEMPLATES } from './data/fare-families';
import { pickOne, randomInt, type Rng } from './random';

const OFFERS_PER_SEARCH = 6;
const DOMESTIC_DURATION_RANGE = [55, 240];
const INTERNATIONAL_DURATION_RANGE = [280, 640];
const BASE_PRICE_PER_MINUTE = 2.4;

function randomTimeOfDay(rng: Rng): { hour: number; minute: number } {
  return { hour: randomInt(rng, 5, 23), minute: pickOne(rng, [0, 15, 30, 45]) };
}

/** @param date YYYY-MM-DD */
function toDate(date: string, hour: number, minute: number): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

/** @returns duration in minutes */
function randomDuration(originIata: string, destinationIata: string, rng: Rng): number {
  const sameCountry = findAirport(originIata)?.country === findAirport(destinationIata)?.country;
  const [min, max] = sameCountry ? DOMESTIC_DURATION_RANGE : INTERNATIONAL_DURATION_RANGE;
  return randomInt(rng, min, max);
}

function buildFareFamilies(
  durationMinutes: number,
  cabinClass: CabinClass,
  rng: Rng,
): FareFamily[] {
  const basePrice =
    durationMinutes * BASE_PRICE_PER_MINUTE * CABIN_PRICE_MULTIPLIER[cabinClass] +
    randomInt(rng, -40, 60);

  return FARE_FAMILY_TEMPLATES.map((template) => ({
    id: template.id,
    name: template.name,
    price: Math.round(basePrice * template.priceMultiplier),
    currency: 'BRL',
    benefits: template.benefits,
  }));
}

export function generateFlightOffers(
  {
    originIata,
    destinationIata,
    date,
    cabinClass,
  }: {
    originIata: string;
    destinationIata: string;
    /** YYYY-MM-DD */
    date: string;
    cabinClass: CabinClass;
  },
  rng: Rng,
): FlightOffer[] {
  const offers: FlightOffer[] = [];

  for (let i = 0; i < OFFERS_PER_SEARCH; i += 1) {
    const airline = pickOne(rng, AIRLINES);
    const flightNumber = `${airline.slice(0, 2).toUpperCase()}${randomInt(rng, 1000, 9999)}`;
    const durationMinutes = randomDuration(originIata, destinationIata, rng);
    const stops = rng() < 0.75 ? 0 : 1;
    const layoverMinutes = stops > 0 ? randomInt(rng, 45, 130) : 0;

    const { hour, minute } = randomTimeOfDay(rng);
    const departureTime = toDate(date, hour, minute);
    const arrivalTime = new Date(
      departureTime.getTime() + (durationMinutes + layoverMinutes) * 60_000,
    );

    offers.push({
      flightNumber,
      airline,
      originIata,
      destinationIata,
      departureTime: departureTime.toISOString(),
      arrivalTime: arrivalTime.toISOString(),
      durationMinutes: durationMinutes + layoverMinutes,
      stops,
      fareFamilies: buildFareFamilies(durationMinutes, cabinClass, rng),
    });
  }

  return offers.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
}
