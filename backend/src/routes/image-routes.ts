import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { pool } from "../db.js";
import { removeProductImage, uploadProductImage } from "../integrations/storageAdapter.js";
import { syncProducts } from "../lib/searchSync.js";
import { detectImageType, MAX_IMAGE_BYTES } from "../validation/productImage.js";

const router = Router();

// multer läser multipart/form-data, formatet en webbläsare använder för att skicka filer.
// Filen hamnar i minnet (req.file.buffer), aldrig på serverns disk. Större än MAX_IMAGE_BYTES → fel.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } });

// Tar emot EN fil i fältet "image". Kan multer inte läsa den svarar vi 400 med ett fel.
function receiveImage(req: Request, res: Response, next: NextFunction) {
    upload.single("image")(req, res, (err) => {
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
            res.status(400).json({ error: `Bilden är för stor. Max ${MAX_IMAGE_BYTES / (1024 * 1024)} MB.` });
            return;
        }
        if (err) {
            res.status(400).json({ error: 'Kunde inte läsa filen. Skicka EN bild i fältet "image".' });
            return;
        }
        next();
    });
}

// POST /api/admin/products/:id/image
router.post("/products/:id/image", receiveImage, async (req, res) => {
    // 1. Validera
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: "Ogiltigt produkt-id." });
        return;
    }
    if (!req.file) {
        res.status(400).json({ error: 'Ingen bild. Skicka bilden i fältet "image".' });
        return;
    }
    const type = detectImageType(req.file.buffer);
    if (!type) {
        res.status(400).json({ error: "Filen är inte en JPEG- eller PNG-bild." });
        return;
    }

    // Produkten måste finnas, och vi behöver den äldre sökvägen innan vi skriver över den.
    let oldPath: string | null;
    try {
        const [rows]: any = await pool.query("SELECT image_path FROM products WHERE id = ?", [id]);
        if (rows.length === 0) {
            res.status(404).json({ error: "Produkten hittades inte." });
            return;
        }
        oldPath = rows[0].image_path;
    } catch (err) {
        console.error("Bild: kunde inte läsa produkten:", err);
        res.status(500).json({ error: "Kunde inte läsa produkten." });
        return;
    }

    // 2. Ladda upp den nya bilden. Inget i databasen är ändrat än.
    let image;
    try {
        image = await uploadProductImage(id, { buffer: req.file.buffer, type });
    } catch (err) {
        console.error("Bild:", (err as Error).message);
        res.status(502).json({ error: "Bildlagringen svarar inte just nu. Produkten har kvar sin gamla bild. Försök igen om en stund." });
        return;
    }

    // 3. Spara den nya bilden på produkten: URL:en för att visa den, sökvägen för att kunna ta bort den.
    try {
        await pool.query("UPDATE products SET image_url = ?, image_path = ? WHERE id = ?", [image.url, image.path, id]);
    } catch (err) {
        console.error("Bild: kunde inte spara på produkten:", err);
        // Den nya filen används inte av någon. Försök städa bort den.
        await removeProductImage(image.path).catch(() => {});
        res.status(500).json({ error: "Kunde inte spara bilden på produkten. Produkten har kvar sin gamla bild." });
        return;
    }

    // 4. NU tas den gamla filen bort. Misslyckas det visar produkten ändå den nya bilden.
    //    den gamla filen blir bara liggande i bucketen. Därför loggar vi bara felet.
    if (oldPath) {
        await removeProductImage(oldPath).catch((err) => console.warn("Bild: gamla filen kunde inte tas bort:", err.message));
    }

    // Bilden visas även i sökresultaten, så Algolia får den nya URL:en.
    const searchIndexed = await syncProducts("id", [id]);
    res.status(201).json({ image_url: image.url, image_path: image.path, searchIndexed });
});

export default router;
