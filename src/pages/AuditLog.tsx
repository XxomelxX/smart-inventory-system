import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAudit } from "@/context/AuditContext";
import { Search, ShieldCheck, Trash2, Download } from "lucide-react";
import { toast } from "sonner";

const actionColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  SALE: "default",
  VOID_SALE: "destructive",
  RESTOCK: "secondary",
  PRODUCT_CREATE: "outline",
  PRODUCT_UPDATE: "outline",
  PRODUCT_DELETE: "destructive",
  LOGIN: "secondary",
  BACKUP: "secondary",
  RESTORE: "secondary",
};

const AuditLog = () => {
  const { log, clear } = useAudit();
  const [search, setSearch] = useState("");

  const filtered = log.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.user.toLowerCase().includes(q) ||
      e.action.toLowerCase().includes(q) ||
      (e.details || "").toLowerCase().includes(q)
    );
  });

  const exportCsv = () => {
    const csv = [
      ["Date", "User", "Role", "Action", "Details"].join(","),
      ...log.map((e) => [
        new Date(e.date).toISOString(), e.user, e.role, e.action,
        `"${(e.details || "").replace(/"/g, '""')}"`,
      ].join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Audit log exported");
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" /> Audit Log
          </h1>
          <p className="text-sm text-muted-foreground">All system activity for security and accountability</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> Export</Button>
          <Button variant="outline" onClick={() => { clear(); toast.success("Log cleared"); }}>
            <Trash2 className="h-4 w-4 text-destructive" /> Clear
          </Button>
        </div>
      </header>

      <Card>
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by user, action, or details…"
              value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>DATE</TableHead>
              <TableHead>USER</TableHead>
              <TableHead>ACTION</TableHead>
              <TableHead>DETAILS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(e.date).toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{e.user}</div>
                  <div className="text-[10px] text-muted-foreground">{e.role}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={actionColor[e.action] || "outline"} className="text-[10px]">
                    {e.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.details || "—"}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  {log.length === 0 ? "No activity recorded yet." : "No matching entries."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AuditLog;
