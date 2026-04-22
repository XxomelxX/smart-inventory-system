import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { mockTransactions, Transaction, TransactionItem, PaymentMethod } from "@/lib/mockData";

type AddOrderInput = {
  items: TransactionItem[];
  total: number;
  cashier: string;
  paymentMethod?: PaymentMethod;
  tendered?: number;
  change?: number;
  subtotal?: number;
  vat?: number;
};

type OrdersContextType = {
  orders: Transaction[];
  addOrder: (input: AddOrderInput) => Transaction;
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

  const addOrder = (input: AddOrderInput) => {
    const id = 1000 + Math.floor(Math.random() * 9000);
    const order: Transaction = {
      id,
      date: new Date().toISOString(),
      ...input,
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
