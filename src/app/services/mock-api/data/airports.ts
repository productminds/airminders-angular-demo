import type { Airport } from '../../../types/domain';

export const AIRPORTS: Airport[] = [
  { iataCode: 'GRU', city: 'São Paulo', country: 'Brasil' },
  { iataCode: 'GIG', city: 'Rio de Janeiro', country: 'Brasil' },
  { iataCode: 'BSB', city: 'Brasília', country: 'Brasil' },
  { iataCode: 'CNF', city: 'Belo Horizonte', country: 'Brasil' },
  { iataCode: 'SSA', city: 'Salvador', country: 'Brasil' },
  { iataCode: 'POA', city: 'Porto Alegre', country: 'Brasil' },
  { iataCode: 'REC', city: 'Recife', country: 'Brasil' },
  { iataCode: 'FOR', city: 'Fortaleza', country: 'Brasil' },
  { iataCode: 'CWB', city: 'Curitiba', country: 'Brasil' },
  { iataCode: 'MAO', city: 'Manaus', country: 'Brasil' },
  { iataCode: 'EZE', city: 'Buenos Aires', country: 'Argentina' },
  { iataCode: 'SCL', city: 'Santiago', country: 'Chile' },
  { iataCode: 'LIS', city: 'Lisboa', country: 'Portugal' },
  { iataCode: 'MIA', city: 'Miami', country: 'Estados Unidos' },
];

export function findAirport(iataCode: string): Airport | undefined {
  return AIRPORTS.find((airport) => airport.iataCode === iataCode);
}
