import { normalizeKeys, toGtmEventName, toSnakeCase } from './naming';

describe('toSnakeCase', () => {
  it('remove acentos e colapsa separadores', () => {
    expect(toSnakeCase('Revisão da Reserva')).toBe('revisao_da_reserva');
    expect(toSnakeCase('  Flight   Searched  ')).toBe('flight_searched');
    expect(toSnakeCase('[Teste] Logo Home Clicked')).toBe('teste_logo_home_clicked');
  });
});

describe('toGtmEventName', () => {
  it('garante nome iniciando por letra', () => {
    expect(toGtmEventName('1st Search')).toBe('e_1st_search');
  });

  it('respeita o limite de 40 caracteres do GA4', () => {
    const name = toGtmEventName('Passenger Details Validation Failed On Review Screen');
    expect(name).toBe('passenger_details_validation_failed_on_r');
    expect(name.length).toBe(40);
  });
});

describe('normalizeKeys', () => {
  it('converte chaves e preserva valores', () => {
    expect(normalizeKeys({ 'Flight Origin': 'GRU', days_to_departure: 12 })).toEqual({
      flight_origin: 'GRU',
      days_to_departure: 12,
    });
  });
});
