import { pool } from "../db.js";
import { indexProducts, removeProducts, type ProductRow } from "../integrations/searchAdapter.js";

export async function syncProducts(column: "id" | "sku", values: (number | string)[]): Promise<boolean> {
    if (values.length === 0) return true;

    try {
        const [rows] = await pool.query(`SELECT * FROM products WHERE ${column} IN (?)`, [values]);
        await indexProducts(rows as ProductRow[]);
        return true;
    } catch (err) {
        console.warn(`Sökindex: kunde inte uppdatera (${column}: ${values.join(", ")}):`, err);
        return false;
    }
}

export async function unsyncProducts(skus: string[]): Promise<boolean> {
    try {
        await removeProducts(skus);
        return true;
    } catch (err) {
        console.warn(`Sökindex: kunde inte ta bort ${skus.join(", ")}:`, err);
        return false;
    }
}
