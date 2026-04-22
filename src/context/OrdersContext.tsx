import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { mockTransactions, Transaction, TransactionItem, PaymentMethod, DiscountType } from "@/lib/mockData";

type AddOrderInput = {
  items: TransactionItem[];
  total: number;
  cashier: string;
  paymentMethod?: PaymentMethod;
  tendered?: number;
  change?: number;
  subtotal?: number;
  vat?: number;
  discountType?: DiscountType;
  discountAmount?: number;
  customer?: string;
};

type OrdersContextType = {
  orders: Transaction[];
  addOrder: (input: AddOrderInput) => Transaction;
  voidOrder: (id: number, reason: string) => Transaction | null;
};

const OrdersContext = createContext<OrdersContextType | null>(null);
const STORAGE_KEY = "inv_orders";

export const OrdersProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Transaction[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
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

  const voidOrder = (id: number, reason: string) => {
    let voided: Transaction | null = null;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === id && !o.voided) {
          voided = { ...o, voided: true, voidReason: reason, voidedAt: new Date().toISOString() };
          return voided;
        }
        return o;
      })
    );
    return voided;
  };

  return (
    <OrdersContext.Provider value={{ orders, addOrder, voidOrder }}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
};
