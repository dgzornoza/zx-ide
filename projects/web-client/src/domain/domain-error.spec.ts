import { describe, expect, it } from 'vitest';
import { DomainError, toDomainError } from 'src/domain/domain-error';

describe('DomainError', () => {
  it('keeps the translation key and its arguments', () => {
    const error = new DomainError('errorAsmTileCountMismatch', [12, 8]);

    expect(error).toBeInstanceOf(Error);
    expect(error.key).toBe('errorAsmTileCountMismatch');
    expect(error.args).toEqual([12, 8]);
    expect(error.message).toBe('errorAsmTileCountMismatch:12:8');
  });

  it('has no arguments by default', () => {
    const error = new DomainError('errorNoLayers');

    expect(error.args).toEqual([]);
    expect(error.message).toBe('errorNoLayers');
  });
});

describe('toDomainError', () => {
  it('returns a DomainError unchanged', () => {
    const error = new DomainError('errorNoLayers');

    expect(toDomainError(error, 'errorJsonInvalid')).toBe(error);
  });

  it('uses the message of another error as key and the fallback key otherwise', () => {
    expect(toDomainError(new Error('errorGidOutOfRange'), 'errorJsonInvalid').key).toBe('errorGidOutOfRange');
    expect(toDomainError(new Error('  '), 'errorJsonInvalid').key).toBe('errorJsonInvalid');
    expect(toDomainError('text', 'errorJsonInvalid').key).toBe('errorJsonInvalid');
  });
});
