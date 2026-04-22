import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Product } from "@/lib/mockData";
import { Plus, Search, Pencil, Trash2, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { useProducts } from "@/context/ProductsContext";
import { useAudit } from "@/context/AuditContext";
import { useAuth } from "@/context/AuthContext";

const Products = () => {
  const { products, addProduct, updateProduct, removeProduct, restock } = useProducts();
  const { record } = useAudit();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", barcode: "", price: "", stock: "", category: "" });

  const [restockOpen, setRestockOpen] = useState(false);
  const [restockTarget, setRestockTarget] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState("");

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", barcode: "", price: "", stock: "", category: "" });
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, barcode: p.barcode, price: String(p.price), stock: String(p.stock), category: p.category });
    setOpen(true);
  };

  const save = () => {
    if (!form.name || !form.barcode || !form.price) {
      return toast.error("Please fill in name, barcode, and price.");
    }
    if (editing) {
      updateProduct(editing.id, {
        name: form.name, barcode: form.barcode,
        price: +form.price, stock: +form.stock, category: form.category,
      });
      record({ user: user?.name || "", role: user?.role || "", action: "PRODUCT_UPDATE", details: form.name });
      toast.success("Product updated");
    } else {
      const newP = addProduct({
        name: form.name, barcode: form.barcode,
        price: +form.price, stock: +form.stock || 0,
        category: form.category || "Uncategorized",
      });
      record({ user: user?.name || "", role: user?.role || "", action: "PRODUCT_CREATE", details: newP.name });
      toast.success("Product added");
    }
    setOpen(false);
  };

  const remove = (p: Product) => {
    removeProduct(p.id);
    record({ user: user?.name || "", role: user?.role || "", action: "PRODUCT_DELETE", details: p.name });
    toast.success("Product deleted");
  };

  const openRestock = (p: Product) => {
    setRestockTarget(p);
    setRestockQty("");
    setRestockOpen(true);
  };

  const confirmRestock = () => {
    const qty = parseInt(restockQty);
    if (!restockTarget || !qty || qty <= 0) return toast.error("Enter a valid quantity");
    restock(restockTarget.id, qty);
    record({
      user: user?.name || "", role: user?.role || "",
      action: "RESTOCK", details: `+${qty} ${restockTarget.name}`,
    });
    toast.success(`Restocked ${qty} × ${restockTarget.name}`);
    setRestockOpen(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your inventory catalog.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Add Product</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Product" : "New Product"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Barcode</Label>
                  <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Price (₱)</Label>
                  <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save}>{editing ? "Save" : "Add"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <Card className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, barcode, or category…" className="pl-9" />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="font-mono text-xs">{p.barcode}</TableCell>
                  <TableCell><Badge variant="secondary">{p.category}</Badge></TableCell>
                  <TableCell className="text-right">₱{p.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={p.stock < 10 ? "destructive" : p.stock < 20 ? "secondary" : "outline"}>
                      {p.stock}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openRestock(p)} title="Restock">
                      <PackagePlus className="h-4 w-4 text-accent" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(p)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackagePlus className="h-5 w-5 text-accent" /> Restock Product
            </DialogTitle>
          </DialogHeader>
          {restockTarget && (
            <div className="space-y-3 pt-2">
              <div className="text-sm">
                <div className="font-semibold">{restockTarget.name}</div>
                <div className="text-muted-foreground">Current stock: <b>{restockTarget.stock}</b></div>
              </div>
              <div className="space-y-2">
                <Label>Quantity to add</Label>
                <Input type="number" autoFocus value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)} placeholder="e.g. 50" />
              </div>
              {restockQty && +restockQty > 0 && (
                <p className="text-sm text-accent">New stock: {restockTarget.stock + +restockQty}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestockOpen(false)}>Cancel</Button>
            <Button onClick={confirmRestock}>Add to Stock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
