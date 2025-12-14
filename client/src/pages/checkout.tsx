import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  ArrowRight, 
  ShoppingCart, 
  User, 
  Truck, 
  CreditCard, 
  CheckCircle,
  Package,
  Phone,
  MapPin
} from "lucide-react";
import logoImage from "@assets/image_1765659931449.png";
import { ThemeToggle } from "@/components/ThemeToggle";

type CheckoutStep = "resumo" | "cadastro" | "frete" | "pagamento" | "confirmacao";

const steps: { key: CheckoutStep; label: string; icon: typeof ShoppingCart }[] = [
  { key: "resumo", label: "Resumo", icon: ShoppingCart },
  { key: "cadastro", label: "Cadastro", icon: User },
  { key: "frete", label: "Frete", icon: Truck },
  { key: "pagamento", label: "Pagamento", icon: CreditCard },
  { key: "confirmacao", label: "Confirmacao", icon: CheckCircle },
];

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { items, total, itemCount } = useCart();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("resumo");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getCurrentStepIndex = () => steps.findIndex(s => s.key === currentStep);

  const goToNextStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].key);
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key);
    }
  };

  const handleContinueToRegister = () => {
    setLocation("/register?redirect=/checkout&step=frete");
  };

  const handleLoginRedirect = () => {
    setLocation("/login?redirect=/checkout&step=frete");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 bg-zinc-900 text-white">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation("/")}>
                <img 
                  src={logoImage} 
                  alt="Lojamadrugadao" 
                  className="h-10 w-10 rounded-full border-2 border-white/20"
                />
                <h1 className="font-bold text-lg">LOJAMADRUGADAO</h1>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <Package className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Carrinho Vazio</h2>
              <p className="text-muted-foreground mb-6">
                Adicione produtos ao carrinho para continuar com a compra.
              </p>
              <Button onClick={() => setLocation("/catalogo")} className="bg-orange-500 hover:bg-orange-600">
                Ver Catalogo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-zinc-900 text-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation("/")}>
              <img 
                src={logoImage} 
                alt="Lojamadrugadao" 
                className="h-10 w-10 rounded-full border-2 border-white/20"
              />
              <div className="hidden sm:block">
                <h1 className="font-bold text-sm">LOJAMADRUGADAO</h1>
                <div className="flex items-center gap-1 text-zinc-400 text-xs">
                  <Phone className="h-3 w-3" />
                  <span>11 99294-0168</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-sm">
                <ShoppingCart className="h-4 w-4" />
                <span>{itemCount} itens</span>
                <span className="font-bold text-orange-500">{formatPrice(total)}</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/catalogo")}
            data-testid="button-back-catalog"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar ao catalogo
          </Button>
        </div>

        <div className="flex items-center justify-center mb-8 overflow-x-auto">
          <div className="flex items-center gap-2">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.key === currentStep;
              const isPast = index < getCurrentStepIndex();
              
              return (
                <div key={step.key} className="flex items-center">
                  <div 
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive 
                        ? "bg-orange-500 text-white" 
                        : isPast 
                          ? "bg-green-500/20 text-green-600 dark:text-green-400" 
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <StepIcon className="h-4 w-4" />
                    <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-1 ${isPast ? "bg-green-500" : "bg-muted"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {currentStep === "resumo" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Resumo do Pedido
                  </CardTitle>
                  <CardDescription>
                    Confira os itens do seu carrinho antes de continuar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex gap-4 p-3 rounded-lg bg-muted/50"
                      data-testid={`checkout-item-${item.id}`}
                    >
                      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-md" />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.sku}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            Qtd: {item.quantity}
                          </Badge>
                          <span className="text-sm font-semibold">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Subtotal</span>
                    <span className="text-orange-600 dark:text-orange-500">{formatPrice(total)}</span>
                  </div>

                  <Button 
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    onClick={goToNextStep}
                    data-testid="button-continue-to-cadastro"
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentStep === "cadastro" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Identificacao
                  </CardTitle>
                  <CardDescription>
                    Faca login ou cadastre-se para continuar com a compra
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="hover-elevate cursor-pointer" onClick={handleLoginRedirect}>
                      <CardContent className="pt-6 text-center">
                        <User className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                        <h3 className="font-semibold mb-2">Ja tenho conta</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Faca login para continuar
                        </p>
                        <Button variant="outline" className="w-full" data-testid="button-login-checkout">
                          Entrar
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="hover-elevate cursor-pointer border-orange-500/50" onClick={handleContinueToRegister}>
                      <CardContent className="pt-6 text-center">
                        <User className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                        <h3 className="font-semibold mb-2">Criar conta</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Cadastre-se para comprar
                        </p>
                        <Button className="w-full bg-orange-500 hover:bg-orange-600" data-testid="button-register-checkout">
                          Cadastrar
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={goToPreviousStep}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === "frete" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Endereco de Entrega
                  </CardTitle>
                  <CardDescription>
                    Informe onde deseja receber seu pedido
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 text-center">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                    <p className="text-sm">
                      Esta etapa estara disponivel apos o cadastro/login
                    </p>
                  </div>
                  
                  <Button variant="ghost" onClick={goToPreviousStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentStep === "pagamento" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Forma de Pagamento
                  </CardTitle>
                  <CardDescription>
                    Escolha como deseja pagar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 text-center">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                    <p className="text-sm">
                      Esta etapa estara disponivel apos o cadastro/login
                    </p>
                  </div>
                  
                  <Button variant="ghost" onClick={goToPreviousStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentStep === "confirmacao" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Confirmacao
                  </CardTitle>
                  <CardDescription>
                    Revise e confirme seu pedido
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 text-center">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                    <p className="text-sm">
                      Esta etapa estara disponivel apos preencher frete e pagamento
                    </p>
                  </div>
                  
                  <Button variant="ghost" onClick={goToPreviousStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-base">Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Itens ({itemCount})</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Frete</span>
                  <span className="text-muted-foreground">A calcular</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between font-bold">
                  <span>Total</span>
                  <span className="text-xl text-orange-600 dark:text-orange-500">{formatPrice(total)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
