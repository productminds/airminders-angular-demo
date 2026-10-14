import {
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  Directive,
  inject,
  input,
  model,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

/**
 * One tab's label plus the template rendered when it is active. Declared as a
 * structural directive so each panel's markup stays next to its trigger at
 * the call site, the way TabsTrigger/TabsContent pair up in the React original.
 */
@Directive({ selector: '[appTabPanel]' })
export class TabPanelDirective {
  /** Tab identifier, matched against the Tabs component's value. */
  readonly value = input.required<string>({ alias: 'appTabPanel' });
  readonly label = input.required<string>({ alias: 'appTabPanelLabel' });

  readonly template = inject(TemplateRef);
}

@Component({
  selector: 'app-tabs',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="tablist"
      [attr.aria-label]="ariaLabel()"
      class="inline-flex h-9 w-full items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground"
    >
      @for (panel of panels(); track panel.value()) {
        <button
          type="button"
          role="tab"
          [id]="tabId(panel.value())"
          [attr.aria-selected]="value() === panel.value()"
          [attr.aria-controls]="panelId(panel.value())"
          [tabindex]="value() === panel.value() ? 0 : -1"
          (click)="value.set(panel.value())"
          (keydown.arrowRight)="selectOffset(1)"
          (keydown.arrowLeft)="selectOffset(-1)"
          class="inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-selected:bg-background aria-selected:text-foreground aria-selected:shadow"
        >
          {{ panel.label() }}
        </button>
      }
    </div>

    @for (panel of panels(); track panel.value()) {
      @if (value() === panel.value()) {
        <div
          role="tabpanel"
          [id]="panelId(panel.value())"
          [attr.aria-labelledby]="tabId(panel.value())"
          class="mt-2 focus-visible:outline-none"
        >
          <ng-container [ngTemplateOutlet]="panel.template" />
        </div>
      }
    }
  `,
})
export class Tabs {
  readonly value = model.required<string>();
  readonly ariaLabel = input<string>();

  protected readonly panels = contentChildren(TabPanelDirective);

  protected tabId(value: string): string {
    return `tab-${value}`;
  }

  protected panelId(value: string): string {
    return `tabpanel-${value}`;
  }

  protected selectOffset(offset: number): void {
    const panels = this.panels();
    const current = panels.findIndex((panel) => panel.value() === this.value());
    const next = (current + offset + panels.length) % panels.length;
    this.value.set(panels[next].value());
    document.getElementById(this.tabId(panels[next].value()))?.focus();
  }
}
