import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CardContentDirective, CardDirective } from '../ui/card';
import { formatCurrency } from '../../lib/format';
import type { PriceBreakdown } from '../../types/domain';

@Component({
  selector: 'app-price-summary',
  imports: [CardContentDirective, CardDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div appCard>
      <div appCardContent class="p-4 sm:p-5">
        <h2 class="text-lg font-semibold">Resumo do valor</h2>
        <dl class="mt-3 space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-muted-foreground">Tarifa</dt>
            <dd>{{ formatCurrency(breakdown().fareTotal) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-muted-foreground">Taxas e impostos</dt>
            <dd>{{ formatCurrency(breakdown().taxesTotal) }}</dd>
          </div>
          <div class="flex justify-between border-t pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd class="text-primary">{{ formatCurrency(breakdown().grandTotal) }}</dd>
          </div>
        </dl>
      </div>
    </div>
  `,
})
export class PriceSummary {
  readonly breakdown = input.required<PriceBreakdown>();

  protected readonly formatCurrency = formatCurrency;
}
