import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useOrders } from "@/context/OrdersContext";
import { useProducts } from "@/context/ProductsContext";
import { useAudit } from "@/context/AuditContext";
import { useAuth } from "@/context/AuthContext";
import { Search, Eye, Receipt as ReceiptIcon, Printer, Ban } from "lucide-react";
import { Receipt } from "@/components/Receipt";
import { toast } from "sonner";

const Orders = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [receiptId, setReceiptId] = useState<number | null>(null);
  const [voidId, setVoidId] = useState<number | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const { orders: rawOrders, voidOrder } = useOrders();
  const { restoreStockFromSale } = useProducts();
  const { record } = useAudit();

  const orders = useMemo(
    () => [...rawOrders].sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [rawOrders]
  );

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matches =
      String(o.id).includes(q) ||
      o.cashier.toLowerCase().includes(q) ||
      (o.customer || "").toLowerCase().includes(q) ||
      o.items.some((i) => i.name.toLowerCase().includes(q));
    if (!matches) return false;
    const d = new Date(o.date);
    if (from && d < new Date(from)) return false;
    if (to) {
      const end = new Date(to); end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  });

  const selected = orders.find((o) => o.id === selectedId) || null;
  const voidTarget = orders.find((o) => o.id === voidId) || null;

  const validOrders = orders.filter((o) => !o.voided);
  const totalRevenue = validOrders.reduce((s, o) => s + o.total, 0);
  const totalItems = validOrders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0), 0);

  const confirmVoid = () => {
    if (!voidTarget || !voidReason.trim()) return toast.error("Provide a reason");
    const v = voidOrder(voidTarget.id, voidReason.trim());
    if (v) {
      restoreStockFromSale(v.items);
      record({
        user: user?.name || "", role: user?.role || "",
        action: "VOID_SALE", details: `#${v.id} • ₱${v.total.toFixed(2)} • ${voidReason.trim()}`,
      });
      toast.success(`Sale #${v.id} voided — stock restored`);
    }
    setVoidId(null); setVoidReason("");
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">All sales transactions (voided orders excluded from totals)</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Valid orders</p>
          <p className="text-2xl font-bold mt-1">{validOrders.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Items sold</p>
          <p className="text-2xl font-bold mt-1">{totalItems}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Revenue</p>
          <p className="text-2xl font-bold mt-1 text-accent">₱{totalRevenue.toFixed(2)}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by ID, cashier, customer, or item…"
              value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-[150px]" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-[150px]" />
            {(from || to) && (
              <Button variant="ghost" size="sm" onClick={() => { setFrom(""); setTo(""); }}>Clear</Button>
            )}
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>ORDER #</TableHead>
              <TableHead>DATE</TableHead>
              <TableHead>CASHIER</TableHead>
              <TableHead>ITEMS</TableHead>
              <TableHead className="text-right">TOTAL</TableHead>
              <TableHead className="text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((o) => (
              <TableRow key={o.id} className={o.voided ? "opacity-60" : ""}>
                <TableCell className="font-mono">
                  #{o.id}
                  {o.voided && <Badge variant="destructive" className="ml-2 text-[10px]">VOID</Badge>}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(o.date).toLocaleString()}
                </TableCell>
                <TableCell>{o.cashier}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{o.items.reduce((s, i) => s + i.quantity, 0)} items</Badge>
                </TableCell>
                <TableCell className={`text-right font-semibold ${o.voided ? "line-through" : ""}`}>
                  ₱{o.total.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedId(o.id)}>
                    <Eye className="h-4 w-4 mr-1" /> View
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setReceiptId(o.id)}>
                    <Printer className="h-4 w-4 mr-1" /> Receipt
                  </Button>
                  {isAdmin && !o.voided && (
                    <Button variant="ghost" size="sm" onClick={() => setVoidId(o.id)}>
                      <Ban className="h-4 w-4 mr-1 text-destructive" /> Void
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ReceiptIcon className="h-5 w-5" /> Order #{selected?.id}
              {selected?.voided && <Badge variant="destructive">VOID</Badge>}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {new Date(selected.date).toLocaleString()} · Cashier: {selected.cashier}
                {selected.customer && <> · Customer: <b className="text-foreground">{selected.customer}</b></>}
              </div>
              {selected.voided && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                  <b>Voided:</b> {selected.voidReason}
                  <div className="text-xs text-muted-foreground">
                    {selected.voidedAt && new Date(selected.voidedAt).toLocaleString()}
                  </div>
                </div>
              )}
              <div className="border rounded-lg divide-y">
                {selected.items.map((i) => (
                  <div key={i.productId} className="flex justify-between p-3 text-sm">
                    <div>
                      <div className="font-medium">{i.name}</div>
                      <div className="text-muted-foreground text-xs">₱{i.price} × {i.quantity}</div>
                    </div>
                    <div className="font-semibold">₱{(i.price * i.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              {selected.discountAmount ? (
                <div className="text-sm text-accent flex justify-between">
                  <span>Discount ({selected.discountType})</span>
                  <span>−₱{selected.discountAmount.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="flex justify-between items-baseline border-t pt-3">
                <span className="text-muted-foreground">Total</span>
                <span className="text-2xl font-bold text-accent">₱{selected.total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!voidTarget} onOpenChange={(o) => { if (!o) { setVoidId(null); setVoidReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-destructive" /> Void Sale #{voidTarget?.id}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Voiding will mark this sale as cancelled and restore stock to inventory. This is logged in the audit trail.
            </p>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input value={voidReason} onChange={(e) => setVoidReason(e.target.value)}
                placeholder="e.g. wrong item, customer changed mind" autoFocus />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setVoidId(null); setVoidReason(""); }}>Cancel</Button>
            <Button variant="destructive" onClick={confirmVoid}>Void Sale</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Receipt order={orders.find((o) => o.id === receiptId) || null}
        open={!!receiptId} onClose={() => setReceiptId(null)} />
    </div>
  );
};

export default Orders;
