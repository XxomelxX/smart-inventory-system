import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { mockUsers, User } from "@/lib/mockData";

type AuthContextType = {
  user: User | null;
  login: (username: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("inv_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const login = (username: string, password: string) => {
    const found = mockUsers.find(
      (u) => u.username === username && u.password === password
    );
    if (!found) return { ok: false, error: "Invalid username or password" };
    setUser(found);
    localStorage.setItem("inv_user", JSON.stringify(found));
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("inv_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
