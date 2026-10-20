import { Router } from "express";
import { pool } from "../db.js";
import { getSupplierCatalog } from "../integrations/supplierAdapter.js";
import { validateCandidate, type ImportedProduct } from "../validation/importedProduct.js";
import { reindexAll, type ProductRow } from "../integrations/searchAdapter.js";
import { syncProducts } from "../lib/searchSync.js";


const router = Router();

type SkippedProduct = { sku: string | null; name: string | null; reason: string };

// POST /api/admin/products/import/csv
// POST /api/admin/products/import/xml
//
// Stegen: HÄMTA → PARSA → MAPPA (adaptern)  →  VALIDERA → SPARA (här)
router.post("/products/import/:format", async (req, res) => {
    const { format } = req.params;
    if (format !== "csv" && format !== "xml") {
        res.status(400).json({ error: "Formatet måste vara csv eller xml." });
        return;
    }

    let candidates;
    try {
        candidates = await getSupplierCatalog(format);
    } catch (err) {
        console.error(`Import (${format}): kunde inte hämta katalogen:`, err);
        res.status(502).json({ error: "Kunde inte hämta leverantörens katalog just nu. Försök igen om en stund." });
        return;
    }

    const valid: ImportedProduct[] = [];
    const skipped: SkippedProduct[] = [];
    const seenSkus = new Set<string>();

    for (const candidate of candidates) {
        const result = validateCandidate(candidate);

        if (!result.ok) {
            console.warn(`Import (${format}): hoppar över ${candidate.sku ?? "(utan artikelnummer)"}\n${result.details}`);
            skipped.push({ sku: candidate.sku ?? null, name: candidate.name ?? null, reason: result.reason });
            continue;
        }

        // Samma artikelnummer två gånger i samma fil? Då skulle rad 2 tyst skriva över rad 1.
        if (seenSkus.has(result.product.sku)) {
            skipped.push({ sku: result.product.sku, name: result.product.name, reason: "Dubblett av artikelnummer i filen" });
            continue;
        }
        seenSkus.add(result.product.sku);
        valid.push(result.product);
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const existingSkus = new Set<string>();
        if (valid.length > 0) {
            const [rows]: any = await connection.query("SELECT sku FROM products WHERE sku IN (?)", [
                valid.map((p) => p.sku),
            ]);
            for (const row of rows) existingSkus.add(row.sku);
        }

        let created = 0;
        let updated = 0;
        let unchanged = 0;

        for (const p of valid) {
            const [result]: any = await connection.query(
                `INSERT INTO products (sku, ean, name, category, price, stock_quantity, variants)
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                     ean = VALUES(ean),
                     name = VALUES(name),
                     category = VALUES(category),
                     price = VALUES(price),
                     stock_quantity = VALUES(stock_quantity),
                     variants = VALUES(variants)`,
                [p.sku, p.ean, p.name, p.category, p.price, p.stock_quantity, JSON.stringify(p.variants)]
            );

            if (!existingSkus.has(p.sku)) created++;
            else if (result.affectedRows === 2) updated++;
            else unchanged++; 
        }

        await connection.commit();

        const [[{ imported }]]: any = await pool.query(
            "SELECT COUNT(*) AS imported FROM products WHERE sku IS NOT NULL"
        );

        const searchIndexed = await syncProducts("sku", valid.map((p) => p.sku));

        res.json({
            format,
            total: candidates.length,
            created,
            updated,
            unchanged,
            skipped,
            importedInDatabase: Number(imported),
            searchIndexed,
        });
    } catch (err) {
        await connection?.rollback().catch(() => {});
        console.error(`Import (${format}): kunde inte spara i databasen:`, err);
        res.status(500).json({ error: "Importen kunde inte sparas. Inga produkter ändrades." });
    } finally {
        connection?.release();
    }
});

// POST /api/admin/search/reindex
// Skickar alla produkter i databasen till Algolia och sätter indexets inställningar.
// Behövs första gången, efter npm run seed, och när sökindexet har hamnat efter.
router.post("/search/reindex", async (_req, res) => {
    let rows: ProductRow[];
    try {
        const [result] = await pool.query("SELECT * FROM products");
        rows = result as ProductRow[];
    } catch (err) {
        console.error("Reindex: kunde inte läsa databasen:", err);
        res.status(500).json({ error: "Kunde inte läsa produkterna från databasen." });
        return;
    }

    try {
        const indexed = await reindexAll(rows);
        res.json({ indexed, withoutSku: rows.length - indexed });
    } catch (err) {
        console.error("Reindex: kunde inte skicka till Algolia:", err);
        res.status(502).json({ error: "Kunde inte nå söktjänsten. Försök igen om en stund." });
    }
});

export default router;
