import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import expressSession from "express-session";
import productsRouter from "./product-routes.js";
import ordersRouter from "./orders-routes.js";
import currencyRouter from "./routes/currency-routes.js";
import adminRouter from "./routes/admin-routes.js"
import searchRouter from "./routes/search-routes.js"
import checkoutRouter from "./routes/checkout-routes.js";
import stripeWebhookRouter from "./routes/stripe-webhook.js";
import imageRouter from "./routes/image-routes.js";
import shippingRouter from "./routes/shipping-routes.js";



const app = express();

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
        cookie: {
            httpOnly: true,
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


app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    console.error(`${req.method} ${req.originalUrl}:`, err);
    res.status(500).json({ error: "Något gick fel på servern." });
});
export default app;
