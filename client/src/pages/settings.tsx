import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Database, Link2, Bell, Shield } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(true);
  const [erpEndpoint, setErpEndpoint] = useState("");

  const handleSaveERP = () => {
    toast({ title: "Configurações Salvas", description: "Configurações de integração ERP atualizadas." });
    console.log("ERP Endpoint:", erpEndpoint);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-semibold">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie as preferências do seu aplicativo</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Aparência
            </CardTitle>
            <CardDescription>Personalize a aparência do aplicativo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Modo Escuro</Label>
                <p className="text-sm text-muted-foreground">Ativar tema escuro na interface</p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                data-testid="switch-dark-mode"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>Configure as preferências de notificação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Notificações de Pedidos</Label>
                <p className="text-sm text-muted-foreground">Receber alertas para novos pedidos</p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
                data-testid="switch-notifications"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Integração ERP
            </CardTitle>
            <CardDescription>Configure conexões com sistemas ERP externos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="erp-endpoint">Endpoint da API Bling ERP</Label>
              <Input
                id="erp-endpoint"
                placeholder="https://api.bling.com.br/v3"
                value={erpEndpoint}
                onChange={(e) => setErpEndpoint(e.target.value)}
                data-testid="input-erp-endpoint"
              />
              <p className="text-xs text-muted-foreground">
                Insira o endpoint da API Bling para sincronização de produtos e pedidos
              </p>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Status da Conexão</p>
                <p className="text-sm text-muted-foreground">Não conectado</p>
              </div>
              <Button variant="outline" onClick={handleSaveERP} data-testid="button-test-connection">
                Testar Conexão
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Gerenciamento de Dados
            </CardTitle>
            <CardDescription>Gerencie os dados do seu aplicativo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Exportar Todos os Dados</p>
                <p className="text-sm text-muted-foreground">Baixar produtos, pedidos e usuários como CSV</p>
              </div>
              <Button variant="outline" data-testid="button-export-data">
                Exportar
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Backup do Banco de Dados</p>
                <p className="text-sm text-muted-foreground">Criar um backup completo do banco de dados</p>
              </div>
              <Button variant="outline" data-testid="button-backup">
                Backup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
