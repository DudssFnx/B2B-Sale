import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold">Página não encontrada</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            A página que você está procurando não existe ou foi movida.
          </p>
          
          <Link href="/">
            <Button className="mt-4" data-testid="button-back-home">
              Voltar ao início
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
