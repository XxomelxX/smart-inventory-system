import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, DollarSign, ShoppingCart, AlertTriangle, TrendingUp, Wallet } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductsContext";
import { useOrders } from "@/context/OrdersContext";
import { useCredit } from "@/context/CreditContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from "recharts";

type Range = "today" | "week" | "month";

const Dashboard = () => {
  const { user } = useAuth();
  const { products } = useProducts();
  const { orders } = useOrders();
  const { customers } = useCredit();
  const [range, setRange] = useState<Range>("week");

  const filtered = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    if (range === "today") start.setHours(0, 0, 0, 0);
    else if (range === "week") start.setDate(now.getDate() - 6);
    else start.setDate(now.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return orders.filter((o) => !o.voided && new Date(o.date) >= start);
  }, [orders, range]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const valid = orders.filter((t) => !t.voided);
    const todaysSales = valid.filter((t) => new Date(t.date).toDateString() === today);
    const revenue = todaysSales.reduce((sum, t) => sum + t.total, 0);
    const lowStock = products.filter((p) => p.stock < 20);
    const utang = customers.reduce((s, c) => s + Math.max(0, c.balance), 0);
    return {
      totalProducts: products.length,
      revenue,
      transactions: todaysSales.length,
      lowStock: lowStock.length,
      lowStockItems: lowStock,
      utang,
    };
  }, [products, orders, customers]);

  // Sales over time (group by day)
  const salesSeries = useMemo(() => {
    const days = range === "today" ? 1 : range === "week" ? 7 : 30;
    const map = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString([], { month: "short", day: "numeric" });
      map.set(key, 0);
    }
    filtered.forEach((o) => {
      const key = new Date(o.date).toLocaleDateString([], { month: "short", day: "numeric" });
      if (map.has(key)) map.set(key, (map.get(key) || 0) + o.total);
    });
    return Array.from(map.entries()).map(([day, total]) => ({ day, total: +total.toFixed(2) }));
  }, [filtered, range]);

  // Top selling
  const topProducts = useMemo(() => {
    const m = new Map<string, { name: string; qty: number; revenue: number }>();
    filtered.forEach((t) =>
      t.items.forEach((i) => {
        const cur = m.get(i.name) || { name: i.name, qty: 0, revenue: 0 };
        cur.qty += i.quantity;
        cur.revenue += i.price * i.quantity;
        m.set(i.name, cur);
      })
    );
    return Array.from(m.values()).sort((a, b) => b.qty - a.qty).slice(0, 6);
  }, [filtered]);

  // Payment method breakdown
  const paymentBreakdown = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((o) => {
      const k = o.paymentMethod || "Cash";
      m.set(k, (m.get(k) || 0) + o.total);
    });
    return Array.from(m.entries()).map(([name, value]) => ({ name, value: +value.toFixed(2) }));
  }, [filtered]);

  const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--primary-glow))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))", "hsl(var(--secondary-foreground))"];

  const recent = orders.filter((o) => !o.voided).slice(0, 5);

  const cards = [
    { label: "Today's Revenue", value: `₱${stats.revenue.toFixed(2)}`, icon: DollarSign, tint: "bg-[image:var(--gradient-accent)]" },
    { label: "Transactions Today", value: stats.transactions, icon: ShoppingCart, tint: "bg-[image:var(--gradient-primary)]" },
    { label: "Total Products", value: stats.totalProducts, icon: Package, tint: "bg-primary" },
    { label: "Outstanding Utang", value: `₱${stats.utang.toFixed(2)}`, icon: Wallet, tint: "bg-destructive" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {user?.name.split(" ")[0]}</h1>
          <p className="text-muted-foreground">Here's what's happening in your store.</p>
        </div>
        <div className="inline-flex rounded-lg border bg-card p-1">
          {(["today", "week", "month"] as Range[]).map((r) => (
            <Button key={r} variant={range === r ? "default" : "ghost"} size="sm"
              className="capitalize" onClick={() => setRange(r)}>
              {r === "today" ? "Today" : r === "week" ? "Weekly" : "Monthly"}
            </Button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between mb-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground ${c.tint}`}>
                <c.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Sales Trend</h2>
            <Badge variant="secondary" className="capitalize">{range}</Badge>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={salesSeries}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                formatter={(v: number) => [`₱${v.toFixed(2)}`, "Sales"]} />
              <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4">Payment Mix</h2>
          {paymentBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales in this period.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={paymentBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(d) => d.name}>
                  {paymentBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `₱${v.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Top Selling Products</h2>
            <Badge variant="secondary" className="capitalize">{range}</Badge>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} width={120} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="qty" fill="hsl(var(--accent))" radius={[0, 6, 6, 0]} name="Units sold" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Low Stock Items</h2>
            <Badge variant="destructive">{stats.lowStockItems.length}</Badge>
          </div>
          {stats.lowStockItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">All products are well-stocked. 🎉</p>
          ) : (
            <div className="space-y-3 max-h-[260px] overflow-y-auto">
              {stats.lowStockItems.map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                  <div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.barcode}</div>
                  </div>
                  <Badge variant={p.stock < 10 ? "destructive" : "secondary"}>
                    {p.stock} left
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent Transactions</h2>
          <Badge variant="secondary">{recent.length}</Badge>
        </div>
        <div className="space-y-3">
          {recent.length === 0 && <p className="text-sm text-muted-foreground">No transactions yet.</p>}
          {recent.map((t) => (
            <div key={t.id} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
              <div>
                <div className="text-sm font-medium">#{t.id} · {t.cashier} · <span className="text-xs text-muted-foreground">{t.paymentMethod || "Cash"}</span></div>
                <div className="text-xs text-muted-foreground">
                  {t.items.length} item{t.items.length > 1 ? "s" : ""} ·{" "}
                  {new Date(t.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <div className="font-semibold text-accent">₱{t.total.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
