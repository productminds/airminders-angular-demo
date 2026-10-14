import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/**
 * Modal confirmation dialog. CdkTrapFocus supplies the focus containment
 * Radix's AlertDialog provides in the React original; the dialog renders in
 * place rather than through a portal because it is already mounted at the
 * flow root, above every other layer.
 *
 * Clicking the backdrop deliberately does not dismiss it — an alert dialog
 * asks for an explicit choice, so Escape and the footer buttons are the only
 * ways out.
 */
@Component({
  selector: 'app-alert-dialog',
  imports: [CdkTrapFocus],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 bg-black/50 animate-in fade-in-0"></div>
      <div
        role="alertdialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId()"
        [attr.aria-describedby]="descriptionId()"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
        (keydown.escape)="open.set(false)"
        class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg animate-in fade-in-0 zoom-in-95 sm:max-w-lg"
      >
        <ng-content />
      </div>
    }
  `,
})
export class AlertDialog {
  readonly open = model.required<boolean>();
  readonly titleId = input.required<string>();
  readonly descriptionId = input.required<string>();
}
