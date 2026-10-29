export class TypeEnumHelpers {
  /** Whether the `value` bitmask has `flag` set; works with any `as const` flags object. */
  public static hasFlag<T extends Record<string, number>>(flag: T[keyof T], value?: number): boolean {
    return value !== undefined && (value & flag) === flag;
  }

  /** `currentValue` with `flag` set when `active` is true, or cleared otherwise. */
  public static setFlag<T extends Record<string, number>>(flag: T[keyof T], currentValue: number, active: boolean): number {
    return active ? currentValue | flag : currentValue & ~flag;
  }
}
