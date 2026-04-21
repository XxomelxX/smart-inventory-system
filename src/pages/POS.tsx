import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockProducts, Product, TransactionItem } from "@/lib/mockData";
import { ScanBarcode, Trash2, Plus, Minus, Receipt } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrdersContext";
import { Link } from "react-router-dom";

const POS = () => {
  const { user } = useAuth();
  const { addOrder } = useOrders();
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [lastReceipt, setLastReceipt] = useState<{ id: number; total: number; items: TransactionItem[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [cart]);

  const addByBarcode = (code: string) => {
    const product = mockProducts.find((p) => p.barcode === code.trim());
    if (!product) {
      toast.error(`No product found for barcode ${code}`);
      return;
    }
    addToCart(product);
  };

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === p.id);
      if (existing) {
        if (existing.quantity >= p.stock) {
          toast.error(`Only ${p.stock} in stock`);
          return prev;
        }
        return prev.map((i) =>
          i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { productId: p.id, name: p.name, price: p.price, quantity: 1 }];
    });
    toast.success(`Added: ${p.name}`);
  };

  const updateQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;
    addByBarcode(barcode);
    setBarcode("");
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const checkout = () => {
    if (cart.length === 0) return;
    const order = addOrder(cart, total, user?.name || "Unknown");
    setLastReceipt({ id: order.id, total: order.total, items: order.items });
    setCart([]);
    toast.success(`Sale #${order.id} completed — ₱${order.total.toFixed(2)}`);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Point of Sale</h1>
        <p className="text-muted-foreground">
          Scan a barcode or click a product to add it to the cart. Cashier:{" "}
          <span className="font-medium text-foreground">{user?.name}</span>
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        {/* Left: Scanner + Product grid */}
        <div className="space-y-4">
          <Card className="p-4 border-accent/40 border-2">
            <form onSubmit={handleScan} className="flex gap-2 items-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground shrink-0">
                <ScanBarcode className="h-5 w-5" />
              </div>
              <Input
                ref={inputRef}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan barcode or type and press Enter…"
                className="text-base font-mono h-11"
                autoFocus
              />
              <Button type="submit" size="lg">Add</Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              💡 USB scanners auto-type the barcode + Enter. Try: <code className="text-accent">4801234567890</code>
            </p>
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold mb-3 text-sm text-muted-foreground">Quick Add</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[440px] overflow-y-auto">
              {mockProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={p.stock === 0}
                  className="text-left rounded-lg border p-3 hover:border-primary hover:shadow-[var(--shadow-card)] transition disabled:opacity-50"
                >
                  <div className="font-medium text-sm line-clamp-2">{p.name}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-primary">₱{p.price}</span>
                    <Badge variant={p.stock < 10 ? "destructive" : "outline"} className="text-[10px]">
                      {p.stock} stk
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Cart */}
        <Card className="p-4 lg:sticky lg:top-4 lg:self-start">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Cart</h2>
            <Badge variant="secondary">{cart.length} items</Badge>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto mb-4">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <Receipt className="h-10 w-10 mx-auto mb-2 opacity-30" />
                Cart is empty.<br />Scan a barcode to start.
              </div>
            ) : (
              cart.map((i) => (
                <div key={i.productId} className="flex items-center gap-2 border-b pb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{i.name}</div>
                    <div className="text-xs text-muted-foreground">₱{i.price} × {i.quantity}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(i.productId, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">{i.quantity}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(i.productId, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeItem(i.productId)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-muted-foreground">Total</span>
              <span className="text-3xl font-bold text-accent">₱{total.toFixed(2)}</span>
            </div>
            <Button className="w-full" size="lg" disabled={cart.length === 0} onClick={checkout}>
              Checkout
            </Button>
          </div>

          {lastReceipt && (
            <div className="mt-4 p-3 rounded-lg bg-secondary text-xs space-y-2">
              <div className="font-semibold">✓ Receipt #{lastReceipt.id}</div>
              <div className="text-muted-foreground">
                {lastReceipt.items.length} item(s) · ₱{lastReceipt.total.toFixed(2)}
              </div>
              <Link
                to="/orders"
                className="inline-block text-primary font-medium hover:underline"
              >
                View in Orders →
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default POS;
