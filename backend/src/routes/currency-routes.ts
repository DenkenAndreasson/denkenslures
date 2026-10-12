import { Router } from "express";
import { getRates } from "../integrations/currencyAdapter.js";

const router = Router();

// GET /api/currency/rates?base=SEK
router.get("/rates", async (req, res) => {
    const base = (req.query.base as string) ?? "SEK";

    try {
        const rates = await getRates(base);
        res.json(rates);
    } catch (err) {
        res.status(502).json({ error: "Kunde inte hämta kurserna just nu." });
    }
});

export default router;