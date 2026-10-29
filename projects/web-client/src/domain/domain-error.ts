export type DomainErrorArgument = string | number;

/**
 * Error raised by the domain for a problem the user can fix. `key` is the i18n message key
 * (inside the page namespace) and `args` the values the message shows.
 * `message` keeps the `key:arg1:arg2` form for logs.
 */
export class DomainError extends Error {
  readonly key: string;
  readonly args: readonly DomainErrorArgument[];

  constructor(key: string, args: readonly DomainErrorArgument[] = []) {
    super([key, ...args].join(':'));
    this.name = 'DomainError';
    this.key = key;
    this.args = args;
  }
}

/** `error` as a `DomainError`: another error's message becomes the key, anything else gets `fallbackKey`. */
export function toDomainError(error: unknown, fallbackKey: string): DomainError {
  if (error instanceof DomainError) {
    return error;
  }
  if (error instanceof Error && error.message.trim() !== '') {
    return new DomainError(error.message);
  }
  return new DomainError(fallbackKey);
}
