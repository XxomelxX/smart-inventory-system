import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { mockProducts, Product, TransactionItem } from "@/lib/mockData";

type ProductsContextType = {
  products: Product[];
  addProduct: (p: Omit<Product, "id">) => Product;
  updateProduct: (id: number, patch: Partial<Product>) => void;
  removeProduct: (id: number) => void;
  restock: (id: number, qty: number) => void;
  deductStockForSale: (items: TransactionItem[]) => void;
  restoreStockFromSale: (items: TransactionItem[]) => void;
  getProduct: (id: number) => Product | undefined;
  getByBarcode: (barcode: string) => Product | undefined;
};

const ProductsContext = createContext<ProductsContextType | null>(null);
const KEY = "inv_products";

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return mockProducts;
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(products));
  }, [products]);

  const addProduct = (p: Omit<Product, "id">) => {
    const id = products.length ? Math.max(...products.map((x) => x.id)) + 1 : 1;
    const newP = { ...p, id };
    setProducts((prev) => [newP, ...prev]);
    return newP;
  };

  const updateProduct = (id: number, patch: Partial<Product>) =>
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const removeProduct = (id: number) =>
    setProducts((prev) => prev.filter((p) => p.id !== id));

  const restock = (id: number, qty: number) =>
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: p.stock + qty } : p)));

  const deductStockForSale = (items: TransactionItem[]) =>
    setProducts((prev) =>
      prev.map((p) => {
        const it = items.find((i) => i.productId === p.id);
        return it ? { ...p, stock: Math.max(0, p.stock - it.quantity) } : p;
      })
    );

  const restoreStockFromSale = (items: TransactionItem[]) =>
    setProducts((prev) =>
      prev.map((p) => {
        const it = items.find((i) => i.productId === p.id);
        return it ? { ...p, stock: p.stock + it.quantity } : p;
      })
    );

  const getProduct = (id: number) => products.find((p) => p.id === id);
  const getByBarcode = (barcode: string) => products.find((p) => p.barcode === barcode.trim());

  return (
    <ProductsContext.Provider
      value={{
        products, addProduct, updateProduct, removeProduct,
        restock, deductStockForSale, restoreStockFromSale, getProduct, getByBarcode,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used within ProductsProvider");
  return ctx;
};
