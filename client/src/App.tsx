import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppSidebar } from "@/components/AppSidebar";
import { CartDrawer } from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import CatalogPage from "@/pages/catalog";
import OrdersPage from "@/pages/orders";
import ProductsPage from "@/pages/products";
import UsersPage from "@/pages/users";
import SettingsPage from "@/pages/settings";
import { useToast } from "@/hooks/use-toast";

function AuthenticatedApp() {
  const { user, logout, isAdmin } = useAuth();
  const { openCart, itemCount } = useCart();
  const { toast } = useToast();

  const handleGenerateOrder = () => {
    toast({
      title: "Order Generated",
      description: "Your order has been submitted and is pending approval.",
    });
  };

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar
          userRole={user?.role}
          userName={user?.name}
          onLogout={logout}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 p-3 border-b bg-background sticky top-0 z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openCart}
                data-testid="button-header-cart"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart ({itemCount})
              </Button>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/" component={DashboardPage} />
              <Route path="/catalog" component={CatalogPage} />
              <Route path="/orders" component={OrdersPage} />
              {isAdmin && <Route path="/products" component={ProductsPage} />}
              {isAdmin && <Route path="/users" component={UsersPage} />}
              {isAdmin && <Route path="/settings" component={SettingsPage} />}
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
        <CartDrawer onGenerateOrder={handleGenerateOrder} />
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <CartProvider>
      <AuthenticatedApp />
    </CartProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
