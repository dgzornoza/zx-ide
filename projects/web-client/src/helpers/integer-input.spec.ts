import { describe, expect, it } from 'vitest';
import { parseIntegerInput } from 'src/helpers/integer-input';

describe('parseIntegerInput', () => {
  it('keeps a valid integer', () => {
    expect(parseIntegerInput('16', 1)).toBe(16);
    expect(parseIntegerInput('0', 0)).toBe(0);
  });

  it('rounds decimals', () => {
    expect(parseIntegerInput('8.4', 1)).toBe(8);
    expect(parseIntegerInput('8.6', 1)).toBe(9);
  });

  it('applies the minimum', () => {
    expect(parseIntegerInput('0', 1)).toBe(1);
    expect(parseIntegerInput('0.3', 1)).toBe(1);
    expect(parseIntegerInput('-3', 0)).toBe(0);
  });

  it('returns undefined when the text is not a number, so the last valid value is kept', () => {
    expect(parseIntegerInput('', 1)).toBeUndefined();
    expect(parseIntegerInput('abc', 1)).toBeUndefined();
  });
});
