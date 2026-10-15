// Shoppens regler för en importerad produkt
// Samma schema för CSV och XML, eftersom adaptern redan har gjort om båda till samma format (ProductCandidate).


import { z } from "zod";
import type { ProductCandidate } from "../integrations/supplierAdapter.js";

export const ImportedProduct = z.object({
    sku: z.string().min(1).max(50),
    ean: z.string().regex(/^\d{13}$/, "EAN ska vara exakt 13 siffror"),
    name: z.string().min(1).max(255),
    category: z.string().min(1).max(100),
    price: z.number().positive(),
    stock_quantity: z.number().int().nonnegative(),
    variants: z.array(z.string().min(1)),
});

export type ImportedProduct = z.infer<typeof ImportedProduct>;

const FIELD_LABELS: Record<string, string> = {
    sku: "artikelnummer",
    ean: "EAN",
    name: "namn",
    category: "kategori",
    price: "pris",
    stock_quantity: "lagersaldo",
    variants: "varianter",
};

export type ValidationResult =
    | { ok: true; product: ImportedProduct }
    | { ok: false; reason: string; details: string };

export function validateCandidate(candidate: ProductCandidate): ValidationResult {
    const result = ImportedProduct.safeParse(candidate);

    if (result.success) {
        return { ok: true, product: result.data };
    }

    const fields = [...new Set(result.error.issues.map((issue) => String(issue.path[0] ?? "okänt fält")))];
    const reason = "Ogiltigt värde i: " + fields.map((f) => FIELD_LABELS[f] ?? f).join(", ");

    return { ok: false, reason, details: z.prettifyError(result.error) };
}
