import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { mockTransactions, Transaction, TransactionItem } from "@/lib/mockData";

type OrdersContextType = {
  orders: Transaction[];
  addOrder: (items: TransactionItem[], total: number, cashier: string) => Transaction;
};

const OrdersContext = createContext<OrdersContextType | null>(null);
const STORAGE_KEY = "inv_orders";

export const OrdersProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Transaction[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      /* ignore */
    }
    return mockTransactions;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  const addOrder = (items: TransactionItem[], total: number, cashier: string) => {
    const id = 1000 + Math.floor(Math.random() * 9000);
    const order: Transaction = {
      id,
      date: new Date().toISOString(),
      cashier,
      items,
      total,
    };
    setOrders((prev) => [order, ...prev]);
    return order;
  };

  return (
    <OrdersContext.Provider value={{ orders, addOrder }}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
};
