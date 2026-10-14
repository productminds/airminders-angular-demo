import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { Check, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-checkbox',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      role="checkbox"
      [attr.id]="inputId()"
      [attr.aria-checked]="checked()"
      [disabled]="disabled()"
      (click)="checked.set(!checked())"
      class="peer grid h-4 w-4 shrink-0 place-content-center rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-checked:bg-primary aria-checked:text-primary-foreground"
    >
      @if (checked()) {
        <lucide-icon [img]="CheckIcon" class="h-4 w-4" aria-hidden="true" />
      }
    </button>
  `,
})
export class Checkbox {
  readonly checked = model(false);
  readonly inputId = input<string>();
  readonly disabled = input(false);

  protected readonly CheckIcon = Check;
}
