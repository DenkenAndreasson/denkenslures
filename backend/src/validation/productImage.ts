import type { ImageType } from "../integrations/storageAdapter.js";

// 4 MB. Vercel tar inte emot större request-bodies än 4,5 MB.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

//      Kontroll
//      JPEG börjar alltid med FF D8 FF
//      PNG  börjar alltid med 89 50 4E 47 0D 0A 1A 0A  ("‰PNG\r\n\x1a\n")
export function detectImageType(buffer: Buffer): ImageType | null {
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return "image/jpeg";
    }
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    if (buffer.length >= png.length && png.every((byte, i) => buffer[i] === byte)) {
        return "image/png";
    }
    return null;
}
