import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useOrders } from "@/context/OrdersContext";
import { Search, Eye, Receipt as ReceiptIcon, Printer } from "lucide-react";
import { Receipt } from "@/components/Receipt";

const Orders = () => {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [receiptId, setReceiptId] = useState<number | null>(null);
  const { orders: rawOrders } = useOrders();

  const orders = useMemo(
    () => [...rawOrders].sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [rawOrders]
  );

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      String(o.id).includes(q) ||
      o.cashier.toLowerCase().includes(q) ||
      o.items.some((i) => i.name.toLowerCase().includes(q))
    );
  });

  const selected = orders.find((o) => o.id === selectedId) || null;

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalItems = orders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0), 0);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">All sales transactions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total orders</p>
          <p className="text-2xl font-bold mt-1">{orders.length}</p>
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
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, cashier, or item…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
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
              <TableRow key={o.id}>
                <TableCell className="font-mono">#{o.id}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(o.date).toLocaleString()}
                </TableCell>
                <TableCell>{o.cashier}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {o.items.reduce((s, i) => s + i.quantity, 0)} items
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">₱{o.total.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedId(o.id)}>
                    <Eye className="h-4 w-4 mr-1" /> View
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setReceiptId(o.id)}>
                    <Printer className="h-4 w-4 mr-1" /> Receipt
                  </Button>
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
              <ReceiptIcon className="h-5 w-5" />
              Order #{selected?.id}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {new Date(selected.date).toLocaleString()} · Cashier: {selected.cashier}
              </div>
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
              <div className="flex justify-between items-baseline border-t pt-3">
                <span className="text-muted-foreground">Total</span>
                <span className="text-2xl font-bold text-accent">₱{selected.total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Receipt
        order={orders.find((o) => o.id === receiptId) || null}
        open={!!receiptId}
        onClose={() => setReceiptId(null)}
      />
    </div>
  );
};

export default Orders;
