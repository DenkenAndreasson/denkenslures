import { Router } from "express";
import { pool } from "./db.js";
import { syncProducts, unsyncProducts } from "./lib/searchSync.js";

const router = Router();

// GET /api/products - hämta alla produkter
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM products");
        res.json(rows);
    } catch (err) {
        console.error("GET /api/products:", err);
        res.status(500).json({ error: "Kunde inte hämta produkterna." });
    }
});

// GET /api/products/:id - hämta en produkt
router.get("/:id", async (req, res) => {
    try {
        const [rows]: any = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id]);

        if (rows.length === 0) {
            res.status(404).json({ error: "Produkten hittades inte" });
            return;
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("GET /api/products/:id:", err);
        res.status(500).json({ error: "Kunde inte hämta produkten." });
    }
});

// POST /api/products - skapa produkt
router.post("/", async (req, res) => {
    const { name, price, description, image_url, model, size, stock_quantity } = req.body;
    const sku = typeof req.body.sku === "string" ? req.body.sku.trim() : "";

    if (!sku) {
        res.status(400).json({ error: "Artikelnummer (sku) måste fyllas i." });
        return;
    }

    let id: number;
    try {
        const [result]: any = await pool.query(
            `INSERT INTO products (sku, name, price, description, image_url, model, size, stock_quantity)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [sku, name, price, description, image_url, model, size, stock_quantity]
        );
        id = result.insertId;
    } catch (err: any) {
        if (err?.code === "ER_DUP_ENTRY") {
            res.status(409).json({ error: `Artikelnumret ${sku} finns redan.` });
            return;
        }
        console.error("POST /api/products:", err);
        res.status(500).json({ error: "Kunde inte skapa produkten." });
        return;
    }

    const searchIndexed = await syncProducts("id", [id]);
    res.status(201).json({ id, sku, name, price, description, image_url, model, size, stock_quantity, searchIndexed });
});

// PUT /api/products/:id - redigera produkt
router.put("/:id", async (req, res) => {
    const { name, price, description, model, size, stock_quantity } = req.body;

    try {
        const [result]: any = await pool.query(
            `UPDATE products
             SET name = ?, price = ?, description = ?, model = ?, size = ?, stock_quantity = ?
             WHERE id = ?`,
            [name, price, description, model, size, stock_quantity, req.params.id]
        );

        if (result.affectedRows === 0) {
            res.status(404).json({ error: "Produkten hittades inte" });
            return;
        }
    } catch (err) {
        console.error("PUT /api/products/:id:", err);
        res.status(500).json({ error: "Kunde inte uppdatera produkten." });
        return;
    }

    const searchIndexed = await syncProducts("id", [Number(req.params.id)]);
    res.json({ id: Number(req.params.id), name, price, description, model, size, stock_quantity, searchIndexed });
});

// DELETE /api/products/:id - ta bort produkt
router.delete("/:id", async (req, res) => {
    let sku: string | null;

    try {
        const [rows]: any = await pool.query("SELECT sku FROM products WHERE id = ?", [req.params.id]);
        if (rows.length === 0) {
            res.status(404).json({ error: "Produkten hittades inte" });
            return;
        }
        sku = rows[0].sku;

        await pool.query("DELETE FROM products WHERE id = ?", [req.params.id]);
    } catch (err: any) {
        if (err?.code === "ER_ROW_IS_REFERENCED_2") {
            res.status(409).json({ error: "Produkten finns i en order och kan inte tas bort." });
            return;
        }
        console.error("DELETE /api/products/:id:", err);
        res.status(500).json({ error: "Kunde inte ta bort produkten." });
        return;
    }

    const searchIndexed = sku ? await unsyncProducts([sku]) : true;
    res.json({ deleted: true, searchIndexed });
});

export default router;
