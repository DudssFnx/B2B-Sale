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
    toast({ title: "Settings Saved", description: "ERP integration settings updated." });
    console.log("ERP Endpoint:", erpEndpoint);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your application preferences</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel of the application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Enable dark theme for the interface</p>
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
              Notifications
            </CardTitle>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Order Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive alerts for new orders</p>
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
              ERP Integration
            </CardTitle>
            <CardDescription>Configure external ERP system connections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="erp-endpoint">Bling ERP API Endpoint</Label>
              <Input
                id="erp-endpoint"
                placeholder="https://api.bling.com.br/v3"
                value={erpEndpoint}
                onChange={(e) => setErpEndpoint(e.target.value)}
                data-testid="input-erp-endpoint"
              />
              <p className="text-xs text-muted-foreground">
                Enter your Bling API endpoint for product and order synchronization
              </p>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Connection Status</p>
                <p className="text-sm text-muted-foreground">Not connected</p>
              </div>
              <Button variant="outline" onClick={handleSaveERP} data-testid="button-test-connection">
                Test Connection
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>Manage your application data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Export All Data</p>
                <p className="text-sm text-muted-foreground">Download products, orders, and users as CSV</p>
              </div>
              <Button variant="outline" data-testid="button-export-data">
                Export
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Database Backup</p>
                <p className="text-sm text-muted-foreground">Create a full database backup</p>
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
