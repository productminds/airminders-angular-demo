import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, SearchX } from 'lucide-angular';
import { Analytics } from '../analytics/analytics';
import type { LegType } from '../analytics/analytics';
import {
  OffersLegSection,
  type FilterApplied,
  type LegFareSelection,
} from '../components/selection/offers-leg-section';
import { ButtonDirective } from '../components/ui/button';
import { computePriceBreakdown, findFareFamily, findOffer } from '../lib/pricing';
import { BookingFlowStore } from '../stores/booking-flow.store';
import { JourneyStore } from '../stores/journey.store';
import type { FlightOffer } from '../types/domain';

/**
 * RF-03/04/05/06: step 2 — independent outbound/inbound flight and fare family
 * selection.
 */
@Component({
  selector: 'app-selection-container',
  imports: [ButtonDirective, LucideAngularModule, OffersLegSection],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './selection-container.html',
})
export class SelectionContainer {
  private readonly analytics = inject(Analytics);
  private readonly flow = inject(BookingFlowStore);
  private readonly journey = inject(JourneyStore);
  private readonly router = inject(Router);

  protected readonly SearchXIcon = SearchX;
  protected readonly criteria = this.flow.criteria;
  protected readonly results = this.flow.results;
  protected readonly selectedTrip = this.flow.selectedTrip;

  protected readonly isRoundTrip = computed(() => this.criteria()?.tripType === 'round_trip');

  protected readonly canContinue = computed(() => {
    const trip = this.selectedTrip();
    const hasOutbound = Boolean(trip?.outboundFareFamilyId);
    const hasInbound = !this.isRoundTrip() || Boolean(trip?.inboundFareFamilyId);
    return hasOutbound && hasInbound;
  });

  protected onSelectOutbound({ flightNumber, fareFamilyId, position }: LegFareSelection): void {
    this.trackLegSelection(
      'outbound',
      this.results()!.outboundOffers,
      flightNumber,
      fareFamilyId,
      position,
    );
    this.flow.selectedTrip.update((current) => ({
      ...current,
      outboundFlightNumber: flightNumber,
      outboundFareFamilyId: fareFamilyId,
    }));
  }

  protected onSelectInbound({ flightNumber, fareFamilyId, position }: LegFareSelection): void {
    this.trackLegSelection(
      'inbound',
      this.results()!.inboundOffers ?? [],
      flightNumber,
      fareFamilyId,
      position,
    );
    this.flow.selectedTrip.update((current) => ({
      ...current,
      inboundFlightNumber: flightNumber,
      inboundFareFamilyId: fareFamilyId,
    }));
  }

  protected onFilterApplied({ filterType, sortBy, resultCountAfter }: FilterApplied): void {
    this.analytics.trackFlightSearchFilterApplied({
      searchId: this.journey.searchId()!,
      filterType,
      sortBy,
      resultCountAfter,
    });
  }

  protected async onContinue(): Promise<void> {
    const criteria = this.criteria()!;
    const { grandTotal } = computePriceBreakdown({
      results: this.results()!,
      selectedTrip: this.selectedTrip()!,
      passengerCount: criteria.passengerAdultCount,
    });
    this.analytics.trackTripSelectionCompleted({
      searchId: criteria.searchId,
      tripType: criteria.tripType,
      totalAmount: grandTotal,
    });

    // Checkout Started fires at the moment booking_id is minted (§4.2)
    this.analytics.trackCheckoutStarted({
      searchId: criteria.searchId,
      bookingId: this.journey.ensureBookingId(),
      tripType: criteria.tripType,
      totalAmount: grandTotal,
      passengerTotalCount: criteria.passengerAdultCount,
    });
    await this.router.navigate(['/passageiros']);
  }

  protected async onNewSearch(): Promise<void> {
    await this.router.navigate(['/buscar']);
  }

  private trackLegSelection(
    legType: LegType,
    offers: FlightOffer[],
    flightNumber: string,
    fareFamilyId: string,
    position: number,
  ): void {
    const offer = findOffer(offers, flightNumber)!;
    const fare = findFareFamily(offer, fareFamilyId)!;
    const searchId = this.criteria()!.searchId;
    this.analytics.trackFlightSelected({ searchId, legType, offer, fare, position });
    this.analytics.trackFareSelected({ searchId, legType, offer, fare });
  }
}
