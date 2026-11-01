import { Router } from "express";
import { z } from "zod";
import { estimateDelivery, findServicePoints } from "../integrations/shippingAdapter.js";
import { CartError, calculateGoodsValue } from "../lib/orders.js";
import { calculateShippingPrice, FREE_SHIPPING_THRESHOLD } from "../lib/shipping.js";
import { PostalCode } from "../validation/postalCode.js";

const router = Router();

const ShippingQuoteBody = z.object({
    postal_code: PostalCode,
    items: z
        .array(
            z.object({
                product_id: z.number().int().positive(),
                quantity: z.number().int().min(1, "Minst 1 st").max(99, "Max 99 st per produkt"),
            })
        )
        .min(1, "Varukorgen är tom"),
});

function errorMessage(err: unknown): string {
    return err instanceof Error ? err.message : "Okänt fel";
}

router.post("/quote", async (req, res) => {
    const body = ShippingQuoteBody.safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: "Ogiltig beställning.", details: z.prettifyError(body.error) });
        return;
    }

    const { postal_code, items } = body.data;
    let goodsValue: number;
    try {
        goodsValue = await calculateGoodsValue(items);
    } catch (err) {
        if (err instanceof CartError) {
            res.status(400).json({ error: err.message });
            return;
        }
        console.error("POST /api/shipping/quote (goods value):", errorMessage(err));
        res.status(500).json({ error: "Kunde inte beräkna varuvärdet." });
        return;
    }

    const [servicePointsResult, deliveryResult] = await Promise.allSettled([
        findServicePoints(postal_code),
        estimateDelivery(postal_code),
    ]);

    let servicePoints = null;
    if (servicePointsResult.status === "fulfilled") {
        servicePoints = servicePointsResult.value;
    } else {
        console.error("POST /api/shipping/quote (service points):", errorMessage(servicePointsResult.reason));
    }

    let delivery = null;
    if (deliveryResult.status === "fulfilled") {
        delivery = deliveryResult.value;
    } else {
        console.error("POST /api/shipping/quote (delivery estimate):", errorMessage(deliveryResult.reason));
    }

    res.status(200).json({
        goods_value: goodsValue,
        free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
        prices: {
            pickup_point: calculateShippingPrice("pickup_point", goodsValue),
            home_delivery: calculateShippingPrice("home_delivery", goodsValue),
        },
        service_points: servicePoints,
        delivery,
    });
});

export default router;
