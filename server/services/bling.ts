import { db } from "../db";
import { products, categories, type InsertProduct, type InsertCategory } from "@shared/schema";
import { eq } from "drizzle-orm";

const BLING_API_BASE = "https://api.bling.com.br/Api/v3";
const BLING_OAUTH_URL = "https://www.bling.com.br/Api/v3/oauth";

interface BlingTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface BlingProduct {
  id: number;
  nome: string;
  codigo: string;
  preco: number;
  precoCusto?: number;
  tipo: string;
  situacao: string;
  descricaoCurta?: string;
  marca?: string;
  categoria?: {
    id: number;
    descricao: string;
  };
  estoque?: {
    minimo: number;
    maximo: number;
    saldoVirtual: number;
  };
  midia?: {
    imagens?: {
      externas?: Array<{ link: string }>;
    };
  };
}

interface BlingCategory {
  id: number;
  descricao: string;
  idCategoriaPai?: number;
}

let cachedTokens: BlingTokens | null = null;
let tokenExpiresAt: number = 0;

function getBasicAuthHeader(): string {
  const clientId = process.env.BLING_CLIENT_ID;
  const clientSecret = process.env.BLING_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("BLING_CLIENT_ID and BLING_CLIENT_SECRET are required");
  }
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

export function getAuthorizationUrl(redirectUri: string): string {
  const clientId = process.env.BLING_CLIENT_ID;
  if (!clientId) {
    throw new Error("BLING_CLIENT_ID is required");
  }
  const state = Math.random().toString(36).substring(2);
  return `${BLING_OAUTH_URL}/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<BlingTokens> {
  const response = await fetch(`${BLING_OAUTH_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${getBasicAuthHeader()}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Bling token exchange error:", error);
    throw new Error(`Failed to exchange code for tokens: ${response.status}`);
  }

  const tokens: BlingTokens = await response.json();
  cachedTokens = tokens;
  tokenExpiresAt = Date.now() + (tokens.expires_in * 1000) - 60000;
  
  process.env.BLING_ACCESS_TOKEN = tokens.access_token;
  process.env.BLING_REFRESH_TOKEN = tokens.refresh_token;
  
  return tokens;
}

export async function refreshAccessToken(): Promise<BlingTokens> {
  const refreshToken = process.env.BLING_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error("No refresh token available. Please re-authorize.");
  }

  const response = await fetch(`${BLING_OAUTH_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${getBasicAuthHeader()}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Bling token refresh error:", error);
    throw new Error(`Failed to refresh token: ${response.status}`);
  }

  const tokens: BlingTokens = await response.json();
  cachedTokens = tokens;
  tokenExpiresAt = Date.now() + (tokens.expires_in * 1000) - 60000;
  
  process.env.BLING_ACCESS_TOKEN = tokens.access_token;
  process.env.BLING_REFRESH_TOKEN = tokens.refresh_token;
  
  return tokens;
}

async function getValidAccessToken(): Promise<string> {
  let accessToken = process.env.BLING_ACCESS_TOKEN;
  
  if (!accessToken) {
    throw new Error("Not authenticated with Bling. Please authorize first.");
  }
  
  if (Date.now() >= tokenExpiresAt && process.env.BLING_REFRESH_TOKEN) {
    try {
      const tokens = await refreshAccessToken();
      accessToken = tokens.access_token;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      throw new Error("Token expired. Please re-authorize with Bling.");
    }
  }
  
  return accessToken;
}

async function blingApiRequest<T>(endpoint: string): Promise<T> {
  const accessToken = await getValidAccessToken();
  
  const response = await fetch(`${BLING_API_BASE}${endpoint}`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/json",
    },
  });

  if (response.status === 401) {
    try {
      await refreshAccessToken();
      return blingApiRequest<T>(endpoint);
    } catch {
      throw new Error("Authentication failed. Please re-authorize with Bling.");
    }
  }

  if (!response.ok) {
    const error = await response.text();
    console.error(`Bling API error for ${endpoint}:`, error);
    throw new Error(`Bling API error: ${response.status}`);
  }

  return response.json();
}

export async function fetchBlingProducts(page: number = 1, limit: number = 100): Promise<BlingProduct[]> {
  const response = await blingApiRequest<{ data: BlingProduct[] }>(
    `/produtos?pagina=${page}&limite=${limit}&tipo=P&criterio=1`
  );
  return response.data || [];
}

export async function fetchBlingCategories(): Promise<BlingCategory[]> {
  const response = await blingApiRequest<{ data: BlingCategory[] }>("/categorias/produtos");
  return response.data || [];
}

export async function syncCategories(): Promise<{ created: number; updated: number }> {
  const blingCategories = await fetchBlingCategories();
  let created = 0;
  let updated = 0;

  for (const cat of blingCategories) {
    const slug = cat.descricao
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existing = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);

    if (existing.length === 0) {
      await db.insert(categories).values({
        name: cat.descricao,
        slug,
      });
      created++;
    } else {
      await db.update(categories).set({ name: cat.descricao }).where(eq(categories.slug, slug));
      updated++;
    }
  }

  return { created, updated };
}

export async function syncProducts(): Promise<{ created: number; updated: number; errors: string[] }> {
  let allProducts: BlingProduct[] = [];
  let page = 1;
  const limit = 100;
  
  while (true) {
    const pageProducts = await fetchBlingProducts(page, limit);
    if (pageProducts.length === 0) break;
    allProducts = allProducts.concat(pageProducts);
    if (pageProducts.length < limit) break;
    page++;
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  const existingCategories = await db.select().from(categories);
  const categoryMap: Record<string, number> = {};
  existingCategories.forEach(c => {
    categoryMap[c.name.toLowerCase()] = c.id;
  });

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const blingProduct of allProducts) {
    try {
      if (blingProduct.situacao !== "A") continue;

      let categoryId: number | null = null;
      if (blingProduct.categoria?.descricao) {
        const catName = blingProduct.categoria.descricao.toLowerCase();
        categoryId = categoryMap[catName] || null;
        
        if (!categoryId) {
          const slug = blingProduct.categoria.descricao
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          
          const [newCat] = await db.insert(categories).values({
            name: blingProduct.categoria.descricao,
            slug,
          }).returning();
          
          categoryId = newCat.id;
          categoryMap[catName] = categoryId;
        }
      }

      const imageUrl = blingProduct.midia?.imagens?.externas?.[0]?.link || null;

      const productData: InsertProduct = {
        name: blingProduct.nome,
        sku: blingProduct.codigo || `BLING-${blingProduct.id}`,
        categoryId,
        brand: blingProduct.marca || null,
        description: blingProduct.descricaoCurta || null,
        price: String(blingProduct.preco || 0),
        stock: blingProduct.estoque?.saldoVirtual || 0,
        image: imageUrl,
      };

      const existing = await db.select().from(products).where(eq(products.sku, productData.sku)).limit(1);

      if (existing.length === 0) {
        await db.insert(products).values(productData);
        created++;
      } else {
        await db.update(products)
          .set({
            name: productData.name,
            categoryId: productData.categoryId,
            brand: productData.brand,
            description: productData.description,
            price: productData.price,
            stock: productData.stock,
            image: productData.image,
          })
          .where(eq(products.sku, productData.sku));
        updated++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Product ${blingProduct.codigo}: ${message}`);
    }
  }

  return { created, updated, errors };
}

export function isAuthenticated(): boolean {
  return !!process.env.BLING_ACCESS_TOKEN;
}

export function getStatus(): { authenticated: boolean; hasCredentials: boolean } {
  return {
    authenticated: isAuthenticated(),
    hasCredentials: !!(process.env.BLING_CLIENT_ID && process.env.BLING_CLIENT_SECRET),
  };
}
