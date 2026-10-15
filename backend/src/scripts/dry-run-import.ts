// Torrkörning: hämtar, parsar, mappar och validerar båda formaten 
// men skriver INGENTING till databasen. Bra för att felsöka adaptern.

//   npm run import:dry-run

import "dotenv/config";
import { getSupplierCatalog, type CatalogFormat } from "../integrations/supplierAdapter.js";
import { validateCandidate } from "../validation/importedProduct.js"; 

async function run(format: CatalogFormat) {
    const candidates = await getSupplierCatalog(format);
    const valid = [];
    const skipped = [];

    for (const candidate of candidates) {
        const result = validateCandidate(candidate);
        if (result.ok) valid.push(result.product);
        else skipped.push({ sku: candidate.sku, name: candidate.name, reason: result.reason });
    }

    console.log(`\n[${format.toUpperCase()}] ${candidates.length} rader → ${valid.length} giltiga, ${skipped.length} överhoppade`);
    console.log("  Exempel:", valid[0]);
    console.log("  Tomt lager (LEV-1004):", valid.find((p) => p.sku === "LEV-1004")?.stock_quantity);
    console.log("  Inga varianter (LEV-1006):", valid.find((p) => p.sku === "LEV-1006")?.variants);
    console.log("  Överhoppade:", skipped);
    return valid;
}

async function main() {
    const csv = await run("csv");
    const xml = await run("xml");

    // De två formaten ska ge EXAKT samma produkter.
    const same = JSON.stringify(csv) === JSON.stringify(xml);
    console.log(`\nCSV och XML ger identiska produkter: ${same ? "ja ✅" : "NEJ ❌"}`);
}

main().catch((err) => {
    console.error("Torrkörningen misslyckades:", err);
    process.exit(1);
});
