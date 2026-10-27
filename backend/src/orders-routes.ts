import { Router } from "express";
import { pool } from "./db.js";

const router = Router();

// GET /api/orders - lista alla ordrar, nyaste först
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
        res.json(rows);
    } catch (err) {
        console.error("GET /api/orders:", err);
        res.status(500).json({ error: "Kunde inte hämta ordrarna." });
    }
});

// GET /api/orders/:id - en order med sina orderrader (produktnamn joinat in)
router.get("/:id", async (req, res) => {
    try {
        const [orderRows]: any = await pool.query("SELECT * FROM orders WHERE id = ?", [req.params.id]);

        if (orderRows.length === 0) {
            res.status(404).json({ error: "Ordern hittades inte" });
            return;
        }

        const [items] = await pool.query(
            `SELECT order_items.id, order_items.product_id, order_items.quantity, order_items.price_at_purchase, products.name
             FROM order_items
             JOIN products ON products.id = order_items.product_id
             WHERE order_items.order_id = ?`,
            [req.params.id]
        );

        res.json({ ...orderRows[0], items });
    } catch (err) {
        console.error("GET /api/orders/:id:", err);
        res.status(500).json({ error: "Kunde inte hämta ordern." });
    }
});

export default router;
