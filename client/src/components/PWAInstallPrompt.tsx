import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Share, Plus, MoreVertical, Download } from "lucide-react";

type DeviceType = "ios" | "android" | "desktop" | "unknown";

const MAX_DISMISS_COUNT = 5;
const STORAGE_KEYS = {
  installed: "pwa-installed",
  dismissCount: "pwa-dismiss-count",
  lastDismissTime: "pwa-last-dismiss",
};

function detectDevice(): DeviceType {
  const ua = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(ua)) {
    return "ios";
  }
  if (/android/.test(ua)) {
    return "android";
  }
  if (/windows|macintosh|linux/.test(ua) && !/mobile/.test(ua)) {
    return "desktop";
  }
  return "unknown";
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function getDismissCount(): number {
  const count = localStorage.getItem(STORAGE_KEYS.dismissCount);
  return count ? parseInt(count, 10) : 0;
}

function isInstalled(): boolean {
  return localStorage.getItem(STORAGE_KEYS.installed) === "true";
}

function shouldShowPrompt(): boolean {
  if (isStandalone() || isInstalled()) {
    return false;
  }
  
  const dismissCount = getDismissCount();
  if (dismissCount >= MAX_DISMISS_COUNT) {
    return false;
  }
  
  const lastDismiss = localStorage.getItem(STORAGE_KEYS.lastDismissTime);
  if (lastDismiss) {
    const hoursSinceLastDismiss = (Date.now() - parseInt(lastDismiss, 10)) / (1000 * 60 * 60);
    if (hoursSinceLastDismiss < 24) {
      return false;
    }
  }
  
  return true;
}

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>("unknown");

  useEffect(() => {
    if (isStandalone()) {
      localStorage.setItem(STORAGE_KEYS.installed, "true");
      return;
    }

    if (!shouldShowPrompt()) {
      return;
    }

    const device = detectDevice();
    setDeviceType(device);

    if (device === "ios" || device === "android") {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleInstalled = () => {
    setShowPrompt(false);
    localStorage.setItem(STORAGE_KEYS.installed, "true");
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    const currentCount = getDismissCount();
    localStorage.setItem(STORAGE_KEYS.dismissCount, String(currentCount + 1));
    localStorage.setItem(STORAGE_KEYS.lastDismissTime, String(Date.now()));
  };

  const handleLater = () => {
    handleDismiss();
  };

  if (!showPrompt) {
    return null;
  }

  const dismissCount = getDismissCount();
  const remainingShows = MAX_DISMISS_COUNT - dismissCount;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50" onClick={handleLater}>
      <Card className="w-full max-w-md animate-in slide-in-from-bottom-4" onClick={(e) => e.stopPropagation()}>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                <Download className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Instale o Aplicativo</h3>
                <p className="text-sm text-muted-foreground">Acesso mais rápido e prático</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleDismiss} data-testid="button-dismiss-pwa">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {deviceType === "ios" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Para instalar este site como aplicativo no seu iPhone:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-md">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">1</span>
                  </div>
                  <p className="text-sm">
                    Toque no botão <Share className="inline h-4 w-4 mx-1" /> <strong>Compartilhar</strong> na barra inferior
                  </p>
                </div>
                <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-md">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">2</span>
                  </div>
                  <p className="text-sm">
                    Role e toque em <Plus className="inline h-4 w-4 mx-1" /> <strong>Adicionar à Tela de Início</strong>
                  </p>
                </div>
                <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-md">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">3</span>
                  </div>
                  <p className="text-sm">
                    Confirme tocando em <strong>Adicionar</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {deviceType === "android" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Para instalar este site como aplicativo no seu Android:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-md">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">1</span>
                  </div>
                  <p className="text-sm">
                    Toque no menu <MoreVertical className="inline h-4 w-4 mx-1" /> (3 pontos) no canto superior
                  </p>
                </div>
                <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-md">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">2</span>
                  </div>
                  <p className="text-sm">
                    Toque em <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>
                  </p>
                </div>
                <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-md">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">3</span>
                  </div>
                  <p className="text-sm">
                    Confirme tocando em <strong>Instalar</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={handleLater} data-testid="button-later-pwa">
              Agora não
            </Button>
            <Button className="flex-1" onClick={handleInstalled} data-testid="button-ok-pwa">
              Já instalei
            </Button>
          </div>
          
          {remainingShows <= 3 && remainingShows > 0 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Este aviso aparecerá mais {remainingShows} vez{remainingShows > 1 ? "es" : ""}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
