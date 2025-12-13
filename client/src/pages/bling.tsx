import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, RefreshCw, Link as LinkIcon, FolderSync, Package } from "lucide-react";

interface BlingStatus {
  authenticated: boolean;
  hasCredentials: boolean;
}

interface SyncResult {
  created: number;
  updated: number;
  errors?: string[];
}

export default function BlingPage() {
  const { toast } = useToast();
  const [location] = useLocation();

  const { data: status, isLoading } = useQuery<BlingStatus>({
    queryKey: ["/api/bling/status"],
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast({
        title: "Connected to Bling",
        description: "Your Bling account has been successfully connected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bling/status"] });
      window.history.replaceState({}, "", "/bling");
    } else if (params.get("error") === "auth_failed") {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Bling. Please try again.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/bling");
    }
  }, [location, toast]);

  const syncCategoriesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/bling/sync/categories");
      return response.json();
    },
    onSuccess: (data: SyncResult) => {
      toast({
        title: "Categories Synced",
        description: `Created: ${data.created}, Updated: ${data.updated}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync categories",
        variant: "destructive",
      });
    },
  });

  const syncProductsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/bling/sync/products");
      return response.json();
    },
    onSuccess: (data: SyncResult) => {
      const message = `Created: ${data.created}, Updated: ${data.updated}`;
      const errorCount = data.errors?.length || 0;
      toast({
        title: "Products Synced",
        description: errorCount > 0 ? `${message}. Errors: ${errorCount}` : message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync products",
        variant: "destructive",
      });
    },
  });

  const handleConnect = () => {
    window.location.href = "/api/bling/auth";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-bling-title">Bling Integration</h1>
        <p className="text-muted-foreground">
          Connect your Bling account to sync products and categories.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Connection Status
          </CardTitle>
          <CardDescription>
            Status of your Bling API connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Credentials:</span>
              {status?.hasCredentials ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Configured
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Missing
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Authentication:</span>
              {status?.authenticated ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Not Connected
                </Badge>
              )}
            </div>
          </div>

          {status?.hasCredentials && !status?.authenticated && (
            <Button onClick={handleConnect} data-testid="button-bling-connect">
              <LinkIcon className="h-4 w-4 mr-2" />
              Connect to Bling
            </Button>
          )}

          {!status?.hasCredentials && (
            <p className="text-sm text-muted-foreground">
              Please configure BLING_CLIENT_ID and BLING_CLIENT_SECRET in your environment.
            </p>
          )}
        </CardContent>
      </Card>

      {status?.authenticated && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Synchronization
            </CardTitle>
            <CardDescription>
              Sync data from Bling to your catalog
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => syncCategoriesMutation.mutate()}
                disabled={syncCategoriesMutation.isPending}
                variant="outline"
                data-testid="button-sync-categories"
              >
                {syncCategoriesMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FolderSync className="h-4 w-4 mr-2" />
                )}
                Sync Categories
              </Button>

              <Button
                onClick={() => syncProductsMutation.mutate()}
                disabled={syncProductsMutation.isPending}
                data-testid="button-sync-products"
              >
                {syncProductsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Package className="h-4 w-4 mr-2" />
                )}
                Sync Products
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Syncing will import or update categories and products from your Bling account.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
