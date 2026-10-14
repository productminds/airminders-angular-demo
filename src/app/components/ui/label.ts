import { computed, Directive, input } from '@angular/core';
import { cn } from '../../lib/utils';

const BASE =
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70';

@Directive({
  selector: 'label[appLabel]',
  host: { '[class]': 'computedClass()' },
})
export class LabelDirective {
  readonly userClass = input<string>('', { alias: 'class' });

  protected readonly computedClass = computed(() => cn(BASE, this.userClass()));
}
