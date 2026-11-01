# Testdata för produkter – AI-genererat

Listan med 16 testprodukter nedan skapades med hjälp av AI. Produktnamn, priser, beskrivningar och produktbilder genererades via Lovable utifrån en prompt som beskrev butiken ("Denken's softlures", fiskedrag/gummibeten) och samma fältstruktur som `products`-tabellen (`name`, `price`, `description`, `image_url`, `model`, `size`, `stock_quantity`). Bilderna kopierades till `frontend/public/products/` och `image_url` pekar dit (`/products/lure-01.jpg` osv.).

Samma data ligger även i `backend/src/seed.ts`, som körs för att fylla databasen.

```sql
INSERT INTO products (name, price, description, image_url, model, size, stock_quantity) VALUES
('Gäddkung Perch Jerk', 219.00, 'Kraftfull jerkbait med abborrdesign som triggar stora gäddor i vassbältet.', '/products/lure-01.jpg', 'Jerkbait', '15 cm', 24),
('Chartreuse Twister Classic', 39.50, 'Signalstark twister med vibrerande svans – en säker vinnare på abborre.', '/products/lure-02.jpg', 'Twister', '7 cm', 74),
('Röd Kräfta Bottenkryp', 59.90, 'Naturtrogen kräfta som lockar gös och abborre längs steniga bottnar.', '/products/lure-03.jpg', 'Kräfta', '9 cm', 41),
('Rosa Räka Coastal', 79.00, 'Lekfull räkimitation i rosa som havsöringen på grundflaken inte kan låta bli.', '/products/lure-04.jpg', 'Räka', '8 cm', 33),
('Abborrfeber Wobbler 6', 129.00, 'Livlig wobbler med tight gång som utlöser hugg från jagande abborre.', '/products/lure-05.jpg', 'Wobbler', '6 cm', 57),
('Orange Spinnfluga Höstglöd', 49.00, 'Het spinnfluga i höstfärger, perfekt för havsöring i strömmande vatten.', '/products/lure-06.jpg', 'Spinnfluga', '4 cm', 62),
('Vit Jigg Klarvatten', 34.90, 'Diskret vit jigg som plockar upp misstänksam gös i klart vatten.', '/products/lure-07.jpg', 'Jigg', '5 cm', 68),
('Popper Solnedgång', 149.50, 'Ytpopper som plaskar fram gäddan i sommarkvällens vasskant.', '/products/lure-08.jpg', 'Popper', '9 cm', 18),
('Nattsvart Jigg Djupdyk', 44.00, 'Mörk siluett med kopparskimmer – gösens favorit i skymningen.', '/products/lure-09.jpg', 'Jigg', '4 cm', 49),
('Firetiger Jerk XL', 249.00, 'Stor jerkbait i firetiger för höstens riktigt grova gäddor.', '/products/lure-10.jpg', 'Jerkbait', '18 cm', 11),
('Lila Glitter Twister', 32.50, 'Glittrande twister som får abborrstimmen att gå i spinn i grumligt vatten.', '/products/lure-11.jpg', 'Twister', '6 cm', 80),
('Grön Kräfta Sjögräs', 64.90, 'Kamouflerad kräfta med aktiva klor – dödlig på gös vid gräskanten.', '/products/lure-12.jpg', 'Kräfta', '10 cm', 37),
('Glow Räka Vinterlek', 89.00, 'Självlysande räka som lyser upp mörka vinterkvällar för havsöring.', '/products/lure-13.jpg', 'Räka', '7 cm', 29),
('Mörtwobbler Djupgång 11', 169.00, 'Djupgående wobbler i mörtdesign som lurar gäddan på 4–6 meter.', '/products/lure-14.jpg', 'Wobbler', '11 cm', 22),
('Silverblixt Spinnfluga', 54.50, 'Blixtrande tobisimitation som utlöser reflexhugg från havsöring.', '/products/lure-15.jpg', 'Spinnfluga', '5 cm', 45),
('Bone Popper Gäddvals', 139.00, 'Walk-the-dog popper i benvitt som får gäddan att explodera i ytan.', '/products/lure-16.jpg', 'Popper', '12 cm', 15);
```
