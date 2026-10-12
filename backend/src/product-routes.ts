import { Router } from "express";
import { pool } from "./db.js";

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

    try {
        const [result]: any = await pool.query(
            `INSERT INTO products (name, price, description, image_url, model, size, stock_quantity)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, price, description, image_url, model, size, stock_quantity]
        );

        res.status(201).json({ id: result.insertId, name, price, description, image_url, model, size, stock_quantity });
    } catch (err) {
        console.error("POST /api/products:", err);
        res.status(500).json({ error: "Kunde inte skapa produkten." });
    }
});

// PUT /api/products/:id - redigera produkt
router.put("/:id", async (req, res) => {
    const { name, price, description, image_url, model, size, stock_quantity } = req.body;

    try {
        const [result]: any = await pool.query(
            `UPDATE products
             SET name = ?, price = ?, description = ?, image_url = ?, model = ?, size = ?, stock_quantity = ?
             WHERE id = ?`,
            [name, price, description, image_url, model, size, stock_quantity, req.params.id]
        );

        if (result.affectedRows === 0) {
            res.status(404).json({ error: "Produkten hittades inte" });
            return;
        }

        res.json({ id: Number(req.params.id), name, price, description, image_url, model, size, stock_quantity });
    } catch (err) {
        console.error("PUT /api/products/:id:", err);
        res.status(500).json({ error: "Kunde inte uppdatera produkten." });
    }
});

// DELETE /api/products/:id - ta bort produkt
router.delete("/:id", async (req, res) => {
    try {
        const [result]: any = await pool.query("DELETE FROM products WHERE id = ?", [req.params.id]);

        if (result.affectedRows === 0) {
            res.status(404).json({ error: "Produkten hittades inte" });
            return;
        }

        res.status(204).send();
    } catch (err) {
        console.error("DELETE /api/products/:id:", err);
        res.status(500).json({ error: "Kunde inte ta bort produkten." });
    }
});

export default router;
