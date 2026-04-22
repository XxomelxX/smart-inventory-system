import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { useAudit } from "@/context/AuditContext";
import { Save, Store, Bell, Shield, Database, Download, Upload } from "lucide-react";
import { toast } from "sonner";

type StoreSettings = {
  storeName: string;
  address: string;
  currency: string;
  taxRate: string;
  lowStockThreshold: string;
  notifyLowStock: boolean;
  notifySales: boolean;
};

const DEFAULTS: StoreSettings = {
  storeName: "Sari-Sari Mart",
  address: "123 Rizal St., Manila, PH",
  currency: "PHP (₱)",
  taxRate: "12",
  lowStockThreshold: "20",
  notifyLowStock: true,
  notifySales: false,
};

const KEY = "inv_settings";
const BACKUP_KEYS = ["inv_products", "inv_orders", "inv_audit", "inv_settings"];

const Settings = () => {
  const { user } = useAuth();
  const { record } = useAudit();
  const [s, setS] = useState<StoreSettings>(DEFAULTS);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    if (stored) setS({ ...DEFAULTS, ...JSON.parse(stored) });
  }, []);

  const save = () => {
    localStorage.setItem(KEY, JSON.stringify(s));
    toast.success("Settings saved");
  };

  const reset = () => {
    setS(DEFAULTS);
    localStorage.removeItem(KEY);
    toast.success("Settings reset to defaults");
  };

  const backup = () => {
    const data: Record<string, unknown> = { exportedAt: new Date().toISOString(), version: 1 };
    BACKUP_KEYS.forEach((k) => {
      const v = localStorage.getItem(k);
      if (v) data[k] = JSON.parse(v);
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `inventory-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    record({ user: user?.name || "", role: user?.role || "", action: "BACKUP", details: "Full backup downloaded" });
    toast.success("Backup downloaded");
  };

  const restore = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        BACKUP_KEYS.forEach((k) => {
          if (data[k] !== undefined) localStorage.setItem(k, JSON.stringify(data[k]));
        });
        record({ user: user?.name || "", role: user?.role || "", action: "RESTORE", details: file.name });
        toast.success("Backup restored — reloading…");
        setTimeout(() => window.location.reload(), 800);
      } catch {
        toast.error("Invalid backup file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your store and preferences</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Store information</h2>
        </div>
        <Separator />
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Store name</Label>
            <Input value={s.storeName} onChange={(e) => setS({ ...s, storeName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Input value={s.currency} onChange={(e) => setS({ ...s, currency: e.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Address</Label>
            <Input value={s.address} onChange={(e) => setS({ ...s, address: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Tax rate (%)</Label>
            <Input type="number" value={s.taxRate} onChange={(e) => setS({ ...s, taxRate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Low-stock threshold</Label>
            <Input type="number" value={s.lowStockThreshold} onChange={(e) => setS({ ...s, lowStockThreshold: e.target.value })} />
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Notifications</h2>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <Label>Low-stock alerts</Label>
            <p className="text-xs text-muted-foreground">Notify me when products fall below the threshold</p>
          </div>
          <Switch checked={s.notifyLowStock} onCheckedChange={(v) => setS({ ...s, notifyLowStock: v })} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Sales summary</Label>
            <p className="text-xs text-muted-foreground">Send a daily sales summary</p>
          </div>
          <Switch checked={s.notifySales} onCheckedChange={(v) => setS({ ...s, notifySales: v })} />
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Backup & Restore</h2>
        </div>
        <Separator />
        <p className="text-sm text-muted-foreground">
          Download a JSON backup of all products, orders, audit log, and settings. Restore from a backup file to recover data.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={backup}>
            <Download className="h-4 w-4" /> Download Backup
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Restore from File
          </Button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) restore(f); e.target.value = ""; }} />
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Account</h2>
        </div>
        <Separator />
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-muted-foreground text-xs">Signed in as</Label>
            <p className="font-medium mt-1">{user?.name}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Role</Label>
            <p className="font-medium mt-1">{user?.role}</p>
          </div>
        </div>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={reset}>Reset</Button>
        <Button onClick={save}><Save className="h-4 w-4 mr-2" /> Save changes</Button>
      </div>
    </div>
  );
};

export default Settings;
