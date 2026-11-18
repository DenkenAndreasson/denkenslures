import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// GET /api/account/orders → den inloggade kundens ordrar med orderrader, nyaste först
router.get("/orders", async (req, res) => {
    const customerId = req.session.customerId;
    if (!customerId) {
        res.status(401).json({ error: "Du måste logga in för att se dina beställningar." });
        return;
    }

    try {
        const [orders]: any = await pool.query(
            `SELECT id, status, total, created_at, paid_at, shipping_method, shipping_price,
                    pickup_point_name, pickup_point_address
             FROM orders WHERE customer_id = ? ORDER BY created_at DESC`,
            [customerId]
        );
        if (orders.length === 0) {
            res.json([]);
            return;
        }

        const [items]: any = await pool.query(
            `SELECT order_items.order_id, order_items.product_id, order_items.quantity,
                    order_items.price_at_purchase, products.name
             FROM order_items
             JOIN products ON products.id = order_items.product_id
             WHERE order_items.order_id IN (?)`,
            [orders.map((order: any) => order.id)]
        );

        res.json(
            orders.map((order: any) => ({
                ...order,
                items: items.filter((item: any) => item.order_id === order.id),
            }))
        );
    } catch (err) {
        console.error("GET /api/account/orders:", err);
        res.status(500).json({ error: "Kunde inte hämta dina beställningar." });
    }
});

export default router;
