import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { LucideAngularModule, QrCode, Sparkles } from 'lucide-angular';
import { ButtonDirective } from '../ui/button';
import { InputDirective } from '../ui/input';
import { LabelDirective } from '../ui/label';
import { Select, type SelectOption } from '../ui/select';
import { TabPanelDirective, Tabs } from '../ui/tabs';
import { formatCurrency, formatMiles } from '../../lib/format';
import type { PaymentDetails, PaymentMethod } from '../../types/domain';

const MOCK_MILES_BALANCE = 82000;
const MOCK_MILES_PER_BRL = 35;

const INSTALLMENT_OPTIONS = [1, 2, 3, 4, 5, 6, 10, 12];

export interface MethodSelection {
  method: PaymentMethod;
  milesUsedCount?: number;
}

/**
 * RS-02: only the brand ever leaves this component, derived from the issuer
 * prefix — never the number itself.
 */
function detectCardBrand(cardNumber: string): PaymentDetails['cardBrand'] {
  const digits = cardNumber.replace(/\D/g, '');
  if (/^4/.test(digits)) return 'visa';
  if (/^5[1-5]/.test(digits)) return 'mastercard';
  if (/^3[47]/.test(digits)) return 'amex';
  return undefined;
}

/**
 * RF-09/10, RS-02: collects a payment method (credit card, Pix or miles). Card
 * data is entirely mocked — only the last 4 digits ever leave this component;
 * the full number and CVV are never submitted or persisted.
 */
@Component({
  selector: 'app-payment-form',
  imports: [
    ButtonDirective,
    InputDirective,
    LabelDirective,
    LucideAngularModule,
    Select,
    TabPanelDirective,
    Tabs,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-form.html',
})
export class PaymentForm {
  readonly totalAmount = input.required<number>();
  readonly isSubmitting = input.required<boolean>();
  readonly pay = output<PaymentDetails>();
  readonly methodSelected = output<MethodSelection>();

  protected readonly QrCodeIcon = QrCode;
  protected readonly SparklesIcon = Sparkles;
  protected readonly milesBalance = MOCK_MILES_BALANCE;
  protected readonly formatCurrency = formatCurrency;
  protected readonly formatMiles = formatMiles;

  protected readonly method = signal<PaymentMethod>('credit_card');
  protected readonly cardNumber = signal('');
  protected readonly cardHolderName = signal('');
  protected readonly cardExpiry = signal('');
  protected readonly cardCvv = signal('');
  protected readonly installments = signal(1);

  protected readonly installmentOptions = computed<SelectOption<string>[]>(() =>
    INSTALLMENT_OPTIONS.map((count) => ({
      value: String(count),
      label: `${count}x de ${formatCurrency(this.totalAmount() / count)}${
        count === 1 ? ' (à vista)' : ' sem juros'
      }`,
    })),
  );

  protected readonly milesNeeded = computed(() => this.totalAmount() * MOCK_MILES_PER_BRL);
  protected readonly canPayWithMiles = computed(() => this.milesNeeded() <= MOCK_MILES_BALANCE);

  protected readonly canSubmitCard = computed(
    () =>
      this.cardNumber().replace(/\D/g, '').length >= 12 &&
      this.cardHolderName().trim().length > 0 &&
      this.cardExpiry().trim().length > 0 &&
      this.cardCvv().trim().length >= 3,
  );

  protected onMethodChange(method: PaymentMethod): void {
    this.method.set(method);
    this.methodSelected.emit({
      method,
      milesUsedCount: method === 'miles' ? this.milesNeeded() : undefined,
    });
  }

  protected onSubmit(): void {
    if (this.method() === 'credit_card') {
      this.pay.emit({
        method: 'credit_card',
        installments: this.installments(),
        cardHolderName: this.cardHolderName(),
        cardLast4: this.cardNumber().replace(/\D/g, '').slice(-4),
        cardBrand: detectCardBrand(this.cardNumber()),
      });
      return;
    }

    this.pay.emit({ method: this.method() });
  }
}
