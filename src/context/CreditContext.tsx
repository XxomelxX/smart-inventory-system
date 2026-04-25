import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type CreditEntry = {
  id: number;
  date: string;
  customer: string;
  type: "CHARGE" | "PAYMENT";
  amount: number;
  note?: string;
  orderId?: number;
  cashier?: string;
};

type CreditContextType = {
  entries: CreditEntry[];
  addCharge: (input: { customer: string; amount: number; orderId?: number; cashier?: string; note?: string }) => CreditEntry;
  addPayment: (input: { customer: string; amount: number; cashier?: string; note?: string }) => CreditEntry;
  balanceFor: (customer: string) => number;
  customers: { name: string; balance: number }[];
};

const CreditContext = createContext<CreditContextType | null>(null);
const KEY = "inv_credit";

export const CreditProvider = ({ children }: { children: ReactNode }) => {
  const [entries, setEntries] = useState<CreditEntry[]>(() => {
    try {
      const s = localStorage.getItem(KEY);
      if (s) return JSON.parse(s);
    } catch { /* ignore */ }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(entries));
  }, [entries]);

  const make = (e: Omit<CreditEntry, "id" | "date">): CreditEntry => ({
    ...e,
    id: Date.now() + Math.floor(Math.random() * 1000),
    date: new Date().toISOString(),
  });

  const addCharge: CreditContextType["addCharge"] = (input) => {
    const entry = make({ ...input, type: "CHARGE", customer: input.customer.trim() });
    setEntries((prev) => [entry, ...prev]);
    return entry;
  };

  const addPayment: CreditContextType["addPayment"] = (input) => {
    const entry = make({ ...input, type: "PAYMENT", customer: input.customer.trim() });
    setEntries((prev) => [entry, ...prev]);
    return entry;
  };

  const balanceFor = (customer: string) => {
    const c = customer.trim().toLowerCase();
    return entries.reduce((sum, e) => {
      if (e.customer.toLowerCase() !== c) return sum;
      return sum + (e.type === "CHARGE" ? e.amount : -e.amount);
    }, 0);
  };

  const customers = (() => {
    const map = new Map<string, number>();
    entries.forEach((e) => {
      const key = e.customer;
      const cur = map.get(key) || 0;
      map.set(key, cur + (e.type === "CHARGE" ? e.amount : -e.amount));
    });
    return Array.from(map.entries())
      .map(([name, balance]) => ({ name, balance }))
      .sort((a, b) => b.balance - a.balance);
  })();

  return (
    <CreditContext.Provider value={{ entries, addCharge, addPayment, balanceFor, customers }}>
      {children}
    </CreditContext.Provider>
  );
};

export const useCredit = () => {
  const ctx = useContext(CreditContext);
  if (!ctx) throw new Error("useCredit must be used within CreditProvider");
  return ctx;
};
