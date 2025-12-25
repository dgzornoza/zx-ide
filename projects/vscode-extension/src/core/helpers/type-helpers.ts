export const nameofFactory =
  <T>() =>
  (name: Extract<keyof T, string>): string =>
    name;
export const nameof = <T>(name: Extract<keyof T, string>): string => name;

export interface IDynamic<T> {
  [key: string]: T;
}

export class TypeHelpers {
  public static isObject(value: unknown): boolean {
    return value != null && (typeof value === 'object' || typeof value === 'function');
  }

  public static isString(value: unknown): boolean {
    return value != null && (typeof value === 'string' || value instanceof String);
  }
}
