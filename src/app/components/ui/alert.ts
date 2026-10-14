import { computed, Directive, input } from '@angular/core';
import { cn } from '../../lib/utils';

export type AlertVariant = 'default' | 'destructive';

const BASE =
  'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7';

const VARIANTS: Record<AlertVariant, string> = {
  default: 'bg-background text-foreground',
  destructive:
    'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
};

@Directive({
  selector: '[appAlert]',
  host: { role: 'alert', '[class]': 'computedClass()' },
})
export class AlertDirective {
  readonly variant = input<AlertVariant>('default');
  readonly userClass = input<string>('', { alias: 'class' });

  protected readonly computedClass = computed(() =>
    cn(BASE, VARIANTS[this.variant()], this.userClass()),
  );
}

@Directive({
  selector: '[appAlertTitle]',
  host: { '[class]': 'computedClass()' },
})
export class AlertTitleDirective {
  readonly userClass = input<string>('', { alias: 'class' });

  protected readonly computedClass = computed(() =>
    cn('mb-1 font-medium leading-none tracking-tight', this.userClass()),
  );
}

@Directive({
  selector: '[appAlertDescription]',
  host: { '[class]': 'computedClass()' },
})
export class AlertDescriptionDirective {
  readonly userClass = input<string>('', { alias: 'class' });

  protected readonly computedClass = computed(() =>
    cn('text-sm [&_p]:leading-relaxed', this.userClass()),
  );
}
