// Orderbekräftelser via Resend. Bara den här filen känner till Resends adress och nyckel.

import { z } from "zod";
import { fetchWithTimeout } from "../lib/fetchWithTimeouts.js";

const SEND_URL = "https://api.resend.com/emails";

export type OrderConfirmation = {
    orderId: number;
    customer_name: string;
    customer_email: string;
    lines: { name: string; price: number; quantity: number }[];
    shipping_price: number;
    total: number;
};

// Läses när de behövs, inte när filen laddas.
// Saknas nyckeln kraschar inte hela servern, bara mejlet misslyckas.
function getConfig() {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from) {
        throw new Error("RESEND_API_KEY eller EMAIL_FROM saknas i .env.");
    }
    return {
        apiKey,
        from,
        timeoutMs: Number(process.env.RESEND_TIMEOUT_MS ?? 5000),
    };
}

const ResendSendResponse = z.object({
    id: z.string().min(1),
});

// Kundens namn och produktnamnen kommer från formulär och import, får inte tolkas som HTML.
function escapeHtml(text: string) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatKronor(amount: number) {
    return `${amount.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`;
}

function buildText(order: OrderConfirmation) {
    const lines = order.lines.map(
        (line) => `${line.quantity} st ${line.name} à ${formatKronor(line.price)} = ${formatKronor(line.price * line.quantity)}`
    );
    return [
        `Hej ${order.customer_name}!`,
        "",
        `Tack för din beställning. Vi har tagit emot betalningen för order #${order.orderId}.`,
        "",
        ...lines,
        `Frakt: ${formatKronor(order.shipping_price)}`,
        "",
        `Totalt: ${formatKronor(order.total)}`,
    ].join("\n");
}

function buildHtml(order: OrderConfirmation) {
    const rows = order.lines
        .map(
            (line) => `<tr>
    <td style="padding:4px 8px">${escapeHtml(line.name)}</td>
    <td style="padding:4px 8px;text-align:right">${line.quantity} st</td>
    <td style="padding:4px 8px;text-align:right">${formatKronor(line.price)}</td>
    <td style="padding:4px 8px;text-align:right">${formatKronor(line.price * line.quantity)}</td>
</tr>`
        )
        .join("\n");

    return `<!doctype html>
<html lang="sv">
<body style="font-family:Arial,sans-serif;color:#222">
<p>Hej ${escapeHtml(order.customer_name)}!</p>
<p>Tack för din beställning. Vi har tagit emot betalningen för order <strong>#${order.orderId}</strong>.</p>
<table style="border-collapse:collapse">
<thead>
<tr>
    <th style="padding:4px 8px;text-align:left">Produkt</th>
    <th style="padding:4px 8px;text-align:right">Antal</th>
    <th style="padding:4px 8px;text-align:right">Pris</th>
    <th style="padding:4px 8px;text-align:right">Summa</th>
</tr>
</thead>
<tbody>
${rows}
<tr>
    <td style="padding:4px 8px" colspan="3">Frakt</td>
    <td style="padding:4px 8px;text-align:right">${formatKronor(order.shipping_price)}</td>
</tr>
<tr>
    <td style="padding:4px 8px" colspan="3"><strong>Totalt</strong></td>
    <td style="padding:4px 8px;text-align:right"><strong>${formatKronor(order.total)}</strong></td>
</tr>
</tbody>
</table>
</body>
</html>`;
}

// Returnerar Resends id för mejlet.
export async function sendOrderConfirmation(order: OrderConfirmation): Promise<string> {
    const { apiKey, from, timeoutMs } = getConfig();

    const response = await fetchWithTimeout(SEND_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            // Samma nyckel för samma order, så Resend skickar inte ett andra mejl om ordern bekräftas igen.
            "Idempotency-Key": `order-confirmation/${order.orderId}`,
        },
        body: JSON.stringify({
            from,
            to: [order.customer_email],
            subject: `Orderbekräftelse för order #${order.orderId}`,
            html: buildHtml(order),
            text: buildText(order),
        }),
        timeoutMs,
    });

    const sent = ResendSendResponse.safeParse(await response.json());
    if (!sent.success) {
        throw new Error(`Resend svarade med oväntat format:\n${z.prettifyError(sent.error)}`);
    }
    return sent.data.id;
}
