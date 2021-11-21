declare global {
  interface ObjectConstructor {
    fromEntries<
      P extends PropertyKey,
      A extends ReadonlyArray<readonly [P, any]>,
    >(
      array: A,
    ): { [K in A[number][0]]: Extract<A[number], readonly [K, any]>[1] }
  }
}
