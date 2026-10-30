// TIMEOUT OCH FEL:
//   Varje anrop till Supabase ger upp efter TIMEOUT_MS (vår egen fetch i createClient nedan).
//   supabase-js kastar inte vid fel, den svarar { data, error }. Vi kollar error och kastar ett eget fel.
//   Routen fångar felet och svarar 502. Produkten behåller sin gamla bild.

import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type ImageType = "image/jpeg" | "image/png";

const EXTENSIONS: Record<ImageType, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
};

function getConfig() {
    return {
        url: process.env.SUPABASE_URL ?? "",
        secretKey: process.env.SUPABASE_SECRET_KEY ?? "",
        bucket: process.env.SUPABASE_BUCKET ?? "product-images",
        timeoutMs: Number(process.env.SUPABASE_TIMEOUT_MS ?? 10000),
    };
}

let supabase: SupabaseClient | null = null;

function getClient() {
    const { url, secretKey, timeoutMs } = getConfig();
    if (!url || !secretKey) {
        throw new Error("SUPABASE_URL eller SUPABASE_SECRET_KEY saknas i .env.");
    }
    supabase ??= createClient(url, secretKey, {
        global: {
            fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(timeoutMs) }),
        },
    });
    return supabase;
}

/* ---------- Ladda upp ---------- */

// Varje bild får en ny unik sökväg: products/<produktens id>/<slumpat uuid>.<jpg|png>
export async function uploadProductImage(productId: number, image: { buffer: Buffer; type: ImageType }) {
    const { bucket } = getConfig();
    const path = `products/${productId}/${randomUUID()}.${EXTENSIONS[image.type]}`;

    const { error } = await getClient().storage.from(bucket).upload(path, image.buffer, {
        contentType: image.type,
        upsert: false,
    });
    if (error) {
        throw new Error(`Supabase: kunde inte ladda upp ${path}: ${error.message}`);
    }

    const { data } = getClient().storage.from(bucket).getPublicUrl(path);

    return { path, url: data.publicUrl };
}

/* ---------- Ta bort ---------- */

export async function removeProductImage(path: string) {
    const { bucket } = getConfig();
    const { error } = await getClient().storage.from(bucket).remove([path]);
    if (error) {
        throw new Error(`Supabase: kunde inte ta bort ${path}: ${error.message}`);
    }
}
