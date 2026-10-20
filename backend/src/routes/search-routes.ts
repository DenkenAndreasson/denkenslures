import { Router } from "express";
import { z } from "zod";
import { searchProducts } from "../integrations/searchAdapter.js";

const router = Router();

const MAX_PAGE_SIZE = 50;

const SearchQuery = z.object({
    q: z.string().trim().max(100, "Söktexten får vara högst 100 tecken").default(""),
    page: z.coerce
        .number("page måste vara ett tal")
        .int("page måste vara ett heltal")
        .min(1, "page börjar på 1")
        .default(1),
    pageSize: z.coerce
        .number("pageSize måste vara ett tal")
        .int("pageSize måste vara ett heltal")
        .min(1, "pageSize måste vara minst 1")
        .max(MAX_PAGE_SIZE, `pageSize får vara högst ${MAX_PAGE_SIZE}`)
        .default(12),
});

// GET /api/search?q=gädda&page=2&pageSize=12
router.get("/", async (req, res) => {
    // 1. Validera parametrarna.
    const result = SearchQuery.safeParse(req.query);
    if (!result.success) {
        res.status(400).json({
            error: "Ogiltiga sökparametrar.",
            details: result.error.issues.map((issue) => issue.message),
        });
        return;
    }

    // 2. Adaptern söker och svarar i VÅRT format: { data, meta }.
    try {
        res.json(await searchProducts(result.data));
    } catch (err) {
        console.error("GET /api/search:", err);
        res.status(502).json({ error: "Sökningen fungerar inte just nu. Försök igen om en stund." });
    }
});

export default router;
