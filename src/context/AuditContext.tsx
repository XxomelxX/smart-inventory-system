import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type AuditEntry = {
  id: number;
  date: string;
  user: string;
  role: string;
  action: string;
  details?: string;
};

type AuditContextType = {
  log: AuditEntry[];
  record: (entry: Omit<AuditEntry, "id" | "date">) => void;
  clear: () => void;
};

const AuditContext = createContext<AuditContextType | null>(null);
const KEY = "inv_audit";

export const AuditProvider = ({ children }: { children: ReactNode }) => {
  const [log, setLog] = useState<AuditEntry[]>(() => {
    try {
      const s = localStorage.getItem(KEY);
      if (s) return JSON.parse(s);
    } catch { /* ignore */ }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(log));
  }, [log]);

  const record: AuditContextType["record"] = (entry) => {
    setLog((prev) => [
      { ...entry, id: Date.now() + Math.floor(Math.random() * 1000), date: new Date().toISOString() },
      ...prev,
    ].slice(0, 500));
  };

  const clear = () => setLog([]);

  return <AuditContext.Provider value={{ log, record, clear }}>{children}</AuditContext.Provider>;
};

export const useAudit = () => {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error("useAudit must be used within AuditProvider");
  return ctx;
};
