import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Boxes, ScanBarcode } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = login(username, password);
    if (res.ok) {
      toast.success("Welcome back!");
      navigate("/dashboard");
    } else {
      toast.error(res.error || "Login failed");
    }
  };

  const quickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[image:var(--gradient-primary)] p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6 items-center">
        <div className="text-primary-foreground hidden md:block px-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Boxes className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold">InventoryPro</h1>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Small Inventory System for Small Businesses
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            Web-based inventory and POS with USB barcode scanner integration. Track stock, process sales, and view reports — all in one place.
          </p>
          <div className="flex items-center gap-2 text-sm text-primary-foreground/90">
            <ScanBarcode className="h-4 w-4" />
            Barcode-ready · Role-based access · Real-time stock
          </div>
        </div>

        <Card className="p-8 shadow-2xl">
          <div className="md:hidden flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground">
              <Boxes className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold">InventoryPro</h1>
          </div>

          <h2 className="text-2xl font-bold mb-1">Sign in</h2>
          <p className="text-sm text-muted-foreground mb-6">Access your inventory dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg">
              Sign in
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-muted-foreground mb-3">Demo accounts (click to fill):</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickLogin("admin", "admin123")}
                className="text-left rounded-md border p-2 text-xs hover:bg-secondary transition"
              >
                <div className="font-medium">Admin</div>
                <div className="text-muted-foreground">admin / admin123</div>
              </button>
              <button
                type="button"
                onClick={() => quickLogin("cashier", "cashier123")}
                className="text-left rounded-md border p-2 text-xs hover:bg-secondary transition"
              >
                <div className="font-medium">Cashier</div>
                <div className="text-muted-foreground">cashier / cashier123</div>
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
