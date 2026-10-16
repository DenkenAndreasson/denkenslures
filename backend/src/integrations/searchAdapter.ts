import { algoliasearch } from "algoliasearch";
import { z } from "zod";


function getConfig() {
    return {
        appId: process.env.ALGOLIA_APP_ID ?? "",
        adminKey: process.env.ALGOLIA_ADMIN_KEY ?? "",
        searchKey: process.env.ALGOLIA_SEARCH_KEY ?? "",
        indexName: process.env.ALGOLIA_INDEX ?? "products",
        timeoutMs: Number(process.env.ALGOLIA_TIMEOUT_MS ?? 5000),
    };
}

let adminClient: ReturnType<typeof algoliasearch> | null = null;
let searchClient: ReturnType<typeof algoliasearch> | null = null;

function clientOptions(timeoutMs: number) {
    return { timeouts: { connect: timeoutMs, read: timeoutMs, write: timeoutMs } };
}

// Admin-nyckeln. Används bara när vi indexerar
function getAdminClient() {
    const { appId, adminKey, timeoutMs } = getConfig();
    adminClient ??= algoliasearch(appId, adminKey, clientOptions(timeoutMs));
    return adminClient;
}

// Söknyckeln får BARA söka
function getSearchClient() {
    const { appId, searchKey, timeoutMs } = getConfig();
    searchClient ??= algoliasearch(appId, searchKey, clientOptions(timeoutMs));
    return searchClient;
}

// En produkt så som shoppen ser ut
export type ShopProduct = {
    id: number;
    sku: string;
    name: string;
    price: number;
    description: string | null;
    image_url: string | null;
    model: string | null;
    size: string | null;
    category: string | null;
    stock_quantity: number;
    variants: string[];
};

// En rad från databasen. 
export type ProductRow = {
    id: number;
    sku: string | null;
    name: string;
    price: string | number;
    description: string | null;
    image_url: string | null;
    model: string | null;
    size: string | null;
    category: string | null;
    stock_quantity: number | null;
    variants: unknown;
};

type AlgoliaRecord = Omit<ShopProduct, "sku"> & { objectID: string };

function parseVariants(value: unknown): string[] {
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed.map(String) : [];
        } catch {
            return [];
        }
    }
    return [];
}

// Databas → Algolia. sku blir objectID: samma sku igen = samma record skrivs över (upsert).
function toRecord(row: ProductRow): AlgoliaRecord | null {
    if (!row.sku) return null;
    return {
        objectID: row.sku,
        id: row.id,
        name: row.name,
        price: Number(row.price),
        description: row.description,
        image_url: row.image_url,
        model: row.model,
        size: row.size,
        category: row.category,
        stock_quantity: Number(row.stock_quantity ?? 0),
        variants: parseVariants(row.variants),
    };
}

/* ---------- 1. INDEXERA (admin-nyckeln) ---------- */

export async function indexProducts(rows: ProductRow[]): Promise<number> {
    const records = rows.map(toRecord).filter((r): r is AlgoliaRecord => r !== null);
    if (records.length === 0) return 0;

    await getAdminClient().saveObjects({
        indexName: getConfig().indexName,
        objects: records,
        waitForTasks: true,
    });
    return records.length;
}

export async function removeProducts(skus: string[]): Promise<void> {
    if (skus.length === 0) return;
    await getAdminClient().deleteObjects({
        indexName: getConfig().indexName,
        objectIDs: skus,
        waitForTasks: true,
    });
}

export async function reindexAll(rows: ProductRow[]): Promise<number> {
    const client = getAdminClient();
    const { indexName } = getConfig();
    const records = rows.map(toRecord).filter((r): r is AlgoliaRecord => r !== null);
    const exists = await client.indexExists({ indexName });
    
    if (exists) {
        await client.replaceAllObjects({ indexName, objects: records });
    } else {
        await client.saveObjects({ indexName, objects: records, waitForTasks: true });
    }

    await client.setSettings({
        indexName,
        indexSettings: {
            searchableAttributes: ["name", "model,category", "sku", "description"],
        },
    });

    return records.length;
}

/* ---------- 2. SÖK (söknyckeln) ---------- */

const AlgoliaHit = z.object({
    objectID: z.string(),
    id: z.number(),
    name: z.string(),
    price: z.number(),
    description: z.string().nullable().optional(),
    image_url: z.string().nullable().optional(),
    model: z.string().nullable().optional(),
    size: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    stock_quantity: z.number().optional(),
    variants: z.array(z.string()).optional(),
});

const AlgoliaSearchResponse = z.object({
    hits: z.array(z.unknown()),
    nbHits: z.number().optional(),
});

export type SearchParams = { q: string; page: number; pageSize: number };

export type SearchResult = {
    data: ShopProduct[];
    meta: { page: number; pageSize: number; total: number; totalPages: number };
};

export async function searchProducts({ q, page, pageSize }: SearchParams): Promise<SearchResult> {
    // 1. Fråga Algolia. Stavfel förlåts.
    const response = await getSearchClient().searchSingleIndex({
        indexName: getConfig().indexName,
        searchParams: {
            query: q,
            page: page - 1,
            hitsPerPage: pageSize,
        },
    });

    // 2. Kontrollera svaret.
    const parsed = AlgoliaSearchResponse.safeParse(response);
    if (!parsed.success) {
        throw new Error(`Algolia svarade med oväntat format:\n${z.prettifyError(parsed.error)}`);
    }

    // 3. Algolias format → vårt. objectID blir sku igen. Trasiga träffar hoppas över.
    const products: ShopProduct[] = [];
    for (const raw of parsed.data.hits) {
        const hit = AlgoliaHit.safeParse(raw);
        if (!hit.success) {
            console.warn("Sök: hoppar över en träff med oväntat format:", z.prettifyError(hit.error));
            continue;
        }
        const h = hit.data;
        products.push({
            id: h.id,
            sku: h.objectID,
            name: h.name,
            price: h.price,
            description: h.description ?? null,
            image_url: h.image_url ?? null,
            model: h.model ?? null,
            size: h.size ?? null,
            category: h.category ?? null,
            stock_quantity: h.stock_quantity ?? 0,
            variants: h.variants ?? [],
        });
    }

    const total = parsed.data.nbHits ?? 0;
    return {
        data: products,
        meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
}
