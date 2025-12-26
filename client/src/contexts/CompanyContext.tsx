import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { Company } from "@shared/schema";

interface CompanyWithRole extends Partial<Company> {
  id: string;
  slug: string;
  nomeFantasia?: string | null;
  razaoSocial?: string;
  cnpj: string;
  tipoCliente: "ATACADO" | "VAREJO";
  ativo: boolean;
  roleNaEmpresa?: string;
}

interface CompanyContextType {
  activeCompany: CompanyWithRole | null;
  companies: CompanyWithRole[];
  isLoading: boolean;
  setActiveCompany: (company: CompanyWithRole | null) => void;
  hasMultipleCompanies: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const ACTIVE_COMPANY_KEY = "activeCompanyId";

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeCompany, setActiveCompanyState] = useState<CompanyWithRole | null>(null);

  const isSuperAdmin = !!(user as any)?.isSuperAdmin;

  const { data: companies = [], isLoading: companiesLoading } = useQuery<CompanyWithRole[]>({
    queryKey: ["/api/user/companies"],
    enabled: isAuthenticated && !authLoading,
  });

  const setActiveCompany = (company: CompanyWithRole | null) => {
    setActiveCompanyState(company);
    if (company) {
      localStorage.setItem(ACTIVE_COMPANY_KEY, company.id);
    } else {
      localStorage.removeItem(ACTIVE_COMPANY_KEY);
    }
  };

  useEffect(() => {
    if (companiesLoading || !companies.length) return;

    const savedCompanyId = localStorage.getItem(ACTIVE_COMPANY_KEY);
    
    if (savedCompanyId) {
      const savedCompany = companies.find(c => c.id === savedCompanyId);
      if (savedCompany) {
        setActiveCompanyState(savedCompany);
        return;
      }
    }

    if (companies.length === 1) {
      setActiveCompanyState(companies[0]);
      localStorage.setItem(ACTIVE_COMPANY_KEY, companies[0].id);
    } else if (companies.length > 1 && !activeCompany) {
      setActiveCompanyState(companies[0]);
      localStorage.setItem(ACTIVE_COMPANY_KEY, companies[0].id);
    }
  }, [companies, companiesLoading]);

  useEffect(() => {
    if (!isAuthenticated) {
      setActiveCompanyState(null);
      localStorage.removeItem(ACTIVE_COMPANY_KEY);
    }
  }, [isAuthenticated]);

  const isLoading = authLoading || companiesLoading;
  const hasMultipleCompanies = companies.length > 1 || isSuperAdmin;

  return (
    <CompanyContext.Provider
      value={{
        activeCompany,
        companies,
        isLoading,
        setActiveCompany,
        hasMultipleCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}
