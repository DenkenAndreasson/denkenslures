import app from "./app.js";

// Körs bara lokalt (npm run dev). På Vercel exporteras app direkt från
// backend/api/index.ts som en serverless-funktion, utan app.listen.
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Servern lyssnar på port ${port}`);
});
