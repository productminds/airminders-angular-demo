import { computed, Directive, input } from '@angular/core';
import { cn } from '../../lib/utils';

@Directive({
  selector: '[appCard]',
  host: { '[class]': 'computedClass()' },
})
export class CardDirective {
  readonly userClass = input<string>('', { alias: 'class' });

  protected readonly computedClass = computed(() =>
    cn('rounded-xl border bg-card text-card-foreground shadow', this.userClass()),
  );
}

@Directive({
  selector: '[appCardContent]',
  host: { '[class]': 'computedClass()' },
})
export class CardContentDirective {
  readonly userClass = input<string>('', { alias: 'class' });

  protected readonly computedClass = computed(() => cn('p-6 pt-0', this.userClass()));
}
