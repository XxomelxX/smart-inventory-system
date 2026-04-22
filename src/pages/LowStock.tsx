import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Package, ArrowUpRight, Search, Download } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductsContext";

const LowStock = () => {
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const { products } = useProducts();
  const isAdmin = user?.role === "ADMIN";
  const threshold = 20;

  const lowStockItems = useMemo(
    () => products.filter((p) => p.stock < threshold),
    [products]
  );

  const filtered = lowStockItems.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const critical = lowStockItems.filter((p) => p.stock < 10);
  const warning = lowStockItems.filter((p) => p.stock >= 10 && p.stock < threshold);

  const exportList = () => {
    const csv = [
      ["Name", "Barcode", "Category", "Stock", "Status"].join(","),
      ...lowStockItems.map((p) =>
        [p.name, p.barcode, p.category, p.stock, p.stock < 10 ? "Critical" : "Low"].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "low-stock-report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold">Low Stock Items</h1>
            <Badge variant="destructive" className="h-6 px-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {lowStockItems.length}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {isAdmin
              ? `Products below ${threshold} units that need restocking.`
              : `Review products with low stock (below ${threshold} units).`}
          </p>
        </div>
        {isAdmin && (
          <Button variant="outline" onClick={exportList}>
            <Download className="h-4 w-4 mr-2" /> Export List
          </Button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-l-4 border-l-destructive">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{critical.length}</div>
              <div className="text-xs text-muted-foreground">Critical (&lt;10)</div>
            </div>
          </div>
        </Card>
        <Card className="p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{warning.length}</div>
              <div className="text-xs text-muted-foreground">Warning (10-19)</div>
            </div>
          </div>
        </Card>
        <Card className="p-5 border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{lowStockItems.length}</div>
              <div className="text-xs text-muted-foreground">Total Restock Needed</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search low stock items..." className="pl-9" />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {p.stock < 10 && <AlertTriangle className="h-4 w-4 text-destructive" />}
                      {p.name}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.barcode}</TableCell>
                  <TableCell><Badge variant="secondary">{p.category}</Badge></TableCell>
                  <TableCell className="text-right">₱{p.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <span className={p.stock < 10 ? "text-destructive font-bold" : "text-amber-600 font-semibold"}>
                      {p.stock}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={p.stock < 10 ? "destructive" : "secondary"}>
                      {p.stock < 10 ? "CRITICAL" : "LOW"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {lowStockItems.length === 0 ? (
                      <div className="space-y-2">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground/50" />
                        <p>All products are well-stocked! 🎉</p>
                      </div>
                    ) : "No matching items found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default LowStock;
