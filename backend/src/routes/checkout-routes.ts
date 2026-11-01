import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { createCheckoutSession, type PaymentLine } from "../integrations/paymentAdapter.js";
import { findServicePoints } from "../integrations/shippingAdapter.js";
import { CartError, createPendingOrder, saveStripeSession } from "../lib/orders.js";
import { SHIPPING_METHODS } from "../lib/shipping.js";
import { PostalCode } from "../validation/postalCode.js";

const router = Router();

const CheckoutBody = z.object({
    customer_name: z.string().trim().min(1, "Fyll i namn").max(255),
    customer_email: z.email("Ogiltig e-postadress").max(255),
    address: z.string().trim().min(1, "Fyll i adress").max(255),
    postal_code: PostalCode,
    city: z.string().trim().min(1, "Fyll i ort").max(100),
    shipping_method: z.enum(SHIPPING_METHODS),
    items: z
        .array(
            z.object({
                product_id: z.number().int().positive(),
                quantity: z.number().int().min(1, "Minst 1 st").max(99, "Max 99 st per produkt"),
            })
        )
        .min(1, "Varukorgen är tom"),
});

// POST /api/checkout → { orderId, clientSecret }
// 1. validera  2. priser + saldo från databasen  3. spara ordern  4. skapa betalningen hos Stripe
router.post("/", async (req, res) => {
    const body = CheckoutBody.safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: "Ogiltig beställning.", details: z.prettifyError(body.error) });
        return;
    }
    const { items, shipping_method, ...customer } = body.data;

    let pickupPoint: { id: string; name: string; address: string } | undefined;
    if (shipping_method === "pickup_point") {
        const pickupPointIdInput: unknown = req.body?.pickup_point_id;
        if (typeof pickupPointIdInput !== "string" || !pickupPointIdInput.trim()) {
            res.status(400).json({ error: "Välj ett ombud för upphämtning." });
            return;
        }
        const pickup_point_id = pickupPointIdInput.trim();
        if (pickup_point_id.length > 50) {
            res.status(400).json({ error: "Ombuds-id får vara högst 50 tecken." });
            return;
        }

        let servicePoints;
        try {
            servicePoints = await findServicePoints(customer.postal_code);
        } catch (err) {
            console.error(
                "POST /api/checkout (service points):",
                err instanceof Error ? err.message : String(err)
            );
            res.status(502).json({
                error: "Vi kan inte kontrollera ombudet just nu. Försök igen eller välj hemleverans.",
            });
            return;
        }

        const selectedPoint = servicePoints.find((point) => point.id === pickup_point_id);
        if (!selectedPoint) {
            res.status(400).json({
                error: "Det valda ombudet finns inte för det här postnumret. Välj ett ombud i listan.",
            });
            return;
        }
        pickupPoint = {
            id: selectedPoint.id,
            name: selectedPoint.name,
            address: selectedPoint.address,
        };
    }

    let order;
    try {
        order = await createPendingOrder(customer, items, shipping_method, pickupPoint);
    } catch (err) {
        if (err instanceof CartError) {
            res.status(400).json({ error: err.message });
            return;
        }
        console.error("POST /api/checkout (order):", err);
        res.status(500).json({ error: "Kunde inte skapa ordern." });
        return;
    }

    try {
        const paymentLines: PaymentLine[] = [...order.lines];
        if (order.shipping_price > 0) {
            paymentLines.push({
                name: shipping_method === "pickup_point" ? "Frakt: ombud" : "Frakt: hemleverans",
                price: order.shipping_price,
                quantity: 1,
            });
        }
        const payment = await createCheckoutSession(order.orderId, paymentLines, customer.customer_email);
        // Sessionens id sparas på ordern
        await saveStripeSession(order.orderId, payment.sessionId);
        res.status(201).json({ orderId: order.orderId, clientSecret: payment.clientSecret });
    } catch (err) {
        // Ordern finns kvar som pending (obetald). Den markeras aldrig som betald utan signal av webhooken.
        console.error(`POST /api/checkout: Stripe svarade inte (order ${order.orderId}):`, (err as Error).message);
        res.status(502).json({ error: "Betaltjänsten svarar inte just nu. Ingenting har dragits. Försök igen om en stund." });
    }
});

// GET /api/checkout/session/:sessionId → ordern och dess status
router.get("/session/:sessionId", async (req, res) => {
    try {
        const [orders]: any = await pool.query(
            `SELECT id, customer_name, status, total, created_at, paid_at,
                    shipping_method, shipping_price, pickup_point_name, pickup_point_address
             FROM orders WHERE stripe_session_id = ?`,
            [req.params.sessionId]
        );
        if (orders.length === 0) {
            res.status(404).json({ error: "Ordern hittades inte." });
            return;
        }

        const [items] = await pool.query(
            `SELECT order_items.product_id, order_items.quantity, order_items.price_at_purchase, products.name
             FROM order_items
             JOIN products ON products.id = order_items.product_id
             WHERE order_items.order_id = ?`,
            [orders[0].id]
        );

        res.json({ ...orders[0], items });
    } catch (err) {
        console.error("GET /api/checkout/session:", err);
        res.status(500).json({ error: "Kunde inte hämta ordern." });
    }
});

export default router;
