import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AlertTriangle, LucideAngularModule } from 'lucide-angular';
import { Analytics } from '../analytics/analytics';
import { PassengerForm, type PassengerFieldChange } from '../components/passengers/passenger-form';
import {
  AlertDescriptionDirective,
  AlertDirective,
  AlertTitleDirective,
} from '../components/ui/alert';
import { ButtonDirective } from '../components/ui/button';
import { generateId } from '../lib/ids';
import { validatePassenger } from '../lib/validators';
import { BookingFlowStore } from '../stores/booking-flow.store';
import { JourneyStore } from '../stores/journey.store';
import { PassengerSubmitStore } from '../stores/passenger-submit.store';
import type { Passenger, PassengerFieldError } from '../types/domain';

function emptyPassenger(): Passenger {
  return {
    passengerId: generateId('passenger'),
    firstName: '',
    lastName: '',
    birthDate: '',
    documentNumber: '',
    email: '',
    phone: '',
  };
}

/**
 * RF-07/12: step 3 — collects one form per adult passenger, validates required
 * fields client-side, then submits to the mock-api for a server-style
 * re-validation pass (RS-01: nothing sensitive ever touches a URL, log, or
 * persisted storage).
 */
@Component({
  selector: 'app-passengers-container',
  imports: [
    AlertDescriptionDirective,
    AlertDirective,
    AlertTitleDirective,
    ButtonDirective,
    LucideAngularModule,
    PassengerForm,
  ],
  providers: [PassengerSubmitStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './passengers-container.html',
})
export class PassengersContainer implements OnInit {
  private readonly analytics = inject(Analytics);
  private readonly flow = inject(BookingFlowStore);
  private readonly journey = inject(JourneyStore);
  private readonly router = inject(Router);
  private readonly passengerSubmit = inject(PassengerSubmitStore);

  protected readonly status = this.passengerSubmit.status;
  protected readonly AlertTriangleIcon = AlertTriangle;

  protected readonly passengerList = signal<Passenger[]>(
    Array.from({ length: this.flow.criteria()?.passengerAdultCount ?? 1 }, emptyPassenger),
  );

  private readonly clientErrors = signal<Record<string, PassengerFieldError[]>>({});
  private attemptCount = 0;

  ngOnInit(): void {
    this.analytics.trackPassengerDetailsStarted({
      bookingId: this.journey.bookingId()!,
      passengerTotalCount: this.passengerList().length,
    });
  }

  protected updatePassenger(index: number, { field, value }: PassengerFieldChange): void {
    this.passengerList.update((current) =>
      current.map((passenger, i) => (i === index ? { ...passenger, [field]: value } : passenger)),
    );
  }

  protected errorsForPassenger(passengerId: string): PassengerFieldError[] {
    return [
      ...(this.clientErrors()[passengerId] ?? []),
      ...this.passengerSubmit
        .fieldErrors()
        .filter((fieldError) => fieldError.passengerId === passengerId),
    ];
  }

  protected async onSubmit(): Promise<void> {
    this.attemptCount += 1;
    const bookingId = this.journey.bookingId()!;
    const passengers = this.passengerList();

    const clientErrors: Record<string, PassengerFieldError[]> = {};
    for (const passenger of passengers) {
      const fieldErrors = validatePassenger(passenger);
      if (fieldErrors.length === 0) continue;

      clientErrors[passenger.passengerId] = fieldErrors;
      for (const fieldError of fieldErrors) {
        this.analytics.trackPassengerDetailsValidationFailed({
          bookingId,
          fieldName: fieldError.fieldName,
          errorType: fieldError.errorType,
          attemptCount: this.attemptCount,
        });
      }
    }
    this.clientErrors.set(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    this.analytics.trackPassengerDetailsSubmitted({ bookingId, passengers });
    const accepted = await this.passengerSubmit.submit({
      bookingId,
      passengers,
      attemptCount: this.attemptCount,
    });
    if (!accepted) return;

    this.flow.passengers.set(passengers);
    await this.router.navigate(['/revisao']);
  }
}
