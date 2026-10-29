import { DomainError } from 'src/domain/domain-error';

/** Error raised for any `.cfg` file that is not valid JSON or does not match its configuration model. */
export function invalidConfiguration(): DomainError {
  return new DomainError('errorMapLoadFailed');
}

/** Parsed JSON object of a `.cfg` file. */
export function parseConfigurationObject(content: string): Record<string, unknown> {
  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(content);
  } catch {
    throw invalidConfiguration();
  }
  if (!isRecord(parsedValue)) {
    throw invalidConfiguration();
  }
  return parsedValue;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}

export function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}
