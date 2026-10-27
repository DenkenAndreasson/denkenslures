import express, { Router } from "express";
import { parseWebhook } from "../integrations/paymentAdapter.js";
import { markOrderCancelled, markOrderPaid } from "../lib/orders.js";
import { syncProducts } from "../lib/searchSync.js";

const router = Router();

// POST /api/stripe/webhook – anropas av STRIPE, aldrig av React.
//
// express.raw: behåll bodyn som råa bytes. Signaturen är beräknad på exakt de bytes Stripe skickade.
// Efter express.json() är de borta och kontrollen misslyckas alltid.
// Därför registreras den här routern FÖRE app.use(express.json()) i app.ts.
router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
    // 1. Koll att anrop kommer från Stripe
    const signature = req.headers["stripe-signature"];
    if (typeof signature !== "string" || !Buffer.isBuffer(req.body)) {
        res.status(400).send("Saknar Stripe-signatur.");
        return;
    }

    let event;
    try {
        event = parseWebhook(req.body, signature);
    } catch (err) {
        console.warn("Webhook: ogiltig signatur:", (err as Error).message);
        res.status(400).send("Ogiltig signatur.");
        return;
    }

    // 2. Uppdatera ordern. Kastar databasen svarar vi 500, då skickar Stripe händelsen igen senare.
    try {
        if (event.type === "paid") {
            const productIds = await markOrderPaid(event.orderId);
            if (productIds) {
                console.log(`Webhook: order ${event.orderId} är betald (${(event.amountOre ?? 0) / 100} kr).`);
                // Lagersaldot har ändrats, så sökindexet ska också uppdateras.
                await syncProducts("id", productIds);
            } else {
                console.log(`Webhook: order ${event.orderId} var redan hanterad, ingenting ändrat.`);
            }
        } else if (event.type === "expired") {
            const cancelled = await markOrderCancelled(event.orderId);
            console.log(`Webhook: session för order ${event.orderId} löpte ut. ${cancelled ? "Avbruten." : "Ingenting ändrat."}`);
        } else {
            console.log(`Webhook: ignorerar ${event.stripeType}.`);
        }
    } catch (err) {
        console.error("Webhook: kunde inte uppdatera ordern:", err);
        res.status(500).send("Kunde inte uppdatera ordern.");
        return;
    }

    // 3. Svara 200 snabbt. Annars tror Stripe att leveransen misslyckades och skickar igen.
    res.json({ received: true });
});

export default router;
