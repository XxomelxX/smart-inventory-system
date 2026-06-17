import { ReactNode } from "react";

// Audit log feature removed. Stub kept so existing callers compile.
export const AuditProvider = ({ children }: { children: ReactNode }) => <>{children}</>;
export const useAudit = () => ({ record: (_: unknown) => {} });
