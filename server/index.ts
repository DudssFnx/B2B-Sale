import "dotenv/config";

import express, { NextFunction, type Request, Response } from "express";
import { createServer } from "http";
import { pool } from "./db";
import { registerRoutes } from "./routes";
import { seedSuperAdmin } from "./scripts/seedSuperAdmin";
import { initializeBlingTokens } from "./services/bling";
import { plansService } from "./services/plans.service";
import { serveStatic } from "./static";

process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled rejection at:', promise, 'reason:', reason);
});

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

app.get("/health/db", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("[DB HEALTH]", error);
    res.status(500).json({
      status: "error",
      message: "database not connected",
    });
  }
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log("[SERVER] Starting server initialization...");
    
    await registerRoutes(httpServer, app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error("[ERROR]", err);
    });

    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    const port = parseInt(process.env.PORT || "5000", 10);
    
    httpServer.listen(
      {
        port,
        host: "0.0.0.0",
        reusePort: true,
      },
      () => {
        log(`serving on port ${port}`);
        
        setImmediate(async () => {
          try {
            await seedSuperAdmin();
          } catch (error) {
            console.error("[SEED] Failed to seed SUPER_ADMIN:", error);
          }

          try {
            await plansService.seedDefaultPlans();
          } catch (error) {
            console.error("[SEED] Failed to seed plans:", error);
          }

          try {
            const blingInitialized = await initializeBlingTokens();
            if (blingInitialized) {
              console.log("[Bling] Connection restored from database");
            } else {
              console.log("[Bling] No saved connection found - authorization required");
            }
          } catch (error) {
            console.error("[Bling] Failed to initialize tokens:", error);
          }
        });
      },
    );
  } catch (error) {
    console.error("[FATAL] Failed to start server:", error);
    process.exit(1);
  }
})();
