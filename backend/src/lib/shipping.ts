// Shoppens egen prislista för frakt. Alla belopp är i kronor.

export const SHIPPING_METHODS = ["pickup_point", "home_delivery"] as const;

export type ShippingMethod = (typeof SHIPPING_METHODS)[number];

export const SHIPPING_PRICES: Record<ShippingMethod, number> = {
    pickup_point: 59,
    home_delivery: 99,
};

export const FREE_SHIPPING_THRESHOLD = 500;

export function calculateShippingPrice(method: ShippingMethod, goodsValue: number): number {
    // Jämförs i ören. Summan av flera priser kan annars bli t.ex. 499.99999999 i stället för 500.
    if (Math.round(goodsValue * 100) >= FREE_SHIPPING_THRESHOLD * 100) {
        return 0;
    }
    return SHIPPING_PRICES[method];
}
