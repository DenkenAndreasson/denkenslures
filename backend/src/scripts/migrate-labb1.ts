import "dotenv/config";
import { pool } from "../db.js";

const COLUMNS: Record<string, string> = {
    sku: "VARCHAR(50) NULL UNIQUE",
    ean: "VARCHAR(13) NULL",
    category: "VARCHAR(100) NULL",
    variants: "JSON NULL",
};

async function migrate() {
    const [rows]: any = await pool.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products'`
    );
    const existing = new Set(rows.map((r: any) => r.COLUMN_NAME));

    for (const [name, definition] of Object.entries(COLUMNS)) {
        if (existing.has(name)) {
            console.log(`- ${name} finns redan, hoppar över`);
            continue;
        }
        await pool.query(`ALTER TABLE products ADD COLUMN ${name} ${definition}`);
        console.log(`+ ${name} tillagd`);
    }

    await pool.end();
}

migrate().catch((err) => {
    console.error("Migreringen misslyckades:", err);
    process.exit(1);
});
