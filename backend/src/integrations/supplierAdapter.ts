import { parse } from "csv-parse/sync";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { fetchWithTimeout } from "../lib/fetchWithTimeouts"; 

export type CatalogFormat = "csv" | "xml";

export type ProductCandidate = {
    sku: string | undefined;
    ean: string | undefined;
    name: string | undefined;
    category: string | undefined;
    price: number;
    stock_quantity: number;
    variants: string[];
};



function getConfig() {
    return {
        baseUrl: process.env.SUPPLIER_API_URL ?? "https://leverantor-api.vercel.app/v1",
        apiKey: process.env.SUPPLIER_API_KEY ?? "",
        timeoutMs: Number(process.env.SUPPLIER_API_TIMEOUT_MS ?? 5000),
        bransch: process.env.SUPPLIER_BRANSCH ?? "fiskeredskap",
    };
}


function parseDecimal(value: unknown): number {
    const text = String(value ?? "").replace(/\s/g, "").replace(",", ".");
    return text === "" ? NaN : Number(text);
}

function parseStock(value: unknown): number {
    const text = String(value ?? "").trim();
    return text === "" ? 0 : Number(text);
}

function toText(value: unknown): string | undefined {
    if (value === undefined || value === null) return undefined;
    const text = String(value).trim();
    return text === "" ? undefined : text;
}

/* ---------- CSV ---------- */

type CsvRow = {
    artNr: string;
    ean: string;
    benamning: string;
    kategori: string;
    pris: string;
    lagersaldo: string;
    varianter: string;
    uppdaterad: string;
};

function parseCsvCatalog(buffer: Buffer): ProductCandidate[] {
    const text = new TextDecoder("windows-1252").decode(buffer);


    const rows = parse(text, {
        columns: true, 
        delimiter: ";", 
        skip_empty_lines: true, 
        trim: true, 
        bom: true, 
    }) as CsvRow[];

    return rows.map((row) => ({
        sku: toText(row.artNr),
        ean: toText(row.ean),
        name: toText(row.benamning),
        category: toText(row.kategori),
        price: parseDecimal(row.pris),
        stock_quantity: parseStock(row.lagersaldo),
        variants: row.varianter ? row.varianter.split("|").map((v) => v.trim()).filter(Boolean) : [],
    }));
}

/* ---------- XML ---------- */

const xmlParser = new XMLParser({
    ignoreAttributes: false, 
    parseTagValue: false, 
    isArray: (name) => name === "produkt" || name === "variant",
});


type XmlProduct = {
    "@_artNr"?: string;
    ean?: string;
    benamning?: string;
    kategori?: string;
    pris?: { "#text"?: string } | string;
    lagersaldo?: string;
    varianter?: { variant?: string[] } | string;
};

function parseXmlCatalog(buffer: Buffer): ProductCandidate[] {
    const text = new TextDecoder("utf-8").decode(buffer);


    const valid = XMLValidator.validate(text);
    if (valid !== true) {
        throw new Error(`Leverantörens XML är trasig: ${valid.err.msg} (rad ${valid.err.line})`);
    }

    const doc = xmlParser.parse(text) as { katalog?: { produkt?: XmlProduct[] } };
    const products = doc.katalog?.produkt;
    if (!Array.isArray(products)) {
        throw new Error("Leverantörens XML saknar <katalog><produkt>…");
    }

    return products.map((p) => ({
        sku: toText(p["@_artNr"]),
        ean: toText(p.ean),
        name: toText(p.benamning),
        category: toText(p.kategori),
        price: parseDecimal(typeof p.pris === "object" ? p.pris["#text"] : p.pris),
        stock_quantity: parseStock(p.lagersaldo),
        variants:
            typeof p.varianter === "object" && p.varianter.variant
                ? p.varianter.variant.map((v) => String(v).trim()).filter(Boolean)
                : [],
    }));
}

/* ---------- Publik funktion ---------- */

export async function getSupplierCatalog(format: CatalogFormat): Promise<ProductCandidate[]> {
    const { baseUrl, apiKey, timeoutMs, bransch } = getConfig();
    const url = `${baseUrl}/export/products.${format}?bransch=${encodeURIComponent(bransch)}`;

    const response = await fetchWithTimeout(url, {
        headers: { "X-Api-Key": apiKey },
        timeoutMs,
    });
    const buffer = Buffer.from(await response.arrayBuffer());

  
    return format === "csv" ? parseCsvCatalog(buffer) : parseXmlCatalog(buffer);
}
