import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import expressSession from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import { pool } from "./db.js";
import productsRouter from "./product-routes.js";
import ordersRouter from "./orders-routes.js";
import currencyRouter from "./routes/currency-routes.js";
import adminRouter from "./routes/admin-routes.js"
import searchRouter from "./routes/search-routes.js"
import checkoutRouter from "./routes/checkout-routes.js";
import stripeWebhookRouter from "./routes/stripe-webhook.js";
import imageRouter from "./routes/image-routes.js";
import shippingRouter from "./routes/shipping-routes.js";
import authRouter from "./routes/auth-routes.js";
import accountRouter from "./routes/account-routes.js";

declare module "express-session" {
    interface SessionData {
        customerId: number;
        googleLogin: { state: string; codeVerifier: string };
    }
}

const MySQLStore = MySQLStoreFactory(expressSession);



const app = express();

// Vercel tar emot HTTPS och skickar vidare som HTTP. Utan detta tror express-session
// att anslutningen är osäker och skickar aldrig den secure-märkta cookien.
app.set("trust proxy", 1);

// Tillåt requests från frontend (som körs på en annan port under utveckling)
app.use(cors());

app.use("/api/stripe/webhook", stripeWebhookRouter);

// Läs in JSON-body från POST/PUT-requests, t.ex. när vi skapar en produkt
app.use(express.json());
app.use("/api/shipping", shippingRouter);

app.use("/api/currency", currencyRouter);
app.use(
    expressSession({
        secret: process.env.SESSION_SECRET || "dev-secret-change-me",
        resave: false,
        saveUninitialized: false,
        // Sessionerna sparas i MySQL. I minnet skulle de försvinna mellan Vercels instanser.
        store: new MySQLStore({}, pool.pool),
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            // lax: cookien följer med när Google skickar tillbaka kunden till callbacken (en vanlig GET).
            sameSite: "lax",
            maxAge: 60 * 60 * 1000,
        },
    })
);

app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/admin/", adminRouter);
app.use("/api/admin/", imageRouter);
app.use("/api/search", searchRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/auth", authRouter);
app.use("/api/account", accountRouter);


app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    console.error(`${req.method} ${req.originalUrl}:`, err);
    res.status(500).json({ error: "Något gick fel på servern." });
});
export default app;
