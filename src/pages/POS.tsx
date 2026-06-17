import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TransactionItem, Transaction, PaymentMethod, Product } from "@/lib/mockData";
import { ScanBarcode, Trash2, Plus, Minus, Receipt as ReceiptIcon, Banknote, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Receipt } from "@/components/Receipt";

const VAT_RATE = 0.12;

const POS = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);

  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [payment, setPayment] = useState<PaymentMethod>("Cash");
  const [tendered, setTendered] = useState<string>("");
  const [paymentRef, setPaymentRef] = useState<string>("");
  const [lastOrder, setLastOrder] = useState<Transaction | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // load products from backend (uses Vite proxy in dev)
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => setProducts(data))
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => { inputRef.current?.focus(); }, [cart]);

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === p.id);
      if (existing) {
        if (existing.quantity >= p.stock) {
          toast.error(`Only ${p.stock} in stock`);
          return prev;
        }
        return prev.map((i) => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      if (p.stock < 1) { toast.error("Out of stock"); return prev; }
      return [...prev, { productId: p.id, name: p.name, price: p.price, quantity: 1 }];
    });
    toast.success(`Added: ${p.name}`);
  };

  const addByBarcode = (code: string): boolean => {
    const product = products.find((p) => p.barcode === code || p.sku === code);
    if (!product) {
      toast.error(`No product found for barcode ${code}`);
      return false;
    }
    addToCart(product);
    return true;
  };

  const updateQty = (productId: number, delta: number) => {
    const product = products.find((p) => p.id === productId);
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId !== productId) return i;
        const newQty = i.quantity + delta;
        if (product && newQty > product.stock) { toast.error(`Only ${product.stock} in stock`); return i; }
        return { ...i, quantity: newQty };
      }).filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (productId: number) => setCart((prev) => prev.filter((i) => i.productId !== productId));

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;
    addByBarcode(barcode);
    setBarcode("");
  };

  const { gross, discountAmount, net, subtotal, vat } = useMemo(() => {
    const g = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const d = 0;
    const n = Math.max(0, g - d);
    const sub = n / (1 + VAT_RATE);
    return { gross: g, discountAmount: d, net: n, subtotal: sub, vat: n - sub };
  }, [cart]);

  const total = net;
  const tenderedNum = parseFloat(tendered) || 0;
  const change = payment === "Cash" ? Math.max(0, tenderedNum - total) : 0;
  const cashShort = payment === "Cash" && tenderedNum < total;
  const refRequired = payment === "GCash";
  const refMissing = refRequired && !paymentRef.trim();

  const checkout = () => {
    if (cart.length === 0) return;
    if (cashShort) return toast.error("Cash tendered is less than total");
    if (refMissing) return toast.error(`Enter ${payment} reference number`);
    
    // Send order to backend API which will create order and deduct stock
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart,
        total,
        paymentMethod: payment,
        paymentRef: refRequired ? paymentRef.trim() : undefined,
        tendered: payment === 'Cash' ? tenderedNum : undefined,
        change: payment === 'Cash' ? change : undefined,
        cashier: user?.name || 'Unknown',
        subtotal, vat,
      }),
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown' }));
        return toast.error(err.error || 'Order failed');
      }
      const order = await res.json();
      setLastOrder(order);
      setReceiptOpen(true);
      setCart([]); setTendered(''); setPaymentRef('');
      toast.success(`Sale #${order.id} completed — ₱${order.total.toFixed(2)}`);
    }).catch((e) => toast.error(String(e)));
  };

  const PaymentBtn = ({ method, icon: Icon }: { method: PaymentMethod; icon: typeof Banknote }) => (
    <button type="button" onClick={() => setPayment(method)}
      className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border text-xs transition ${
        payment === method ? "border-primary bg-primary/10 text-primary font-semibold" : "border-input hover:bg-accent/50"
      }`}>
      <Icon className="h-4 w-4" />{method}
    </button>
  );

  const quickCash = [50, 100, 200, 500, 1000];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Point of Sale</h1>
        <p className="text-muted-foreground">
          Scan a barcode or click a product. Cashier: <span className="font-medium text-foreground">{user?.name}</span>
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        <div className="space-y-4">
          <Card className="p-4 border-accent/40 border-2">
            <form onSubmit={handleScan} className="flex gap-2 items-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground shrink-0">
                <ScanBarcode className="h-5 w-5" />
              </div>
              <Input ref={inputRef} value={barcode} onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan barcode or type and press Enter…" className="text-base font-mono h-11" autoFocus />
              <Button type="submit" size="lg">Add</Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">💡 Try: <code className="text-accent">4801234567890</code></p>
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold mb-3 text-sm text-muted-foreground">Quick Add</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[440px] overflow-y-auto">
              {products.map((p) => (
                <button key={p.id} onClick={() => addToCart(p)} disabled={p.stock === 0}
                  className="text-left rounded-lg border p-3 hover:border-primary hover:shadow-[var(--shadow-card)] transition disabled:opacity-50">
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

        <Card className="p-4 lg:sticky lg:top-4 lg:self-start">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Cart</h2>
            <Badge variant="secondary">{cart.length} items</Badge>
          </div>

          <div className="space-y-2 max-h-[260px] overflow-y-auto mb-4">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <ReceiptIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
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

          <div className="border-t pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Gross</span><span>₱{gross.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>₱{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>VAT (12%)</span><span>₱{vat.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <span className="font-semibold">Total</span>
              <span className="text-3xl font-bold text-accent">₱{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {/* Customer input removed per request */}

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <PaymentBtn method="Cash" icon={Banknote} />
                <PaymentBtn method="GCash" icon={Smartphone} />
              </div>
            </div>

            {refRequired && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{payment} Reference No.</label>
                <Input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder={`Enter ${payment} ref / txn id`} className="font-mono" />
              </div>
            )}

            {/* Utang payment option not available in simplified POS */}

            {payment === "Cash" && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Cash Tendered</label>
                <Input type="number" inputMode="decimal" placeholder="0.00"
                  value={tendered} onChange={(e) => setTendered(e.target.value)}
                  className="text-lg font-mono" />
                <div className="flex flex-wrap gap-1 mt-2">
                  {quickCash.map((v) => (
                    <Button key={v} type="button" size="sm" variant="outline" className="h-7 text-xs"
                      onClick={() => setTendered(String(v))}>₱{v}</Button>
                  ))}
                  <Button type="button" size="sm" variant="outline" className="h-7 text-xs"
                    onClick={() => setTendered(total.toFixed(2))}>Exact</Button>
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-muted-foreground">Change</span>
                  <span className={`font-bold ${cashShort ? "text-destructive" : "text-primary"}`}>
                    {cashShort ? `Short ₱${(total - tenderedNum).toFixed(2)}` : `₱${change.toFixed(2)}`}
                  </span>
                </div>
              </div>
            )}

            <Button className="w-full" size="lg" disabled={cart.length === 0 || cashShort || refMissing} onClick={checkout}>
              Checkout & Print Receipt
            </Button>

            {lastOrder && (
              <Button variant="outline" className="w-full" size="sm" onClick={() => setReceiptOpen(true)}>
                <ReceiptIcon className="h-4 w-4" /> Reprint Last Receipt #{lastOrder.id}
              </Button>
            )}
          </div>
        </Card>
      </div>

      <Receipt order={lastOrder} open={receiptOpen} onClose={() => setReceiptOpen(false)} />
    </div>
  );
};

export default POS;
