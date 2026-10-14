import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { InputDirective } from '../ui/input';
import { LabelDirective } from '../ui/label';
import type { Passenger, PassengerFieldError } from '../../types/domain';

const FIELD_ERROR_MESSAGES: Record<PassengerFieldError['errorType'], string> = {
  required: 'Campo obrigatório.',
  invalid_format: 'Formato inválido.',
};

export type PassengerField = PassengerFieldError['fieldName'];

export interface PassengerFieldChange {
  field: PassengerField;
  value: string;
}

/**
 * RF-07: presentational form for a single passenger's data. Errors are passed
 * in rather than computed here so both client-side and mock-api
 * (server-style) validation can drive the same UI.
 */
@Component({
  selector: 'app-passenger-form',
  imports: [InputDirective, LabelDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './passenger-form.html',
})
export class PassengerForm {
  readonly index = input.required<number>();
  readonly passenger = input.required<Passenger>();
  readonly errors = input.required<PassengerFieldError[]>();
  /**
   * Emits the one field that changed rather than a whole rebuilt passenger:
   * the owner applies it with a functional update, so two edits landing in the
   * same change-detection cycle cannot overwrite each other.
   */
  readonly fieldChange = output<PassengerFieldChange>();

  protected updateField(field: PassengerField, value: string): void {
    this.fieldChange.emit({ field, value });
  }

  protected errorFor(field: PassengerField): string | null {
    const fieldError = this.errors().find((error) => error.fieldName === field);
    return fieldError ? FIELD_ERROR_MESSAGES[fieldError.errorType] : null;
  }

  protected idFor(field: PassengerField): string {
    return `passenger-${this.index()}-${field}`;
  }
}
