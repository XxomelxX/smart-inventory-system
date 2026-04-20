import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { mockUsers, Role, User } from "@/lib/mockData";

type ManagedUser = User & {
  email: string;
  status: "Active" | "Inactive";
  joined: string;
};

const seed: ManagedUser[] = mockUsers.map((u, i) => ({
  ...u,
  email: u.username === "admin" ? "admin123@gmail.com" : "biocobernard@gmail.com",
  status: "Active",
  joined: new Date(2026, 3, 8 - i).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
}));

const initials = (name: string) =>
  name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

const avatarColor = (name: string) => {
  const colors = ["bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-rose-500", "bg-violet-500"];
  return colors[name.charCodeAt(0) % colors.length];
};

const Users = () => {
  const [users, setUsers] = useState<ManagedUser[]>(seed);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState({
    name: "", username: "", email: "", password: "", role: "CASHIER" as Role, status: "Active" as "Active" | "Inactive",
  });

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", username: "", email: "", password: "", role: "CASHIER", status: "Active" });
    setOpen(true);
  };

  const openEdit = (u: ManagedUser) => {
    setEditing(u);
    setForm({ name: u.name, username: u.username, email: u.email, password: u.password, role: u.role, status: u.status });
    setOpen(true);
  };

  const save = () => {
    if (!form.name || !form.username || !form.email) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (editing) {
      setUsers((prev) => prev.map((u) => (u.id === editing.id ? { ...u, ...form } : u)));
      toast.success("User updated");
    } else {
      const id = Math.max(0, ...users.map((u) => u.id)) + 1;
      setUsers((prev) => [
        ...prev,
        {
          id,
          ...form,
          joined: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        },
      ]);
      toast.success("User added");
    }
    setOpen(false);
  };

  const remove = (id: number) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    toast.success("User deleted");
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} user{users.length === 1 ? "" : "s"} registered
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit user" : "Add new user"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Full name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Username</Label>
                  <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Password</Label>
                <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing ? "Keep current" : "Set password"} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="CASHIER">Cashier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "Active" | "Inactive" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save}>{editing ? "Save changes" : "Create user"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>USER</TableHead>
              <TableHead>EMAIL</TableHead>
              <TableHead>ROLE</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead>JOINED</TableHead>
              <TableHead className="text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-semibold ${avatarColor(u.name)}`}>
                      {initials(u.name)}
                    </div>
                    <div className="font-medium">{u.name}</div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  {u.role === "ADMIN" ? (
                    <Badge className="bg-warning/20 text-warning-foreground hover:bg-warning/20 border border-warning/30" style={{ color: "hsl(var(--warning))" }}>
                      Admin
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-primary/15 text-primary hover:bg-primary/15">
                      Cashier
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      u.status === "Active"
                        ? "bg-success/15 hover:bg-success/15 border border-success/30"
                        : "bg-muted hover:bg-muted text-muted-foreground"
                    }
                    style={u.status === "Active" ? { color: "hsl(var(--success))" } : undefined}
                  >
                    {u.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{u.joined}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                      <Pencil className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(u.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Users;
