import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import expressSession from "express-session";
import productsRouter from "./product-routes.js";
import ordersRouter from "./orders-routes.js";

dotenv.config();

const app = express();

// Tillåt requests från frontend (som körs på en annan port under utveckling)
app.use(cors());

// Läs in JSON-body från POST/PUT-requests, t.ex. när vi skapar en produkt
app.use(express.json());

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

export default app;
