import "dotenv/config";
import { pool } from "../db.js";

//   npm run migrate
const COLUMNS: Record<string, Record<string, string>> = {
    products: {
        sku: "VARCHAR(50) NULL UNIQUE",
        ean: "VARCHAR(13) NULL",
        category: "VARCHAR(100) NULL",
        variants: "JSON NULL",
        image_path: "VARCHAR(255) NULL",
    },
    orders: {
        status: "ENUM('pending', 'paid', 'cancelled') NOT NULL DEFAULT 'pending'",
        stripe_session_id: "VARCHAR(255) NULL UNIQUE",
        total: "DECIMAL(10, 2) NULL",
        paid_at: "DATETIME NULL",
        shipping_method: "ENUM('pickup_point', 'home_delivery') NULL",
        shipping_price: "DECIMAL(10, 2) NULL",
        pickup_point_id: "VARCHAR(50) NULL",
        pickup_point_name: "VARCHAR(255) NULL",
        pickup_point_address: "VARCHAR(255) NULL",
        customer_id: "INT NULL, ADD FOREIGN KEY (customer_id) REFERENCES customers(id)",
    },
};

async function migrate() {
    // e-post är inte UNIQUE: kunden känns igen på google_sub, och konton slås inte ihop på e-post.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS customers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            google_sub VARCHAR(255) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL,
            name VARCHAR(255) NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log("+ customers finns");

    for (const [table, columns] of Object.entries(COLUMNS)) {
        const [rows]: any = await pool.query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
            [table]
        );
        const existing = new Set(rows.map((r: any) => r.COLUMN_NAME));

        for (const [name, definition] of Object.entries(columns)) {
            if (existing.has(name)) {
                console.log(`- ${table}.${name} finns redan, hoppar över`);
                continue;
            }
            await pool.query(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
            console.log(`+ ${table}.${name} tillagd`);
        }
    }

    await pool.end();
}

migrate().catch((err) => {
    console.error("Migreringen misslyckades:", err);
    process.exit(1);
});
