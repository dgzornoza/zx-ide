/**
 * Value of an integer number input: the typed text rounded and raised to `minimum`,
 * or `undefined` while the text is not a number (for example an emptied field), so the
 * caller keeps the last valid value and the model never holds a value the `.cfg` loader rejects.
 */
export function parseIntegerInput(text: string, minimum: number): number | undefined {
  const typedValue = Number.parseFloat(text);
  if (Number.isNaN(typedValue)) {
    return undefined;
  }
  return Math.max(minimum, Math.round(typedValue));
}

/** Shows `value` in the input that raised `event` (used when the field is left with text that was not stored as typed). */
export function showInputValue(event: Event, value: number): void {
  (event.target as HTMLInputElement).value = String(value);
}
