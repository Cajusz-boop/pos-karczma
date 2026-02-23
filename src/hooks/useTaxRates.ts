import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/offline-db";

const isBrowser = () => typeof window !== "undefined";

export function useTaxRates(): { taxRates: { id: string; name: string; ratePercent: number; fiscalSymbol: string; isDefault: boolean }[]; isLoading: boolean } {
  const taxRates = useLiveQuery(
    () => (!isBrowser() ? [] : db.taxRates.toArray()),
    [],
    []
  );
  const list = (taxRates ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    ratePercent: t.ratePercent,
    fiscalSymbol: t.fiscalSymbol,
    isDefault: t.isDefault,
  }));
  return { taxRates: list, isLoading: taxRates === undefined };
}
