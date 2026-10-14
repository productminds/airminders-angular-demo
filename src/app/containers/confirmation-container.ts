import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CheckCircle2, LucideAngularModule } from 'lucide-angular';
import { Analytics } from '../analytics/analytics';
import { ItineraryLegSummary } from '../components/review/itinerary-leg-summary';
import { PassengerListSummary } from '../components/review/passenger-list-summary';
import { ButtonDirective } from '../components/ui/button';
import { CardContentDirective, CardDirective } from '../components/ui/card';
import { findFareFamily, findOffer } from '../lib/pricing';
import { BookingFlowStore } from '../stores/booking-flow.store';

/** RF-11: step 6 — reservation locator (PNR) and purchase confirmation. */
@Component({
  selector: 'app-confirmation-container',
  imports: [
    ButtonDirective,
    CardContentDirective,
    CardDirective,
    ItineraryLegSummary,
    LucideAngularModule,
    PassengerListSummary,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirmation-container.html',
})
export class ConfirmationContainer implements OnInit {
  private readonly analytics = inject(Analytics);
  private readonly flow = inject(BookingFlowStore);
  private readonly router = inject(Router);

  protected readonly CheckCircle2Icon = CheckCircle2;
  protected readonly order = this.flow.order;
  protected readonly passengers = this.flow.passengers;

  protected readonly outboundOffer = computed(() =>
    findOffer(this.flow.results()!.outboundOffers, this.flow.selectedTrip()!.outboundFlightNumber),
  );
  protected readonly outboundFare = computed(() =>
    findFareFamily(this.outboundOffer(), this.flow.selectedTrip()!.outboundFareFamilyId),
  );
  protected readonly inboundOffer = computed(() =>
    findOffer(this.flow.results()!.inboundOffers, this.flow.selectedTrip()!.inboundFlightNumber),
  );
  protected readonly inboundFare = computed(() =>
    findFareFamily(this.inboundOffer(), this.flow.selectedTrip()!.inboundFareFamilyId),
  );

  ngOnInit(): void {
    const order = this.flow.order()!;
    this.analytics.trackBookingConfirmationViewed({
      bookingId: order.bookingId,
      bookingReference: order.pnr,
    });
  }

  protected async onNewSearch(): Promise<void> {
    this.flow.resetFlow();
    await this.router.navigate(['/buscar']);
  }
}
