import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, ScanBarcode, BarChart3, LogOut, Boxes, Users as UsersIcon, LayoutGrid, ReceiptText, Settings as SettingsIcon, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "CASHIER"] },
  { to: "/pos", label: "POS", icon: ScanBarcode, roles: ["ADMIN", "CASHIER"] },
  { to: "/products", label: "Products", icon: Package, roles: ["ADMIN"] },
  { to: "/categories", label: "Categories", icon: LayoutGrid, roles: ["ADMIN"] },
  { to: "/low-stock", label: "Low Stock", icon: AlertTriangle, roles: ["ADMIN", "CASHIER"] },
  { to: "/orders", label: "Orders", icon: ReceiptText, roles: ["ADMIN", "CASHIER"] },
  { to: "/reports", label: "Reports", icon: BarChart3, roles: ["ADMIN"] },
  { to: "/users", label: "Users", icon: UsersIcon, roles: ["ADMIN"] },
  { to: "/settings", label: "Settings", icon: SettingsIcon, roles: ["ADMIN", "CASHIER"] },
];

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-64 flex-col border-r bg-card">
        <div className="flex items-center gap-2 px-6 py-5 border-b">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-none">InventoryPro</h1>
            <p className="text-xs text-muted-foreground mt-1">Small Business POS</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems
            .filter((i) => i.roles.includes(user?.role || ""))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
        </nav>
        <div className="border-t p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <Badge variant="secondary" className="mt-1 text-[10px]">
                {user?.role}
              </Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground">
            <Boxes className="h-4 w-4" />
          </div>
          <span className="font-semibold text-sm">InventoryPro</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <main className="flex-1 md:ml-0 mt-14 md:mt-0 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 border-t bg-card flex">
        {navItems
          .filter((i) => i.roles.includes(user?.role || ""))
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-2 text-[11px] ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label.split(" ")[0]}
            </NavLink>
          ))}
      </nav>
    </div>
  );
};
