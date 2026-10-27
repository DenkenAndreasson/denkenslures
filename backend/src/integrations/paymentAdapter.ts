//   1. Vår server → Stripe: timeout 10 s per försök i Stripe-klienten nedan. Kastar vid fel,
//      och routen svarar 502 med ett begripligt meddelande. Ordern förblir obetald.
//   2. Kunden betalar: sessionen löper ut efter SESSION_MINUTES. Då skickar Stripe checkout.session.expired.
//   3. Stripe → vår webhook: Stripe väntar på vårt svar. Svara snabbt med 200, annars skickar Stripe igen.

import Stripe from "stripe";

export type PaymentLine = {
    name: string;
    price: number;
    quantity: number;
};

const SESSION_MINUTES = 60;

function getConfig() {
    return {
        secretKey: process.env.STRIPE_SECRET_KEY ?? "",
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
        clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
    };
}

// Klienten skapas första gången den behövs, inte när filen laddas.
// Saknas nyckeln kraschar alltså inte hela servern, bara betalningen svarar med fel.
let stripe: Stripe | null = null;

function getStripe() {
    const { secretKey } = getConfig();
    if (!secretKey) {
        throw new Error("STRIPE_SECRET_KEY saknas i .env.");
    }
    stripe ??= new Stripe(secretKey, { timeout: 10_000 });
    return stripe;
}

function toOre(kronor: number) {
    return Math.round(kronor * 100);
}

/* ---------- 1. Skapa betalningen (embedded) ---------- */

export async function createCheckoutSession(orderId: number, lines: PaymentLine[], customerEmail: string) {
    const { clientUrl } = getConfig();

    const session = await getStripe().checkout.sessions.create({
        mode: "payment",
        ui_mode: "embedded_page",
        line_items: lines.map((line) => ({
            quantity: line.quantity,
            price_data: {
                currency: "sek",
                unit_amount: toOre(line.price),
                product_data: { name: line.name },
            },
        })),
        client_reference_id: String(orderId),
        customer_email: customerEmail,
        return_url: `${clientUrl}/tack?session_id={CHECKOUT_SESSION_ID}`,
        expires_at: Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60,
    });

    if (!session.client_secret) {
        throw new Error("Stripe skickade ingen client_secret.");
    }

    return { sessionId: session.id, clientSecret: session.client_secret };
}

/* ---------- 2. Webhooken ---------- */

export type PaymentEvent =
    | { type: "paid"; orderId: number; sessionId: string; amountOre: number | null }
    | { type: "expired"; orderId: number; sessionId: string }
    | { type: "ignored"; stripeType: string };


export function parseWebhook(rawBody: Buffer, signature: string): PaymentEvent {
    const { webhookSecret } = getConfig();
    if (!webhookSecret) {
        throw new Error("STRIPE_WEBHOOK_SECRET saknas i .env.");
    }

    const event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type.startsWith("checkout.session.")) {
        const session = event.data.object as { client_reference_id?: string | null };
        if (!session.client_reference_id) {
            return { type: "ignored", stripeType: `${event.type} (utan order-id)` };
        }
    }

    switch (event.type) {
        case "checkout.session.completed":
        case "checkout.session.async_payment_succeeded": {
            const session = event.data.object;
            if (session.payment_status !== "paid") {
                return { type: "ignored", stripeType: `${event.type} (${session.payment_status})` };
            }
            return {
                type: "paid",
                orderId: Number(session.client_reference_id),
                sessionId: session.id,
                amountOre: session.amount_total,
            };
        }
        case "checkout.session.expired": {
            const session = event.data.object;
            return { type: "expired", orderId: Number(session.client_reference_id), sessionId: session.id };
        }
        default:
            return { type: "ignored", stripeType: event.type };
    }
}
