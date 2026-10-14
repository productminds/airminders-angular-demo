import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface RadioOption<T extends string> {
  value: T;
  label: string;
}

/**
 * Roving-tabindex radio group: only the selected radio is tabbable and the
 * arrow keys move the selection, per the WAI-ARIA radio group pattern that
 * Radix implements in the React original.
 */
@Component({
  selector: 'app-radio-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'userClass()' },
  template: `
    <div role="radiogroup" [attr.aria-label]="ariaLabel()" class="flex gap-6">
      @for (option of options(); track option.value) {
        <div class="flex items-center gap-2">
          <button
            type="button"
            role="radio"
            [id]="idFor(option.value)"
            [attr.aria-checked]="value() === option.value"
            [tabindex]="value() === option.value ? 0 : -1"
            (click)="value.set(option.value)"
            (keydown.arrowRight)="selectOffset(1)"
            (keydown.arrowDown)="selectOffset(1)"
            (keydown.arrowLeft)="selectOffset(-1)"
            (keydown.arrowUp)="selectOffset(-1)"
            class="grid aspect-square h-4 w-4 shrink-0 place-content-center rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            @if (value() === option.value) {
              <span class="h-2 w-2 rounded-full bg-primary" aria-hidden="true"></span>
            }
          </button>
          <label [for]="idFor(option.value)" class="text-sm font-medium leading-none">
            {{ option.label }}
          </label>
        </div>
      }
    </div>
  `,
})
export class RadioGroup<T extends string> {
  readonly value = model.required<T>();
  readonly options = input.required<RadioOption<T>[]>();
  readonly name = input.required<string>();
  readonly ariaLabel = input<string>();
  readonly userClass = input<string>('', { alias: 'class' });

  protected idFor(value: T): string {
    return `${this.name()}-${value}`;
  }

  protected selectOffset(offset: number): void {
    const options = this.options();
    const current = options.findIndex((option) => option.value === this.value());
    const next = (current + offset + options.length) % options.length;
    this.value.set(options[next].value);
    document.getElementById(this.idFor(options[next].value))?.focus();
  }
}
