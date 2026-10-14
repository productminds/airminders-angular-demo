import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { ArrowLeftRight, LucideAngularModule } from 'lucide-angular';
import { ButtonDirective } from '../ui/button';
import { InputDirective } from '../ui/input';
import { LabelDirective } from '../ui/label';
import { RadioGroup, type RadioOption } from '../ui/radio-group';
import { Select, type SelectOption } from '../ui/select';
import { AIRPORTS } from '../../services/mock-api';
import {
  CABIN_CLASS_LABELS,
  CABIN_CLASSES,
  type CabinClass,
  type SearchCriteria,
  type TripType,
} from '../../types/domain';

const TRIP_TYPE_OPTIONS: RadioOption<TripType>[] = [
  { value: 'round_trip', label: 'Ida e volta' },
  { value: 'one_way', label: 'Somente ida' },
];

/**
 * RF-01/02: presentational search form. Field-level required validation lives
 * here for immediate feedback; the actual search call is orchestrated by the
 * container via FlightSearchStore.
 */
@Component({
  selector: 'app-search-form',
  imports: [
    ButtonDirective,
    InputDirective,
    LabelDirective,
    LucideAngularModule,
    RadioGroup,
    Select,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search-form.html',
})
export class SearchForm {
  readonly isSubmitting = input.required<boolean>();
  readonly submitSearch = output<Omit<SearchCriteria, 'searchId'>>();
  /** First interaction with the form, for Flight Search Started. */
  readonly interact = output<void>();

  protected readonly today = new Date().toISOString().slice(0, 10);
  protected readonly tripTypeOptions = TRIP_TYPE_OPTIONS;
  protected readonly ArrowLeftRightIcon = ArrowLeftRight;

  protected readonly airportOptions: SelectOption<string>[] = AIRPORTS.map((airport) => ({
    value: airport.iataCode,
    label: `${airport.city} (${airport.iataCode})`,
  }));

  protected readonly cabinClassOptions: SelectOption<CabinClass>[] = CABIN_CLASSES.map(
    (cabinClass) => ({ value: cabinClass, label: CABIN_CLASS_LABELS[cabinClass] }),
  );

  protected readonly tripType = signal<TripType>('round_trip');
  protected readonly originIata = signal('GRU');
  protected readonly destinationIata = signal('GIG');
  protected readonly departureDate = signal('');
  protected readonly returnDate = signal('');
  protected readonly passengerAdultCount = signal(1);
  protected readonly cabinClass = signal<CabinClass>('economy');

  protected readonly errors = signal<Record<string, string>>({});

  protected readonly isRoundTrip = computed(() => this.tripType() === 'round_trip');

  protected swapAirports(): void {
    const origin = this.originIata();
    this.originIata.set(this.destinationIata());
    this.destinationIata.set(origin);
  }

  protected onSubmit(): void {
    const errors = this.validate();
    this.errors.set(errors);
    if (Object.keys(errors).length > 0) return;

    this.submitSearch.emit({
      tripType: this.tripType(),
      originIata: this.originIata(),
      destinationIata: this.destinationIata(),
      departureDate: this.departureDate(),
      returnDate: this.isRoundTrip() ? this.returnDate() : undefined,
      passengerAdultCount: Number(this.passengerAdultCount()),
      cabinClass: this.cabinClass(),
    });
  }

  private validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (this.originIata() === this.destinationIata()) {
      errors['destinationIata'] = 'Origem e destino devem ser diferentes.';
    }
    if (!this.departureDate()) {
      errors['departureDate'] = 'Informe a data de ida.';
    }
    if (this.isRoundTrip()) {
      if (!this.returnDate()) {
        errors['returnDate'] = 'Informe a data de volta.';
      } else if (this.departureDate() && this.returnDate() < this.departureDate()) {
        errors['returnDate'] = 'A volta não pode ser antes da ida.';
      }
    }
    return errors;
  }
}
