export class TypeEnumHelpers {
  /**
   * Verifica si un conjunto de flags contiene un flag específico.
   * Funciona con cualquier objeto de flags definidos como `const` + `as const`.
   *
   * @param flag - Flag individual a verificar.
   * @param value - Valor combinado de flags (bitmask).
   * @returns `true` si el flag está presente, `false` si no.
   */
  public static hasFlag<T extends Record<string, number>>(
    flag: T[keyof T],
    value?: number,
  ): boolean {
    return value != null && (value & flag) === flag;
  }

  /**
   * Activa o desactiva un flag específico en un valor de bitmask.
   * Funciona con cualquier objeto de flags definidos como `const` + `as const`.
   *
   * @param flag - Flag individual a activar o desactivar.
   * @param currentValue - Valor combinado de flags actual (bitmask).
   * @param active - `true` para activar el flag, `false` para desactivarlo.
   * @returns Nuevo valor de bitmask con el flag actualizado.
   */
  public static setFlag<T extends Record<string, number>>(
    flag: T[keyof T],
    currentValue: number,
    active: boolean,
  ): number {
    return active ? currentValue | flag : currentValue & ~flag;
  }
}

/**
 * Tipo que representa los valores de un enum como una unión de tipos.
 * Para usar enumeraciones de types, evitando generacion de codigo en typescript.
 */
export type TypeEnumFlagValue<T> = T[keyof T];
