import type { CabinClass } from '../../../types/domain';

export const FARE_FAMILY_TEMPLATES = [
  {
    id: 'basica',
    name: 'Básica',
    priceMultiplier: 1,
    benefits: ['1 item pessoal de mão'],
  },
  {
    id: 'essencial',
    name: 'Essencial',
    priceMultiplier: 1.25,
    benefits: ['1 item pessoal de mão', '1 bagagem despachada (23kg)'],
  },
  {
    id: 'flex',
    name: 'Flex',
    priceMultiplier: 1.6,
    benefits: [
      '1 item pessoal de mão',
      '1 bagagem despachada (23kg)',
      'Remarcação sem custo',
      'Escolha de assento inclusa',
    ],
  },
];

export const CABIN_PRICE_MULTIPLIER: Record<CabinClass, number> = {
  economy: 1,
  premium_economy: 1.6,
  business: 2.8,
};
