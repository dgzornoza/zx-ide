export class ObjectHelpers {
  public static updateNestedPropertyValue(instance: any, newValue: string | number, ...pathSegments: string[]): void {
    if (pathSegments.length === 1) {
      instance[pathSegments[0]] = newValue;
    } else {
      const key = pathSegments.shift();
      if (key && instance[key]) {
        ObjectHelpers.updateNestedPropertyValue(instance[key], newValue, ...pathSegments);
      }
    }
  }

  public static getNestedPropertyValue(instance: any, ...pathSegments: string[]): unknown {
    if (pathSegments.length === 1) {
      return instance[pathSegments[0]];
    } else {
      const key = pathSegments.shift();
      if (key && instance[key]) {
        return ObjectHelpers.getNestedPropertyValue(instance[key], ...pathSegments);
      }

      return undefined;
    }
  }
}
