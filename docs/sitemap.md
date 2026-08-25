# Sitemap – Denken's softlure
    Start["/  (produktlista)"] --> Produkt["/produkt/:id"]
    Start --> Varukorg["/varukorg"]
    Produkt --> Varukorg
    Varukorg --> Kassa["/kassa"]
    Kassa --> Tack["/tack"]

    Start -.länk i meny.-> AdminStart["/admin"]
    AdminStart --> AdminProdukter["/admin/produkter"]
    AdminProdukter --> AdminProduktNy["/admin/produkter/ny"]
    AdminProdukter --> AdminProduktRedigera["/admin/produkter/:id"]
    AdminStart --> AdminOrdrar["/admin/ordrar"]
    AdminOrdrar --> AdminOrderDetalj["/admin/ordrar/:id"]

## Kundsidor
| Sida                  | Beskrivning
| `/`                   | Startsida med lista över alla fiskedrag |
| `/produkt/:id`        | Detaljvy för ett specifikt fiskedrag |
| `/varukorg`           | Varukorgen, med totalsumma |
| `/kassa`              | Formulär för kunduppgifter och beställning |
| `/tack`               | Bekräftelsesida efter genomförd beställning |

## Adminsidor
| Sida                  | Beskrivning
| `/admin`              | Startsida för admin, välj produkter eller ordrar |
| `/admin/produkter`    | Lista över alla produkter |
| `/admin/produkter/ny` | Lägg till en ny produkt |
| `/admin/produkter/:id`| Redigera eller ta bort en produkt |
| `/admin/ordrar`       | Lista över alla ordrar, nyaste först |
| `/admin/ordrar/:id`   | Orderdetaljer: kunduppgifter och beställda varor |
