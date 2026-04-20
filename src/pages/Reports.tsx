import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { mockProducts, mockTransactions } from "@/lib/mockData";
import { TrendingUp, Package, DollarSign } from "lucide-react";

const Reports = () => {
  const totals = useMemo(() => {
    const revenue = mockTransactions.reduce((s, t) => s + t.total, 0);
    const itemsSold = mockTransactions.reduce(
      (s, t) => s + t.items.reduce((a, i) => a + i.quantity, 0),
      0
    );
    return { revenue, itemsSold, count: mockTransactions.length };
  }, []);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    mockTransactions.forEach((t) =>
      t.items.forEach((i) => {
        const cur = map.get(i.name) || { name: i.name, qty: 0, revenue: 0 };
        cur.qty += i.quantity;
        cur.revenue += i.price * i.quantity;
        map.set(i.name, cur);
      })
    );
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Sales performance and inventory insights.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="text-sm text-muted-foreground">Total Revenue</span>
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
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Top Selling Products</h2>
          <div className="space-y-3">
            {topProducts.map((p, idx) => (
              <div key={p.name} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.qty} sold</div>
                </div>
                <div className="font-semibold text-accent">₱{p.revenue.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4">Recent Sales</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTransactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">#{t.id}</TableCell>
                  <TableCell className="text-sm">{t.cashier}</TableCell>
                  <TableCell className="text-right font-semibold">₱{t.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Stock Levels</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockProducts.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{p.category}</Badge>
                </TableCell>
                <TableCell className="text-right">{p.stock}</TableCell>
                <TableCell className="text-right">
                  {p.stock < 10 ? (
                    <Badge variant="destructive">Critical</Badge>
                  ) : p.stock < 20 ? (
                    <Badge variant="secondary">Low</Badge>
                  ) : (
                    <Badge variant="outline">OK</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Reports;
