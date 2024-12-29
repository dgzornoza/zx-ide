interface Array<T> {
  groupBy<K>(key: (item: T) => K): Record<string, T[]>;
}

Array.prototype.groupBy = function <T, K>(key: (item: T) => K): Record<string, T[]> {
  return this.reduce(
    (result, currentValue) => {
      const groupKey = key(currentValue);
      const stringKey = String(groupKey);
      if (!result[stringKey]) {
        result[stringKey] = [];
      }
      result[stringKey].push(currentValue);
      return result;
    },
    {} as Record<string, T[]>
  );
};
