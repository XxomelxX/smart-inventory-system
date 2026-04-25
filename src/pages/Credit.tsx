import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCredit } from "@/context/CreditContext";
import { useAuth } from "@/context/AuthContext";
import { useAudit } from "@/context/AuditContext";
import { Wallet, Plus, Search, HandCoins } from "lucide-react";
import { toast } from "sonner";

const Credit = () => {
  const { user } = useAuth();
  const { record } = useAudit();
  const { entries, addCharge, addPayment, customers } = useCredit();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<"charge" | "payment" | null>(null);
  const [form, setForm] = useState({ customer: "", amount: "", note: "" });

  const totalUtang = customers.reduce((s, c) => s + Math.max(0, c.balance), 0);
  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredEntries = useMemo(
    () => entries.filter((e) => e.customer.toLowerCase().includes(search.toLowerCase())).slice(0, 50),
    [entries, search]
  );

  const submit = () => {
    const amt = parseFloat(form.amount);
    if (!form.customer.trim() || !amt || amt <= 0) return toast.error("Enter customer and valid amount");
    if (open === "charge") {
      addCharge({ customer: form.customer, amount: amt, note: form.note || undefined, cashier: user?.name });
      record({ user: user?.name || "", role: user?.role || "", action: "CREDIT_CHARGE", details: `${form.customer} +₱${amt.toFixed(2)}` });
      toast.success(`Utang charged to ${form.customer}`);
    } else {
      addPayment({ customer: form.customer, amount: amt, note: form.note || undefined, cashier: user?.name });
      record({ user: user?.name || "", role: user?.role || "", action: "CREDIT_PAYMENT", details: `${form.customer} −₱${amt.toFixed(2)}` });
      toast.success(`Payment recorded for ${form.customer}`);
    }
    setOpen(null);
    setForm({ customer: "", amount: "", note: "" });
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Wallet className="h-7 w-7 text-primary" /> Utang / Credit Tracking
          </h1>
          <p className="text-muted-foreground">Track customer credit balances and payments.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setForm({ customer: "", amount: "", note: "" }); setOpen("payment"); }}>
            <HandCoins className="h-4 w-4" /> Record Payment
          </Button>
          <Button onClick={() => { setForm({ customer: "", amount: "", note: "" }); setOpen("charge"); }}>
            <Plus className="h-4 w-4" /> Add Utang
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total outstanding utang</p>
          <p className="text-2xl font-bold mt-1 text-destructive">₱{totalUtang.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Customers with utang</p>
          <p className="text-2xl font-bold mt-1">{customers.filter((c) => c.balance > 0).length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total entries</p>
          <p className="text-2xl font-bold mt-1">{entries.length}</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer name…" className="pl-9" />
        </div>

        <h2 className="font-semibold mb-3 text-sm">Customer balances</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No customers yet.</TableCell></TableRow>
            )}
            {filteredCustomers.map((c) => (
              <TableRow key={c.name}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className={`text-right font-bold ${c.balance > 0 ? "text-destructive" : c.balance < 0 ? "text-primary" : ""}`}>
                  ₱{c.balance.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {c.balance > 0 ? <Badge variant="destructive">Has utang</Badge>
                    : c.balance < 0 ? <Badge variant="secondary">Overpaid</Badge>
                    : <Badge variant="outline">Settled</Badge>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-3 text-sm">Recent activity</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No entries.</TableCell></TableRow>
            )}
            {filteredEntries.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="text-xs text-muted-foreground">{new Date(e.date).toLocaleString()}</TableCell>
                <TableCell className="font-medium">{e.customer}</TableCell>
                <TableCell>
                  {e.type === "CHARGE"
                    ? <Badge variant="destructive">Utang</Badge>
                    : <Badge variant="secondary">Payment</Badge>}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {e.orderId ? `Order #${e.orderId}` : ""} {e.note}
                </TableCell>
                <TableCell className={`text-right font-semibold ${e.type === "CHARGE" ? "text-destructive" : "text-primary"}`}>
                  {e.type === "CHARGE" ? "+" : "−"}₱{e.amount.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {open === "charge" ? "Add Utang (Credit Charge)" : "Record Payment"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label>Customer name</Label>
              <Input list="credit-customers" value={form.customer}
                onChange={(e) => setForm({ ...form, customer: e.target.value })} placeholder="e.g. Aling Nena" autoFocus />
              <datalist id="credit-customers">
                {customers.map((c) => <option key={c.name} value={c.name} />)}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label>Amount (₱)</Label>
              <Input type="number" inputMode="decimal" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. partial payment" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
            <Button onClick={submit}>{open === "charge" ? "Add Utang" : "Record Payment"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Credit;
