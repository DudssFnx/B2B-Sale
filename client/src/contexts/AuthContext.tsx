import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type UserRole = "admin" | "sales" | "customer";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company?: string;
  approved: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isSales: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// todo: remove mock functionality
const mockUsers: Record<string, User> = {
  "admin@company.com": {
    id: "1",
    email: "admin@company.com",
    name: "Admin User",
    role: "admin",
    approved: true,
  },
  "sales@company.com": {
    id: "2",
    email: "sales@company.com",
    name: "Sales Rep",
    role: "sales",
    approved: true,
  },
  "customer@client.com": {
    id: "3",
    email: "customer@client.com",
    name: "John Client",
    role: "customer",
    company: "Client Corp",
    approved: true,
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    // todo: remove mock functionality
    const mockUser = mockUsers[email.toLowerCase()];
    if (mockUser) {
      setUser(mockUser);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const isAdmin = user?.role === "admin";
  const isSales = user?.role === "sales";
  const isCustomer = user?.role === "customer";

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isAdmin,
        isSales,
        isCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
