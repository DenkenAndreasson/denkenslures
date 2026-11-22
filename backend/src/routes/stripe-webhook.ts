import express, { Router } from "express";
import { sendOrderConfirmation } from "../integrations/emailAdapter.js";
import { parseWebhook } from "../integrations/paymentAdapter.js";
import { getOrderConfirmation, markOrderCancelled, markOrderPaid } from "../lib/orders.js";
import { syncProducts } from "../lib/searchSync.js";

const router = Router();

// Ordern är redan betald när mejlet skickas. Ett fel här loggas men ger inte 500,
// för då skickar Stripe händelsen igen och ordern är redan hanterad.
async function sendConfirmationEmail(orderId: number) {
    try {
        const order = await getOrderConfirmation(orderId);
        const emailId = await sendOrderConfirmation(order);
        console.log(`Webhook: orderbekräftelse för order ${orderId} skickad (Resend-id ${emailId}).`);
    } catch (err) {
        console.error(`Webhook: kunde inte skicka orderbekräftelse för order ${orderId}:`, err);
    }
}

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
                // Före sökindexet: kastar syncProducts blir det 500, och vid omskicket är ordern
                // redan betald, så mejlet skulle aldrig skickas. Väntar in mejlet eftersom
                // Vercel kan frysa funktionen så fort svaret har skickats.
                await sendConfirmationEmail(event.orderId);
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
