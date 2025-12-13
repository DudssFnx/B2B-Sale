import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Moon, Sun, Package, ShoppingCart, Truck, Shield, ArrowRight, Store } from "lucide-react";

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <Store className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl hidden sm:block">Atacado B2B</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="button-theme-toggle">
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Button onClick={handleLogin} data-testid="button-login">
              Entrar
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Package className="h-4 w-4" />
              Plataforma B2B Exclusiva
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Seu Atacado Digital
              <span className="text-primary block mt-2">Simples e Eficiente</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Navegue pelo catálogo completo, monte seus pedidos e acompanhe tudo em um só lugar. 
              Sem complicação, sem pagamento online.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleLogin} className="gap-2" data-testid="button-login-hero">
                Acessar Catálogo
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={handleLogin} data-testid="button-register">
                Criar Conta
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Como Funciona</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Sistema prático para você comprar no atacado de forma rápida e organizada
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">1. Navegue o Catálogo</h3>
                <p className="text-muted-foreground text-sm">
                  Explore nossos produtos organizados por categoria com fotos, preços e estoque atualizado
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">2. Monte seu Pedido</h3>
                <p className="text-muted-foreground text-sm">
                  Adicione produtos ao carrinho e gere seu pedido com poucos cliques. Simples assim.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">3. Acompanhe</h3>
                <p className="text-muted-foreground text-sm">
                  Acompanhe o status do seu pedido em tempo real, do processamento até a entrega
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">Acesso Exclusivo</h4>
                <p className="text-sm text-muted-foreground">Apenas clientes aprovados</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">Catálogo Completo</h4>
                <p className="text-sm text-muted-foreground">Todos os produtos disponíveis</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">Pedido Fácil</h4>
                <p className="text-sm text-muted-foreground">Sem pagamento online</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">Entrega Combinada</h4>
                <p className="text-sm text-muted-foreground">Frete negociado diretamente</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Pronto para Começar?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Entre com sua conta ou crie uma nova para acessar nosso catálogo exclusivo de produtos atacado
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={handleLogin} 
            className="gap-2"
            data-testid="button-login-cta"
          >
            Acessar Agora
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      <footer className="py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              <span>Atacado B2B</span>
            </div>
            <p>Plataforma exclusiva para clientes cadastrados</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
