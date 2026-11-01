# AI-logg, labb 5

**Verktyg:** Claude AI för strukturell bollning. Copilot för promtar.

## Steg 1: Rätta ombuden

**Prompt:**
```
Jag bygger frakt med PostNord i min webbshop (Express, TypeScript, MySQL, React).

Läs backend/src/integrations/shippingAdapter.ts. Läs inte .env och kör inga kommandon som läser filen eller använder API-nyckeln.

Rätta findServicePoints så att den stämmer med sandlådans svar nedan:
1. Validera bara de fält shoppen använder med Zod.
2. Låt streetNumber få saknas eller vara null.
3. Ta bort routeDistance och sorteringen, och behåll ordningen från PostNord.
4. Nyckeln ligger i URL:en, så URL:en får aldrig hamna i loggar eller felmeddelanden.

Ändra bara den här filen. Om ett fält i svaret har en annan typ eller ett annat namn än i schemat ska du peka ut det i stället för att gissa. Förklara kort varje ändring.

Så här svarar sandlådan:
{"servicePointInformationResponse":{"customerSupports":[{"country":"SE","customerSupportPhoneNo":"+46771333310"}],"servicePoints":[{"name":"PostNord Stockholm Sveavägen","servicePointId":"583631","pudoId":"SE19544","routingCode":null,"handlingOffice":null,"locationDetail":null,"routeDistance":634,"pickup":{"cashOnDelivery":null,"heavyGoodsProducts":[],"products":[{"name":"Parcel","timeSlots":{"availableForPickupEarlyCollect":[],"availableForPickupStandard":[{"earliestTime":null,"day":"MONDAY"},{"earliestTime":null,"day":"TUESDAY"},{"earliestTime":null,"day":"WEDNESDAY"},{"earliestTime":null,"day":"THURSDAY"},{"earliestTime":null,"day":"FRIDAY"},{"earliestTime":null,"day":"SATURDAY"}]}}]},"visitingAddress":{"countryCode":"SE","city":"STOCKHOLM","streetName":"Sveavägen","streetNumber":"18","postalCode":"11157","additionalDescription":null},"deliveryAddress":{"countryCode":"SE","city":"STOCKHOLM","streetName":"Sveavägen","streetNumber":"18","postalCode":"11157","additionalDescription":null,"coordinate":{"latitude":59.3344828,"longitude":18.0648751}},"notificationArea":{"postalCodes":["10012","10101","10110","10120","10121","10122","10123","10124","10125","10126","10127","10128","10129","10130","10131","10132","10133","10134","10135","10136","10137","10138","10139","10153","10154","10155","10156","10158","10159","10301","10302","10303","10311","10312","10313","10314","10315","10316","10317","10318","10320","10321","10322","10323","10324","10325","10326","10327","10329","10332","10333","10334","10335","10336","10337","10338","10339","10351","10355","10359","10360","10361","10362","10363","10364","10365","10366","10367","10368","10369","10370","10371","10373","10374","10375","10376","10377","10380","10382","10383","10384","10385","10386","10387","10388","10389","10390","10391","10392","10393","10394","10395","10396","10397","10398","10399","10510","10511","10515","10516","10518","10522","10531","10532","10533","10535","10539","10544","10547","10550","10552","10553","10560","10561","10578","10612","10614","10618","10626","10627","10635","10638","10640","10643","10660","10667","10670","10685","10691","10722","10723","10724","10725","10726","10770","10788","10795","10796","11001","11003","11007","11016","11077","11101","11102","11120","11121","11122","11128","11134","11135","11136","11137","11138","11139","11140","11143","11144","11145","11146","11147","11148","11149","11151","11152","11153","11156","11157","11164","11173","11174","11175","11176","11177","11181","11182","11183","11184","11186","11187","11191","11193","11196"]},"coordinates":[{"countryCode":"SE","northing":59.3344828,"easting":18.0648751,"srId":"EPSG:4326"}],"openingHours":{"postalServices":[{"closeDay":"Monday","closeTime":"19:00","openDay":"Monday","openTime":"08:30"},{"closeDay":"Tuesday","closeTime":"19:00","openDay":"Tuesday","openTime":"08:30"},{"closeDay":"Wednesday","closeTime":"19:00","openDay":"Wednesday","openTime":"08:30"},{"closeDay":"Thursday","closeTime":"19:00","openDay":"Thursday","openTime":"08:30"},{"closeDay":"Friday","closeTime":"19:00","openDay":"Friday","openTime":"08:30"},{"closeDay":"Saturday","closeTime":"15:00","openDay":"Saturday","openTime":"10:00"}],"specialDates":[{"closeTime":"","endDate":"2026-04-03","isClosed":true,"openTime":"","reason":"Good Friday","startDate":"2026-04-03"},{"closeTime":"","endDate":"2026-04-04","isClosed":true,"openTime":"","reason":"Easter Saturday","startDate":"2026-04-04"},{"closeTime":"","endDate":"2026-04-05","isClosed":true,"openTime":"","reason":"Easter Sunday","startDate":"2026-04-05"},{"closeTime":"","endDate":"2026-04-06","isClosed":true,"openTime":"","reason":"Easter Monday","startDate":"2026-04-06"},{"closeTime":"","endDate":"2026-05-01","isClosed":true,"openTime":"","reason":"Första maj","startDate":"2026-05-01"},{"closeTime":"","endDate":"2026-05-14","isClosed":true,"openTime":"","reason":"Ascension Day","startDate":"2026-05-14"},{"closeTime":"","endDate":"2026-05-23","isClosed":true,"openTime":"","reason":"Pingstafton","startDate":"2026-05-23"},{"closeTime":"","endDate":"2026-05-24","isClosed":true,"openTime":"","reason":"Pinsedag","startDate":"2026-05-24"},{"closeTime":"","endDate":"2026-06-06","isClosed":true,"openTime":"","reason":"Sveriges Nationaldag","startDate":"2026-06-06"},{"closeTime":"","endDate":"2026-06-19","isClosed":true,"openTime":"","reason":"Midsommarafton","startDate":"2026-06-19"},{"closeTime":"","endDate":"2026-06-20","isClosed":true,"openTime":"","reason":"Midsommardagen","startDate":"2026-06-20"},{"closeTime":"","endDate":"2026-10-31","isClosed":true,"openTime":"","reason":"All Saints Day","startDate":"2026-10-31"},{"closeTime":"","endDate":"2026-12-24","isClosed":true,"openTime":"","reason":"Christmas Eve","startDate":"2026-12-24"},{"closeTime":"","endDate":"2026-12-25","isClosed":true,"openTime":"","reason":"Christmas Day","startDate":"2026-12-25"},{"closeTime":"","endDate":"2026-12-26","isClosed":true,"openTime":"","reason":"Boxing Day","startDate":"2026-12-26"},{"closeTime":"","endDate":"2026-12-31","isClosed":true,"openTime":"","reason":"New Year's Eve","startDate":"2026-12-31"}]},"type":{"groupTypeId":1,"groupTypeName":"Service agent","typeId":24,"typeName":"Postnord Inlämning","boxType":null}}]}}
```

**Resultat:**
Uppdaterade endast shippingAdapter.ts:

Tog bort routeDistance ur Zod-schemat eftersom shoppen inte använder fältet.
Tillät streetNumber att saknas eller vara null.
Tog bort sorteringen och behöll PostNords ordning; resultatet begränsas fortfarande till fem ombud.
URL:en och API-nyckeln lämnas fortsatt utanför loggar och felmeddelanden.
För fälten som shoppen använder matchar sandlådesvaret schemat; jag hittade inga avvikande namn eller typer där. Filens diagnostik visar inga fel.


## Steg 2: Lägga till leveranstid

Vi vill nu lägga till en funktion som räknar ut leveranskostnader. 

**Prompt:**
```
Implementera estimateDelivery i backend/src/integrations/shippingAdapter.ts enligt PostNords dokumentation för Transit Time V2. Läs inte .env och kör inga kommandon som läser filen eller använder API-nyckeln.

Anrop: GET /rest/transport/v2/transittime/addresstoaddress, relativt POSTNORD_API_URL.

Parametrar:
- apikey och returnType sätts inte på något annat sätt än i findServicePoints. Skicka bara returnType om dokumentationen kräver det: den listar inte returnType för det här anropet, så utelämna den.
- startTime: aktuell tid i Europe/Stockholm, på formen 2024-12-01T08:00. Serverns tidszon får inte avgöra värdet.
- serviceCodes=19
- originPostalCode: SHOP_POSTAL_CODE
- originCountryCode=SE
- destinationPostalCode: kundens postnummer
- destinationCountryCode=SE

Svaret är en array på toppnivå. Exempel på en lyckad rad:
{
  "service": { "basicServiceCode": "19", "name": "PostNord MyPack Collect" },
  "estimatedTimeOfArrival": { "timeOfArrival": "2024-08-23T18:00:00" },
  "isSupported": true,
  "isBookable": true
}

En rad kan i stället ha estimatedTimeOfArrival.dayRangeOfArrival med daysMinimum och daysMaximum.
En misslyckad rad saknar estimatedTimeOfArrival och har errorMessage, även om statuskoden är 200.
En rad med tilläggstjänst har service.additionalServices. Dokumentationen är otydlig med om det är ett objekt eller en array, så kontrollera bara om fältet finns.

Krav:
1. Återanvänd fetchFromPostNord och getConfig, och lägg till SHOP_POSTAL_CODE i getConfig. Saknas värdet ska funktionen kasta ett begripligt fel, utan att servern kraschar.
2. Validera bara de fält vi använder med Zod.
3. Välj raden där basicServiceCode är "19", additionalServices saknas och errorMessage saknas. Finns ingen sådan rad, eller saknar den både timeOfArrival och dayRangeOfArrival, ska funktionen kasta ett begripligt fel.
4. Returnera { date: string | null, day_range: string | null }.
5. date ska vara de första tio tecknen i timeOfArrival. Använd inte new Date eller toISOString, eftersom tiden saknar tidszon och servern kan köra i UTC.
6. day_range ska ha formen "3–4 dagar".
7. Lägg till SHOP_POSTAL_CODE= i backend/.env.example.

Ändra inga andra filer och ändra inte findServicePoints. Förklara kort varje ändring.
```

**Resultat:**
Implementerat estimateDelivery i shippingAdapter.ts och lagt till SHOP_POSTAL_CODE= i backend/.env.example. findServicePoints är oförändrad.

Funktionen använder den angivna Transit Time V2-sökvägen och parametrarna, återanvänder getConfig och fetchFromPostNord, och utelämnar returnType.
startTime formateras i Europe/Stockholm; datumet från svaret tas direkt från strängen och valideras utan tidszonskonvertering.
Zod validerar bara fälten som används. Funktionen väljer tjänst 19 utan tilläggstjänst eller errorMessage och returnerar datum eller dagintervall.
Saknad SHOP_POSTAL_CODE, olämpligt svar och ogiltigt datum ger begripliga fel. URL:en med API-nyckeln exponeras inte i felmeddelanden.
Backendbygget (npm run build) lyckades. Jag läste inte .env och körde inga kommandon som läser den eller använder API-nyckeln.

Osäkerhet: Jag har inte PostNords dokumentation och kan inte oberoende bekräfta att endpointen, query-parametrarna eller svarsfälten fungerar exakt som angivna. Implementationen följer kontraktet i din instruktion; i synnerhet bygger den på att svaret är en array och att de beskrivna ETA-fälten har de angivna typerna. Jag såg andra befintliga ändringar i arbetskatalogen och lämnade dem orörda.

## Steg 3: Felsökning
```
estimateDelivery i backend/src/integrations/shippingAdapter.ts avvisar giltiga svar. PostNords dokumentation säger att timeOfArrival och dayRangeOfArrival kan vara null, men schemat PostNordTransitTimeRow tillåter bara att de saknas.

Rätta så här:
1. Låt timeOfArrival och dayRangeOfArrival vara nullish i schemat.
2. Behandla additionalServices och errorMessage som frånvarande även när de är null. Byt kontrollerna med hasOwnProperty mot en kontroll av värdet.

Ändra inget annat. Läs inte .env och kör inga kommandon som använder API-nyckeln. Förklara kort ändringen.
```

**Resultat:**
Uppdaterade bara shippingAdapter.ts:

timeOfArrival och dayRangeOfArrival accepterar nu både null och saknat värde.
Rader med additionalServices eller errorMessage värdet null behandlas nu som om fälten saknas.
Filens diagnostik visar inga fel. .env lästes inte, och inga kommandon som använder API-nyckeln kördes.

## Steg 4: Frakten i ordern och Stripe

Vi ska fixa routen för frakten så vi kan få priser osv. 

**Prompt:**
```
Skapa backend/src/routes/shipping-routes.ts med POST /api/shipping/quote och registrera routen under /api/shipping i backend/src/app.ts, efter express.json. Följ strukturen i mina andra routes. Läs inte .env och kör inga kommandon som läser filen eller använder API-nyckeln.

Indata, validerad med Zod:
- postal_code: valideras och normaliseras med PostalCode från validation/postalCode.ts
- items: samma regler som i CheckoutBody i checkout-routes.ts. Skicka aldrig in eller läs något pris från React.

Varornas värde:
- Exportera en ny funktion calculateGoodsValue(cart) från lib/orders.ts. Den ska återanvända priceCart, hämta en anslutning från pool och alltid släppa den.
- CartError ger status 400 med felets meddelande. Andra databasfel ger status 500 med ett allmänt meddelande.

Frakt:
- Räkna priset för pickup_point och home_delivery med calculateShippingPrice från lib/shipping.ts.
- Hämta findServicePoints och estimateDelivery samtidigt med Promise.allSettled, så att ett fel i den ena inte stoppar den andra.

Svara med status 200 och exakt den här formen:
{
  "goods_value": 349,
  "free_shipping_threshold": 500,
  "prices": { "pickup_point": 59, "home_delivery": 99 },
  "service_points": [{ "id": "...", "name": "...", "address": "...", "postal_code": "...", "city": "..." }],
  "delivery": { "date": "2026-11-03", "day_range": null }
}

Felhantering:
- service_points ska vara null om PostNord-anropet misslyckas och [] om det inte finns några ombud.
- delivery ska vara null om leveransberäkningen misslyckas.
- Ett PostNord-fel ska inte ge felstatus, eftersom kunden fortfarande ska se priserna och kunna välja hemleverans.
- Logga bara err.message på servern, aldrig hela felobjektet eller en URL.
- Ogiltig indata ger status 400 med ett begripligt meddelande, på samma sätt som i checkout-routes.ts.

Ändra inget i kassan eller i POST /api/checkout än. Förklara kort flödet.
``` 

**Resultat:** 
Implementerat POST /api/shipping/quote och registrerat routen efter express.json() i app.ts.

Flödet är: postnummer normaliseras med PostalCode och varukorgens rader valideras enligt samma regler som checkout. calculateGoodsValue använder priceCart för databaspriser och släpper alltid anslutningen. Cart-fel ger 400, andra databasfel 500. Fraktpriserna räknas därefter ut, medan ombud och leveransuppskattning hämtas parallellt; misslyckade PostNord-anrop loggas med endast felmeddelandet och ger null i motsvarande svarsfält.

Den nya shipping-routes.ts returnerar de begärda fälten och läser inget pris från klienten. Backendbygget (npm run build) lyckades. .env lästes inte, och inga kommandon som använder API-nyckeln kördes.

## Steg 5: Frakten i ordern och Stripe

För att kunden ska se priser, ombud och leverans före betalningen.

**Prompt:**
```
Lägg in frakten i POST /api/checkout. Ändra backend/src/routes/checkout-routes.ts, createPendingOrder i backend/src/lib/orders.ts och vid behov backend/src/integrations/paymentAdapter.ts. Läs inte .env och kör inga kommandon som läser filen eller använder API-nycklar.

Indata:
- Validera postal_code med PostalCode från validation/postalCode.ts. Det normaliserade postnumret ska sparas på ordern.
- Lägg till shipping_method: "pickup_point" eller "home_delivery". Använd SHIPPING_METHODS från lib/shipping.ts.
- Lägg till pickup_point_id, en sträng på högst 50 tecken, som krävs för pickup_point. Ett saknat id ger 400 med ett begripligt meddelande.
- För home_delivery ska ett medskickat pickup_point_id ignoreras.
- React skickar aldrig ett pris. Läs inget pris från indata.
- I dag byggs customer med rest-syntax. Se till att fraktfälten inte hamnar i customer.

Kontroll av ombud, som ska ske innan ordern skapas:
- Anropa findServicePoints(postal_code) på servern och kontrollera att pickup_point_id finns bland ombuden.
- Finns det inte: status 400 med meddelandet "Det valda ombudet finns inte för det här postnumret. Välj ett ombud i listan."
- Misslyckas anropet: status 502 med ett meddelande om att kunden kan försöka igen eller välja hemleverans. Logga bara err.message.
- Hemleverans ska fungera utan något anrop till PostNord.
- Använd ombudets namn och adress från PostNords svar, aldrig från React.

Ordern:
- Räkna fraktpriset med calculateShippingPrice i createPendingOrder, inne i samma transaktion, från de varupriser som priceCart hämtar.
- Spara shipping_method, shipping_price, pickup_point_id, pickup_point_name och pickup_point_address. Ombudsfälten är NULL vid hemleverans.
- total ska vara varor plus frakt.
- Frakten får inte läggas in i order_items.
- Returnera shipping_price från createPendingOrder.

Stripe:
- Lägg till frakten som en egen rad med quantity 1 och namnet "Frakt: ombud" eller "Frakt: hemleverans".
- Utelämna raden när frakten är 0 kr.
- Lägg bara till raden i det som skickas till createCheckoutSession, inte i order.lines.

Ändra inte frontend eller webhooken. Förklara kort varför servern frågar PostNord en gång till.
```

**Resultat:** 
Implementerat:

Checkout validerar och sparar normaliserat postnummer. Ombud krävs för ombudsfrakt och verifieras mot PostNord före ordern; hemleverans ignorerar pickup_point_id och gör inget PostNord-anrop.
Ordern sparar fraktuppgifter och räknar frakt samt total i transaktionen. Ombudsnamn och adress hämtas från PostNords svar; frakten hamnar inte i order_items.
Stripe får frakten som en separat rad, endast när priset är över 0 kr. paymentAdapter.ts behövde inte ändras.
Migrationsändringen för fraktfälten fanns redan i arbetsytan.
Servern frågar PostNord igen eftersom klientens offert och val kan vara inaktuella eller manipulerade. Serverkontrollen bekräftar att ombudet faktiskt hör till postnumret och hämtar auktoritativa uppgifter innan ordern skapas.

Verifiering: npm run build --prefix backend och git diff --check passerade. Jag läste inte .env och körde inga kommandon som använder API-nycklar.

Ändrat: checkout-routes.ts, orders.ts.


## Steg 6: Frakten i kassan, på tacksidan och i admin

**Prompt:**
```
Visa frakten för kunden och på ordern. Ändra frontend/src/pages/Checkout.jsx, frontend/src/pages/ThankYou.jsx, frontend/src/pages/admin/OrderDetail.jsx, frontend/src/pages/Shop.css och GET /api/checkout/session/:sessionId i backend/src/routes/checkout-routes.ts. Läs inte .env och kör inga kommandon som läser filen eller använder API-nycklar.

Hämta frakten i Checkout.jsx:
- När kunden lämnar postnummerfältet: om värdet matchar /^\d{3} ?\d{2}$/ ska kassan anropa POST ${API_URL}/shipping/quote med postal_code och items ({ product_id, quantity }). Annars ska kunden se "Ange ett postnummer med fem siffror".
- När kunden ändrar postnumret ska det tidigare fraktförslaget, det valda ombudet och valet av frakt nollställas.
- Ett gammalt svar får inte skriva över ett nyare. Använd AbortController eller ett löpnummer.
- Visa att frakten laddas. Om anropet misslyckas ska kunden se ett begripligt fel och kunna försöka igen.

Visa frakten:
- Alternativen ombud och hemleverans med pris från svarets prices. Priset 0 visas som "Fri frakt". Övriga priser visas med formatPrice.
- Om ombud väljs ska kunden välja bland service_points i en lista med namn och adress.
- service_points === null: visa att ombuden inte kan hämtas just nu och att kunden kan välja hemleverans. Ombud ska då inte gå att välja.
- service_points är tom: visa att det saknas ombud för postnumret och att kunden kan välja hemleverans. Ombud ska då inte gå att välja.
- Om delivery.date finns: visa "Beräknad leverans: tisdag 27/10". Skapa datumet med new Date(år, månad - 1, dag) av strängens delar, aldrig new Date("YYYY-MM-DD"), eftersom det tolkas som UTC.
- Om bara delivery.day_range finns: visa "Beräknad leverans: 3–4 dagar".
- Om delivery är null: visa ingen leveransrad.

Sammanfattningen:
- När frakt är vald ska den visa varor, en fraktrad och totalen med goods_value och fraktpriset från svaret.
- Innan frakt är vald visas varorna och den nuvarande totalen.

Betalningen:
- Knappen är avstängd tills fraktförslaget finns, ett fraktalternativ är valt och, vid ombud, ett ombud är valt.
- Skicka shipping_method till POST /api/checkout. Skicka pickup_point_id bara för "pickup_point". Skicka aldrig något pris.
- Visa serverns felmeddelande och låt kunden ändra sitt val och försöka igen.

Tacksidan och admin:
- Lägg till shipping_method, shipping_price, pickup_point_name och pickup_point_address i SELECT i GET /api/checkout/session/:sessionId.
- Visa fraktalternativ och pris, samt ombudets namn och adress vid ombud, på ThankYou.jsx och OrderDetail.jsx. Priset 0 visas som "Fri frakt".
- MySQL kan returnera belopp som strängar, så använd Number().
- OrderDetail.jsx räknar i dag totalen från orderraderna, vilket missar frakten. Visa order.total och räkna från raderna bara om order.total är null.
- Gamla ordrar har null i fraktfälten. De ska inte visa någon fraktrad och ska inte krascha.

Styling:
- .shop-form input är gjord för textfält, så se till att radioknapparna ser rätt ut i Shop.css.

Ändra inget annat. Förklara kort hur du hindrar att ett gammalt svar skriver över ett nyare.
```

**Resultat:** 

Frakten visas nu i kassan, på tacksidan och i adminordern. Kassan hämtar pris och ombud från fraktofferten, och ordervyerna visar sparat fraktalternativ, pris och ombudsuppgifter. Gamla ordrar utan fraktuppgifter hanteras utan fraktrad.

För att hindra gamla offert­svar från att skriva över nyare avbryter jag föregående anrop och kontrollerar ett löpnummer innan svaret uppdaterar vyn.

Ändrat: Checkout.jsx, ThankYou.jsx, OrderDetail.jsx, Shop.css och checkout-routes.ts.

Frontend- och backendbyggen passerade. Lint kördes utan fel, men rapporterade varningar, bland annat en befintlig hook-varning i ThankYou.jsx. git diff --check passerade. .env lästes inte och inga kommandon använde API-nycklar.

## Steg 7: Felsökning

Hittade 2 buggar efter förra prompten så åtgärdar det också. 

**Prompt:** 
```
Rätta två saker i frontend/src/pages/Checkout.jsx. Läs inte .env och kör inga kommandon som läser filen eller använder API-nycklar.

1. delivery.day_range innehåller redan ordet "dagar", till exempel "3–4 dagar", men koden lägger till " dagar" en gång till. Ta bort tillägget så att det står "Beräknad leverans: 3–4 dagar".

2. Varje gång postnummerfältet tappar fokus hämtas frakten på nytt och kundens val nollställs, även om postnumret inte har ändrats. Om kunden står kvar i fältet och klickar på betalknappen försvinner valet och köpet går inte iväg. Hämta inte frakten igen när postnumret är samma som i det senast lyckade fraktförslaget. Försök igen-knappen ska fortfarande fungera efter ett fel.

Ändra inget annat.
```

**Resultat:** 
Båda sakerna är rättade i Checkout.jsx. En lyckad offert för samma normaliserade postnummer återanvänds vid fokusförlust; knappen för nytt försök fungerar efter fel.

Frontendbygget och git diff --check passerade. .env lästes inte, och inga kommandon använde API-nycklar.