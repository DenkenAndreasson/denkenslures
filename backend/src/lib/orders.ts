import type { PoolConnection } from "mysql2/promise";
import { pool } from "../db.js";
import { calculateShippingPrice, type ShippingMethod } from "./shipping.js";

export type CartLine = { product_id: number; quantity: number };

export type Customer = {
    customer_name: string;
    customer_email: string;
    address: string;
    postal_code: string;
    city: string;
};

export type PickupPoint = { id: string; name: string; address: string };

// En orderrad med VÅRT namn och pris från databasen.
export type OrderLine = { product_id: number; name: string; price: number; quantity: number };

export class CartError extends Error {}

/* ---------- Skapa ordern (innan kunden skickas till Stripe) ---------- */

function mergeLines(cart: CartLine[]): CartLine[] {
    const merged = new Map<number, number>();
    for (const line of cart) {
        merged.set(line.product_id, (merged.get(line.product_id) ?? 0) + line.quantity);
    }
    return [...merged].map(([product_id, quantity]) => ({ product_id, quantity }));
}
async function priceCart(conn: PoolConnection, cart: CartLine[]): Promise<OrderLine[]> {
    const lines = mergeLines(cart);
    const [rows]: any = await conn.query(
        "SELECT id, name, price, stock_quantity FROM products WHERE id IN (?)",
        [lines.map((line) => line.product_id)]
    );

    return lines.map((line) => {
        const product = rows.find((row: any) => row.id === line.product_id);
        if (!product) {
            throw new CartError(`Produkten med id ${line.product_id} finns inte längre.`);
        }
        if (Number(product.stock_quantity ?? 0) < line.quantity) {
            throw new CartError(`Det finns bara ${product.stock_quantity ?? 0} st kvar av ${product.name}.`);
        }
        return { product_id: product.id, name: product.name, price: Number(product.price), quantity: line.quantity };
    });
}

export async function calculateGoodsValue(cart: CartLine[]): Promise<number> {
    const conn = await pool.getConnection();
    try {
        const lines = await priceCart(conn, cart);
        return lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
    } finally {
        conn.release();
    }
}

export async function createPendingOrder(
    customer: Customer,
    cart: CartLine[],
    shippingMethod: ShippingMethod,
    pickupPoint?: PickupPoint,
) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const lines = await priceCart(conn, cart);
        const goodsValue = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
        const shippingPrice = calculateShippingPrice(shippingMethod, goodsValue);
        const total = goodsValue + shippingPrice;

        const [result]: any = await conn.query(
            `INSERT INTO orders (
                customer_name, customer_email, address, postal_code, city, status, total,
                shipping_method, shipping_price, pickup_point_id, pickup_point_name, pickup_point_address
             ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
            [
                customer.customer_name,
                customer.customer_email,
                customer.address,
                customer.postal_code,
                customer.city,
                total,
                shippingMethod,
                shippingPrice,
                pickupPoint?.id ?? null,
                pickupPoint?.name ?? null,
                pickupPoint?.address ?? null,
            ]
        );
        const orderId: number = result.insertId;

        await conn.query(
            "INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ?",
            [lines.map((line) => [orderId, line.product_id, line.quantity, line.price])]
        );

        await conn.commit();
        return { orderId, lines, total, shipping_price: shippingPrice };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

export async function saveStripeSession(orderId: number, sessionId: string) {
    await pool.query("UPDATE orders SET stripe_session_id = ? WHERE id = ?", [sessionId, orderId]);
}


export async function markOrderPaid(orderId: number): Promise<number[] | null> {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [result]: any = await conn.query(
            "UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = ? AND status = 'pending'",
            [orderId]
        );
        if (result.affectedRows === 0) {
            await conn.rollback();
            return null;
        }

        await conn.query(
            `UPDATE products
             JOIN order_items ON order_items.product_id = products.id
             SET products.stock_quantity = products.stock_quantity - order_items.quantity
             WHERE order_items.order_id = ?`,
            [orderId]
        );

        const [items]: any = await conn.query("SELECT product_id FROM order_items WHERE order_id = ?", [orderId]);

        await conn.commit();
        return items.map((item: any) => item.product_id);
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

export async function markOrderCancelled(orderId: number): Promise<boolean> {
    const [result]: any = await pool.query(
        "UPDATE orders SET status = 'cancelled' WHERE id = ? AND status = 'pending'",
        [orderId]
    );
    return result.affectedRows === 1;
}
