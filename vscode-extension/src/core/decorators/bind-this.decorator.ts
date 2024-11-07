/* eslint-disable @typescript-eslint/no-explicit-any */
export function BindThis(_originalMethod: any, context: ClassMethodDecoratorContext) {
  const methodName = context.name;
  context.addInitializer(function () {
    (this as any)[methodName] = (this as any)[methodName].bind(this);
  });
}
