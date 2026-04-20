export type Role = "ADMIN" | "CASHIER";

export type User = {
  id: number;
  username: string;
  password: string;
  name: string;
  role: Role;
};

export type Product = {
  id: number;
  name: string;
  barcode: string;
  price: number;
  stock: number;
  category: string;
};

export type TransactionItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
};

export type Transaction = {
  id: number;
  date: string;
  cashier: string;
  items: TransactionItem[];
  total: number;
};

export const mockUsers: User[] = [
  { id: 1, username: "admin", password: "admin123", name: "Maria Santos", role: "ADMIN" },
  { id: 2, username: "cashier", password: "cashier123", name: "Juan Dela Cruz", role: "CASHIER" },
];

export const mockProducts: Product[] = [
  { id: 1, name: "Coca-Cola 500ml", barcode: "4801234567890", price: 25, stock: 48, category: "Beverages" },
  { id: 2, name: "Lucky Me Pancit Canton", barcode: "4801234567891", price: 15, stock: 120, category: "Noodles" },
  { id: 3, name: "Skyflakes Crackers", barcode: "4801234567892", price: 12, stock: 80, category: "Snacks" },
  { id: 4, name: "Bear Brand Milk 33g", barcode: "4801234567893", price: 18, stock: 65, category: "Dairy" },
  { id: 5, name: "Nescafe 3in1 Original", barcode: "4801234567894", price: 10, stock: 200, category: "Beverages" },
  { id: 6, name: "Tide Powder 70g", barcode: "4801234567895", price: 22, stock: 8, category: "Household" },
  { id: 7, name: "Safeguard Soap 130g", barcode: "4801234567896", price: 45, stock: 5, category: "Personal Care" },
  { id: 8, name: "Magic Sarap 8g", barcode: "4801234567897", price: 6, stock: 150, category: "Condiments" },
  { id: 9, name: "Piattos Cheese 40g", barcode: "4801234567898", price: 28, stock: 32, category: "Snacks" },
  { id: 10, name: "Rebisco Crackers", barcode: "4801234567899", price: 8, stock: 95, category: "Snacks" },
];

export const mockTransactions: Transaction[] = [
  {
    id: 1001,
    date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    cashier: "Juan Dela Cruz",
    items: [
      { productId: 1, name: "Coca-Cola 500ml", price: 25, quantity: 2 },
      { productId: 3, name: "Skyflakes Crackers", price: 12, quantity: 1 },
    ],
    total: 62,
  },
  {
    id: 1002,
    date: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    cashier: "Juan Dela Cruz",
    items: [{ productId: 5, name: "Nescafe 3in1 Original", price: 10, quantity: 5 }],
    total: 50,
  },
  {
    id: 1003,
    date: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    cashier: "Maria Santos",
    items: [
      { productId: 2, name: "Lucky Me Pancit Canton", price: 15, quantity: 4 },
      { productId: 8, name: "Magic Sarap 8g", price: 6, quantity: 2 },
    ],
    total: 72,
  },
  {
    id: 1004,
    date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    cashier: "Juan Dela Cruz",
    items: [{ productId: 9, name: "Piattos Cheese 40g", price: 28, quantity: 3 }],
    total: 84,
  },
];
