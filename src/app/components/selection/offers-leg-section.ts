import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Checkbox } from '../ui/checkbox';
import { LabelDirective } from '../ui/label';
import { Select, type SelectOption } from '../ui/select';
import { FlightOfferCard, type FareSelection } from './flight-offer-card';
import { lowestFarePrice } from '../../lib/pricing';
import type { FlightOffer } from '../../types/domain';
import type { FilterType, SortBy } from '../../analytics/analytics';

const SORT_OPTIONS: SelectOption<SortBy>[] = [
  { value: 'price', label: 'Menor preço' },
  { value: 'duration', label: 'Menor duração' },
  { value: 'stops', label: 'Menos paradas' },
];

const SORTERS: Record<SortBy, (a: FlightOffer, b: FlightOffer) => number> = {
  price: (a, b) => lowestFarePrice(a) - lowestFarePrice(b),
  duration: (a, b) => a.durationMinutes - b.durationMinutes,
  stops: (a, b) => a.stops - b.stops,
};

export interface FilterApplied {
  filterType: FilterType;
  sortBy?: SortBy;
  resultCountAfter: number;
}

export interface LegFareSelection extends FareSelection {
  /** 1-based position in the visible result list. */
  position: number;
}

/**
 * RF-04: sort and filter results (desirable requirement). RF-05/06: each leg's
 * offers are selected independently from the other leg.
 */
@Component({
  selector: 'app-offers-leg-section',
  imports: [Checkbox, FlightOfferCard, LabelDirective, Select],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './offers-leg-section.html',
})
export class OffersLegSection {
  readonly title = input.required<string>();
  readonly offers = input.required<FlightOffer[]>();
  readonly selectedFlightNumber = input<string | null>(null);
  readonly selectedFareFamilyId = input<string | null>(null);
  readonly selectFare = output<LegFareSelection>();
  readonly filterApplied = output<FilterApplied>();

  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly sortBy = signal<SortBy>('price');
  protected readonly directOnly = signal(false);

  protected readonly visibleOffers = computed(() => {
    const offers = this.offers();
    const filtered = this.directOnly() ? offers.filter((offer) => offer.stops === 0) : offers;
    return [...filtered].sort(SORTERS[this.sortBy()]);
  });

  protected onSortChange(sortBy: SortBy): void {
    this.sortBy.set(sortBy);
    this.filterApplied.emit({
      filterType: sortBy,
      sortBy,
      resultCountAfter: this.visibleOffers().length,
    });
  }

  protected onDirectOnlyChange(directOnly: boolean): void {
    this.directOnly.set(directOnly);
    this.filterApplied.emit({
      filterType: 'stops',
      resultCountAfter: this.visibleOffers().length,
    });
  }

  protected fareFamilyIdFor(offer: FlightOffer): string | null {
    return this.selectedFlightNumber() === offer.flightNumber ? this.selectedFareFamilyId() : null;
  }
}
