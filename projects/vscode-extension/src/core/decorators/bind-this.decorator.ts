/* eslint-disable @typescript-eslint/no-explicit-any */
export function BindThis(_target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  return {
    configurable: true,
    get() {
      const boundFunction = originalMethod.bind(this);
      Object.defineProperty(this, propertyKey, { value: boundFunction, configurable: true, writable: true });
      return boundFunction;
    },
  };
}
