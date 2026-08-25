import { Router } from "express";
import { pool } from "./db.js";

const router = Router();

// GET /api/orders - lista alla ordrar, nyaste först
router.get("/", async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    res.json(rows);
});

// GET /api/orders/:id - en order med sina orderrader (produktnamn joinat in)
router.get("/:id", async (req, res) => {
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
});

// POST /api/orders - skapa order + orderrader utifrån varukorgens innehåll
router.post("/", async (req, res) => {
    const { customer_name, customer_email, address, postal_code, city, items } = req.body;

    const [result]: any = await pool.query(
        `INSERT INTO orders (customer_name, customer_email, address, postal_code, city)
         VALUES (?, ?, ?, ?, ?)`,
        [customer_name, customer_email, address, postal_code, city]
    );

    const orderId = result.insertId;

    const orderItems = items.map((item: any) => [
        orderId,
        item.product_id,
        item.quantity,
        item.price_at_purchase,
    ]);

    await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ?`,
        [orderItems]
    );

    res.status(201).json({ id: orderId, customer_name, customer_email, address, postal_code, city, items });
});

export default router;
