import Decimal from "decimal.js";

export { Decimal };

export function toNumber(value: Decimal | string | number): number {
  return new Decimal(value).toNumber();
}

export function add(...values: (Decimal | string | number)[]): Decimal {
  return values.reduce<Decimal>(
    (acc, v) => acc.plus(v),
    new Decimal(0)
  );
}

export function multiply(
  a: Decimal | string | number,
  b: Decimal | string | number
): Decimal {
  return new Decimal(a).times(b);
}
