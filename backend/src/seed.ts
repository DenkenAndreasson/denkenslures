import { pool } from "./db.js";

// Skapar tabellerna (om de inte redan finns), rensar gammal testdata och
// fyller products med ett nytt sortiment. Körs manuellt vid behov: npm run seed
async function seed() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            description TEXT,
            image_url VARCHAR(255),
            model VARCHAR(100),
            size VARCHAR(50),
            stock_quantity INT DEFAULT 0
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255) NOT NULL,
            address VARCHAR(255) NOT NULL,
            postal_code VARCHAR(20) NOT NULL,
            city VARCHAR(100) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL,
            price_at_purchase DECIMAL(10, 2) NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        );
    `);

    // Rensar ev. gammal testdata så scriptet kan köras om och ge ett rent sortiment.
    // order_items har en FOREIGN KEY mot products, så den måste tömmas först.
    await pool.query("DELETE FROM order_items");
    await pool.query("DELETE FROM orders");
    await pool.query("DELETE FROM products");

    const products: [string, number, string, string, string, string, number][] = [
        ["Gäddkung Perch Jerk", 219.0, "Kraftfull jerkbait med abborrdesign som triggar stora gäddor i vassbältet.", "/products/gaddkung-perch-jerk.jpg", "Jerkbait", "15 cm", 24],
        ["Chartreuse Twister Classic", 39.5, "Signalstark twister med vibrerande svans – en säker vinnare på abborre.", "/products/chartreuse-twister-classic.jpg", "Twister", "7 cm", 74],
        ["Röd Kräfta Bottenkryp", 59.9, "Naturtrogen kräfta som lockar gös och abborre längs steniga bottnar.", "/products/rod-krafta-bottenkryp.jpg", "Kräfta", "9 cm", 41],
        ["Rosa Räka Coastal", 79.0, "Lekfull räkimitation i rosa som havsöringen på grundflaken inte kan låta bli.", "/products/rosa-raka-coastal.jpg", "Räka", "8 cm", 33],
        ["Abborrfeber Wobbler 6", 129.0, "Livlig wobbler med tight gång som utlöser hugg från jagande abborre.", "/products/abborrfeber-wobbler-6.jpg", "Wobbler", "6 cm", 57],
        ["Orange Spinnfluga Höstglöd", 49.0, "Het spinnfluga i höstfärger, perfekt för havsöring i strömmande vatten.", "/products/orange-spinnfluga-hostglod.jpg", "Spinnfluga", "4 cm", 62],
        ["Vit Jigg Klarvatten", 34.9, "Diskret vit jigg som plockar upp misstänksam gös i klart vatten.", "/products/vit-jigg-klarvatten.jpg", "Jigg", "5 cm", 68],
        ["Popper Solnedgång", 149.5, "Ytpopper som plaskar fram gäddan i sommarkvällens vasskant.", "/products/popper-solnedgang.jpg", "Popper", "9 cm", 18],
        ["Nattsvart Jigg Djupdyk", 44.0, "Mörk siluett med kopparskimmer – gösens favorit i skymningen.", "/products/nattsvart-jigg-djupdyk.jpg", "Jigg", "4 cm", 49],
        ["Firetiger Jerk XL", 249.0, "Stor jerkbait i firetiger för höstens riktigt grova gäddor.", "/products/firetiger-jerk-xl.jpg", "Jerkbait", "18 cm", 11],
        ["Lila Glitter Twister", 32.5, "Glittrande twister som får abborrstimmen att gå i spinn i grumligt vatten.", "/products/lila-glitter-twister.jpg", "Twister", "6 cm", 80],
        ["Grön Kräfta Sjögräs", 64.9, "Kamouflerad kräfta med aktiva klor – dödlig på gös vid gräskanten.", "/products/gron-krafta-sjogras.jpg", "Kräfta", "10 cm", 37],
        ["Glow Räka Vinterlek", 89.0, "Självlysande räka som lyser upp mörka vinterkvällar för havsöring.", "/products/glow-raka-vinterlek.jpg", "Räka", "7 cm", 29],
        ["Mörtwobbler Djupgång 11", 169.0, "Djupgående wobbler i mörtdesign som lurar gäddan på 4–6 meter.", "/products/mortwobbler-djupgang-11.jpg", "Wobbler", "11 cm", 22],
        ["Silverblixt Spinnfluga", 54.5, "Blixtrande tobisimitation som utlöser reflexhugg från havsöring.", "/products/silverblixt-spinnfluga.jpg", "Spinnfluga", "5 cm", 45],
        ["Bone Popper Gäddvals", 139.0, "Walk-the-dog popper i benvitt som får gäddan att explodera i ytan.", "/products/bone-popper-gaddvals.jpg", "Popper", "12 cm", 15],
    ];

    await pool.query(
        `INSERT INTO products (name, price, description, image_url, model, size, stock_quantity) VALUES ?`,
        [products]
    );

    console.log(`${products.length} testprodukter inlagda i products.`);
    await pool.end();
}

seed().catch((err) => {
    console.error("Seed misslyckades:", err);
    process.exit(1);
});
