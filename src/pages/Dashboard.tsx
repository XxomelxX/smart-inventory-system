import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, DollarSign, ShoppingCart, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductsContext";
import { useOrders } from "@/context/OrdersContext";

const Dashboard = () => {
  const { user } = useAuth();
  const { products } = useProducts();
  const { orders } = useOrders();

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const valid = orders.filter((t) => !t.voided);
    const todaysSales = valid.filter(
      (t) => new Date(t.date).toDateString() === today
    );
    const revenue = todaysSales.reduce((sum, t) => sum + t.total, 0);
    const lowStock = products.filter((p) => p.stock < 20);
    return {
      totalProducts: products.length,
      revenue,
      transactions: todaysSales.length,
      lowStock: lowStock.length,
      lowStockItems: lowStock,
    };
  }, [products, orders]);

  const recent = orders.filter((o) => !o.voided).slice(0, 5);

  const cards = [
    { label: "Today's Revenue", value: `₱${stats.revenue.toFixed(2)}`, icon: DollarSign, tint: "bg-[image:var(--gradient-accent)]" },
    { label: "Transactions Today", value: stats.transactions, icon: ShoppingCart, tint: "bg-[image:var(--gradient-primary)]" },
    { label: "Total Products", value: stats.totalProducts, icon: Package, tint: "bg-primary" },
    { label: "Low Stock Alerts", value: stats.lowStock, icon: AlertTriangle, tint: "bg-destructive" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {user?.name.split(" ")[0]}</h1>
        <p className="text-muted-foreground">Here's what's happening in your store today.</p>
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

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Transactions</h2>
            <Badge variant="secondary">{recent.length}</Badge>
          </div>
          <div className="space-y-3">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                <div>
                  <div className="text-sm font-medium">#{t.id} · {t.cashier}</div>
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

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Low Stock Items</h2>
            <Badge variant="destructive">{stats.lowStockItems.length}</Badge>
          </div>
          {stats.lowStockItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">All products are well-stocked. 🎉</p>
          ) : (
            <div className="space-y-3">
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
    </div>
  );
};

export default Dashboard;
