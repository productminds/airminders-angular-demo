import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertTriangle, LucideAngularModule } from 'lucide-angular';
import { Analytics } from '../analytics/analytics';
import { SearchForm } from '../components/search/search-form';
import {
  AlertDescriptionDirective,
  AlertDirective,
  AlertTitleDirective,
} from '../components/ui/alert';
import { CardContentDirective, CardDirective } from '../components/ui/card';
import { BookingFlowStore } from '../stores/booking-flow.store';
import { FlightSearchStore } from '../stores/flight-search.store';
import { JourneyStore } from '../stores/journey.store';
import type { SearchCriteria } from '../types/domain';

/**
 * RF-01: step 1 of the flow — collects search criteria and hands the result
 * set to the flow store so step 2 can render it.
 */
@Component({
  selector: 'app-search-container',
  imports: [
    AlertDescriptionDirective,
    AlertDirective,
    AlertTitleDirective,
    CardContentDirective,
    CardDirective,
    LucideAngularModule,
    SearchForm,
  ],
  providers: [FlightSearchStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search-container.html',
})
export class SearchContainer {
  private readonly analytics = inject(Analytics);
  private readonly flow = inject(BookingFlowStore);
  private readonly journey = inject(JourneyStore);
  private readonly router = inject(Router);
  private readonly search = inject(FlightSearchStore);

  protected readonly status = this.search.status;
  protected readonly error = this.search.error;
  protected readonly AlertTriangleIcon = AlertTriangle;

  private hasStartedSearch = false;

  protected async onSearch(partialCriteria: Omit<SearchCriteria, 'searchId'>): Promise<void> {
    this.flow.resetAfterSearch();
    const criteria: SearchCriteria = {
      ...partialCriteria,
      searchId: this.journey.createSearchId(),
    };
    this.flow.criteria.set(criteria);

    const results = await this.search.submitSearch(criteria);
    if (!results) return;

    this.flow.results.set(results);
    await this.router.navigate(['/selecionar']);
  }

  /**
   * Flight Search Started: first interaction with the form this visit. A visit
   * with criteria already in flow state is a post-results edit.
   */
  protected onFormInteraction(): void {
    if (this.hasStartedSearch) return;
    this.hasStartedSearch = true;
    this.analytics.trackFlightSearchStarted({
      entryPoint: this.flow.criteria() ? 'results_edit' : 'home',
    });
  }
}
