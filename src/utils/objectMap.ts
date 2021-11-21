export const objectMap = <TValue, TResult>(
  obj: Record<string, TValue>,
  fn: <TKey extends string>(key: TKey, value: TValue) => [TKey, TResult],
) =>
  Object.fromEntries(Object.entries(obj).map(([key, value]) => fn(key, value)))
