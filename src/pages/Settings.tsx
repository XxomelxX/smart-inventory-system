import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { Save, Store, Bell, Shield } from "lucide-react";
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
  storeName: "Small Inventory System",
  address: "123 Main Street, Manila, PH",
  currency: "PHP (₱)",
  taxRate: "12",
  lowStockThreshold: "10",
  notifyLowStock: true,
  notifySales: false,
};

const KEY = "inv_settings";

const Settings = () => {
  const { user } = useAuth();
  const [s, setS] = useState<StoreSettings>(DEFAULTS);

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
        <Button onClick={save}>
          <Save className="h-4 w-4 mr-2" /> Save changes
        </Button>
      </div>
    </div>
  );
};

export default Settings;
