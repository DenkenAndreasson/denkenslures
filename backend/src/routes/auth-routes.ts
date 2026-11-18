import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { createLoginAttempt, exchangeCodeForProfile } from "../integrations/googleAuthAdapter.js";
import { findOrCreateGoogleCustomer } from "../lib/customers.js";

const router = Router();

const CallbackQuery = z.object({
    code: z.string().min(1),
    state: z.string().min(1),
});

// GET /api/auth/google → skickar kunden vidare till Google
router.get("/google", async (req, res) => {
    let attempt;
    try {
        attempt = createLoginAttempt();
    } catch (err) {
        console.error("GET /api/auth/google:", (err as Error).message);
        res.redirect("/inloggning?fel=google");
        return;
    }

    // Sparas innan kunden skickas vidare. Annars kan kunden komma tillbaka
    // från Google innan state finns i databasen.
    req.session.googleLogin = { state: attempt.state, codeVerifier: attempt.codeVerifier };
    try {
        await new Promise<void>((resolve, reject) => req.session.save((err) => (err ? reject(err) : resolve())));
    } catch (err) {
        console.error("GET /api/auth/google (sessionen):", err);
        res.redirect("/inloggning?fel=server");
        return;
    }

    res.redirect(attempt.url);
});

// GET /api/auth/google/callback?code=…&state=… (eller ?error=… om kunden avbröt)
// 1. kontrollera state  2. byt koden mot tokens (med code verifier)  3. hitta eller skapa kunden  4. logga in
router.get("/google/callback", async (req, res) => {
    // state och code verifier gäller bara en inloggning.
    const login = req.session.googleLogin;
    delete req.session.googleLogin;

    if (req.query.error) {
        console.warn(`Google-inloggning avbröts: ${String(req.query.error)}`);
        res.redirect("/inloggning?fel=avbruten");
        return;
    }

    const query = CallbackQuery.safeParse(req.query);
    if (!query.success || !login || query.data.state !== login.state) {
        console.warn("Google-inloggning avvisad: state saknas eller matchar inte.");
        res.redirect("/inloggning?fel=ogiltig");
        return;
    }

    let profile;
    try {
        profile = await exchangeCodeForProfile(query.data.code, login.codeVerifier);
    } catch (err) {
        console.error("Google-inloggning:", (err as Error).message);
        res.redirect("/inloggning?fel=google");
        return;
    }

    try {
        const customerId = await findOrCreateGoogleCustomer(profile);
        // Nytt sessions-id vid inloggning, så att ett id som fanns före inloggningen inte blir inloggat.
        await new Promise<void>((resolve, reject) =>
            req.session.regenerate((err) => (err ? reject(err) : resolve()))
        );
        req.session.customerId = customerId;
        await new Promise<void>((resolve, reject) => req.session.save((err) => (err ? reject(err) : resolve())));
    } catch (err) {
        console.error("Google-inloggning (kunden):", err);
        res.redirect("/inloggning?fel=server");
        return;
    }

    res.redirect("/mina-sidor");
});

// GET /api/auth/me → den inloggade kunden, eller 401
router.get("/me", async (req, res) => {
    if (!req.session.customerId) {
        res.status(401).json({ error: "Du är inte inloggad." });
        return;
    }
    try {
        const [rows]: any = await pool.query("SELECT id, email, name FROM customers WHERE id = ?", [
            req.session.customerId,
        ]);
        if (rows.length === 0) {
            res.status(401).json({ error: "Du är inte inloggad." });
            return;
        }
        res.json(rows[0]);
    } catch (err) {
        console.error("GET /api/auth/me:", err);
        res.status(500).json({ error: "Kunde inte hämta kunden." });
    }
});

// POST /api/auth/logout → sessionen raderas i databasen och cookien tas bort
router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("POST /api/auth/logout:", err);
            res.status(500).json({ error: "Kunde inte logga ut." });
            return;
        }
        res.clearCookie("connect.sid");
        res.status(204).end();
    });
});

export default router;
