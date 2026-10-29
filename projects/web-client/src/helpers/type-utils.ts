export class TypeEnumHelpers {
  /** Whether the `value` bitmask has `flag` set; works with any `as const` flags object. */
  public static hasFlag<Flags extends Record<string, number>>(flag: Flags[keyof Flags], value?: number): boolean {
    return value !== undefined && (value & flag) === flag;
  }

  /** `currentValue` with `flag` set when `active` is true, or cleared otherwise. */
  public static setFlag<Flags extends Record<string, number>>(flag: Flags[keyof Flags], currentValue: number, active: boolean): number {
    return active ? currentValue | flag : currentValue & ~flag;
  }
}
