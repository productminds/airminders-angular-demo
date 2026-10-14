import { CdkListbox, CdkOption, type ListboxValueChangeEvent } from '@angular/cdk/listbox';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  type ConnectedPosition,
} from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { Check, ChevronDown, LucideAngularModule } from 'lucide-angular';
import { cn } from '../../lib/utils';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

const TRIGGER_CLASS =
  'flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Listbox-style select. CDK provides the primitives Radix provides in the
 * React original: cdkListbox for the roles, typeahead and arrow-key
 * navigation, cdkConnectedOverlay for the positioned panel.
 */
@Component({
  selector: 'app-select',
  imports: [
    CdkConnectedOverlay,
    CdkListbox,
    CdkOption,
    CdkOverlayOrigin,
    CdkTrapFocus,
    LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      #trigger
      type="button"
      role="combobox"
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      [attr.id]="inputId()"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="panelId()"
      [attr.aria-invalid]="invalid() || null"
      aria-haspopup="listbox"
      [class]="triggerClass()"
      (click)="open.set(!open())"
      (keydown.arrowDown)="open.set(true)"
    >
      <span class="line-clamp-1">{{ selectedLabel() }}</span>
      <lucide-icon [img]="ChevronDownIcon" class="h-4 w-4 opacity-50" aria-hidden="true" />
    </button>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayWidth]="triggerWidth()"
      [cdkConnectedOverlayPositions]="positions"
      cdkConnectedOverlayHasBackdrop
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      (backdropClick)="close()"
      (detach)="close()"
    >
      <div
        cdkListbox
        [tabindex]="0"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
        [id]="panelId()"
        [attr.aria-label]="ariaLabel()"
        [cdkListboxValue]="[value()]"
        (cdkListboxValueChange)="onSelect($event)"
        (keydown.escape)="close()"
        class="z-50 max-h-64 min-w-[8rem] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        data-state="open"
      >
        @for (option of options(); track option.value) {
          <div
            [cdkOption]="option.value"
            class="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground"
          >
            <span class="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
              @if (option.value === value()) {
                <lucide-icon [img]="CheckIcon" class="h-4 w-4" aria-hidden="true" />
              }
            </span>
            {{ option.label }}
          </div>
        }
      </div>
    </ng-template>
  `,
})
export class Select<T extends string> {
  readonly value = model.required<T>();
  readonly options = input.required<SelectOption<T>[]>();
  readonly inputId = input<string>();
  readonly ariaLabel = input<string>();
  readonly invalid = input(false);
  readonly userClass = input<string>('', { alias: 'class' });

  protected readonly open = signal(false);
  protected readonly ChevronDownIcon = ChevronDown;
  protected readonly CheckIcon = Check;

  protected readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  ];

  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  protected readonly triggerClass = computed(() => cn(TRIGGER_CLASS, this.userClass()));

  protected readonly selectedLabel = computed(
    () => this.options().find((option) => option.value === this.value())?.label ?? '',
  );

  protected panelId(): string {
    return `${this.inputId() ?? 'select'}-listbox`;
  }

  protected triggerWidth(): number {
    return this.trigger().nativeElement.offsetWidth;
  }

  protected onSelect(event: ListboxValueChangeEvent<T>): void {
    const [selected] = event.value;
    // CdkListbox emits an empty array when the selected option is clicked
    // again; a single-select trigger should keep its current value instead.
    if (selected !== undefined) {
      this.value.set(selected);
    }
    this.close();
  }

  protected close(): void {
    this.open.set(false);
    this.trigger().nativeElement.focus();
  }
}
