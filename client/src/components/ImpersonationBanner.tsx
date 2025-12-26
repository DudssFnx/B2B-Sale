import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LogOut, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface ImpersonationStatus {
  isImpersonating: boolean;
  companyId: string | null;
  companyName: string | null;
}

export function ImpersonationBanner() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: status } = useQuery<ImpersonationStatus>({
    queryKey: ["/api/superadmin/impersonation-status"],
    refetchInterval: 30000,
  });

  const exitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/superadmin/exit-impersonate");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Modo empresa desativado",
        description: "Você voltou ao modo administrador",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/impersonation-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/companies"] });
      setLocation("/admin");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível sair do modo empresa",
        variant: "destructive",
      });
    },
  });

  if (!status?.isImpersonating) {
    return null;
  }

  return (
    <div 
      className="bg-amber-500 dark:bg-amber-600 text-amber-950 dark:text-amber-50 px-4 py-2 flex items-center justify-between gap-4 sticky top-0 z-[100]"
      data-testid="banner-impersonation"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <AlertTriangle className="h-4 w-4" />
        <span>Modo Empresa Ativo:</span>
        <span className="flex items-center gap-1 font-bold">
          <Building2 className="h-4 w-4" />
          {status.companyName}
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="bg-white/20 border-amber-700 text-amber-950 dark:text-amber-50 hover:bg-white/30"
        onClick={() => exitMutation.mutate()}
        disabled={exitMutation.isPending}
        data-testid="button-exit-impersonation"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sair do modo empresa
      </Button>
    </div>
  );
}
