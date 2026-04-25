import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TrendingUp, Package, DollarSign, Download, Boxes } from "lucide-react";
import { useOrders } from "@/context/OrdersContext";
import { useProducts } from "@/context/ProductsContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
} from "recharts";

type Range = "today" | "week" | "month" | "all";

const Reports = () => {
  const { orders } = useOrders();
  const { products } = useProducts();
  const [range, setRange] = useState<Range>("week");

  const filtered = useMemo(() => {
    const valid = orders.filter((o) => !o.voided);
    if (range === "all") return valid;
    const start = new Date();
    if (range === "today") start.setHours(0, 0, 0, 0);
    else if (range === "week") { start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0); }
    else { start.setDate(start.getDate() - 29); start.setHours(0, 0, 0, 0); }
    return valid.filter((o) => new Date(o.date) >= start);
  }, [orders, range]);

  const totals = useMemo(() => {
    const revenue = filtered.reduce((s, t) => s + t.total, 0);
    const itemsSold = filtered.reduce((s, t) => s + t.items.reduce((a, i) => a + i.quantity, 0), 0);
    return { revenue, itemsSold, count: filtered.length };
  }, [filtered]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    filtered.forEach((t) =>
      t.items.forEach((i) => {
        const cur = map.get(i.name) || { name: i.name, qty: 0, revenue: 0 };
        cur.qty += i.quantity;
        cur.revenue += i.price * i.quantity;
        map.set(i.name, cur);
      })
    );
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 8);
  }, [filtered]);

  const trend = useMemo(() => {
    const days = range === "today" ? 1 : range === "week" ? 7 : range === "month" ? 30 : 14;
    const m = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      m.set(d.toLocaleDateString([], { month: "short", day: "numeric" }), 0);
    }
    filtered.forEach((o) => {
      const k = new Date(o.date).toLocaleDateString([], { month: "short", day: "numeric" });
      if (m.has(k)) m.set(k, (m.get(k) || 0) + o.total);
    });
    return Array.from(m.entries()).map(([day, total]) => ({ day, total: +total.toFixed(2) }));
  }, [filtered, range]);

  const inventoryValue = products.reduce((s, p) => s + p.price * p.stock, 0);

  const exportSalesCSV = () => {
    const rows = [
      ["Order ID", "Date", "Cashier", "Customer", "Payment", "Items", "Total"],
      ...filtered.map((o) => [
        o.id, new Date(o.date).toISOString(), o.cashier, o.customer || "",
        o.paymentMethod || "Cash", o.items.reduce((s, i) => s + i.quantity, 0), o.total.toFixed(2),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `sales-${range}-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportInventoryCSV = () => {
    const rows = [
      ["ID", "Name", "Barcode", "Category", "Price", "Stock", "Stock Value"],
      ...products.map((p) => [p.id, p.name, p.barcode, p.category, p.price, p.stock, (p.price * p.stock).toFixed(2)]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `inventory-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Sales and inventory insights — filter by period.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="inline-flex rounded-lg border bg-card p-1">
            {(["today", "week", "month", "all"] as Range[]).map((r) => (
              <Button key={r} variant={range === r ? "default" : "ghost"} size="sm" onClick={() => setRange(r)}>
                {r === "today" ? "Today" : r === "week" ? "Weekly" : r === "month" ? "Monthly" : "All"}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="text-sm text-muted-foreground">Revenue</span>
          </div>
          <div className="text-2xl font-bold">₱{totals.revenue.toFixed(2)}</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-sm text-muted-foreground">Transactions</span>
          </div>
          <div className="text-2xl font-bold">{totals.count}</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Package className="h-5 w-5" />
            </div>
            <span className="text-sm text-muted-foreground">Items Sold</span>
          </div>
          <div className="text-2xl font-bold">{totals.itemsSold}</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Boxes className="h-5 w-5" />
            </div>
            <span className="text-sm text-muted-foreground">Inventory Value</span>
          </div>
          <div className="text-2xl font-bold">₱{inventoryValue.toFixed(2)}</div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Sales Trend</h2>
          <Button variant="outline" size="sm" onClick={exportSalesCSV}>
            <Download className="h-4 w-4" /> Export Sales CSV
          </Button>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={trend}>
            <defs>
              <linearGradient id="rep" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
              formatter={(v: number) => [`₱${v.toFixed(2)}`, "Sales"]} />
            <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#rep)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Top Selling Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales in this period.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} width={130} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="qty" fill="hsl(var(--accent))" radius={[0, 6, 6, 0]} name="Units" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4">Recent Sales</h2>
          <div className="overflow-y-auto max-h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead>Pay</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 20).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">#{t.id}</TableCell>
                    <TableCell className="text-sm">{t.cashier}</TableCell>
                    <TableCell className="text-xs"><Badge variant="secondary">{t.paymentMethod || "Cash"}</Badge></TableCell>
                    <TableCell className="text-right font-semibold">₱{t.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Inventory Report — Stock Balance (LIFO costing assumed)</h2>
          <Button variant="outline" size="sm" onClick={exportInventoryCSV}>
            <Download className="h-4 w-4" /> Export Inventory CSV
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Items are deducted using last-in, last-out from current stock balance on each sale.</p>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell><Badge variant="secondary">{p.category}</Badge></TableCell>
                  <TableCell className="text-right">₱{p.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{p.stock}</TableCell>
                  <TableCell className="text-right">₱{(p.price * p.stock).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    {p.stock < 10 ? <Badge variant="destructive">Critical</Badge>
                      : p.stock < 20 ? <Badge variant="secondary">Low</Badge>
                      : <Badge variant="outline">OK</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Reports;
