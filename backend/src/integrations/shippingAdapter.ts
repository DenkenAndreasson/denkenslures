// PostNord vill ha nyckeln i URL:en, så URL:en får aldrig hamna i loggar eller felmeddelanden.
// Därför används inte fetchWithTimeout, som skriver ut URL:en i sina fel.
// Av samma skäl sätts inget cause på felen nedan.

import { z } from "zod";

const NEAREST_PATH = "/rest/businesslocation/v5/servicepoints/nearest/byaddress";
const TRANSIT_TIME_PATH = "/rest/transport/v2/transittime/addresstoaddress";
const COUNTRY_CODE = "SE";
const NUMBER_OF_SERVICE_POINTS = 5;
const TRANSIT_TIME_SERVICE_CODE = "19";

// Ett ombud så som shoppen ser det
export type ServicePoint = {
    id: string;
    name: string;
    address: string;
    postal_code: string;
    city: string;
};

// Läses när de behövs, inte när filen laddas.
// Saknas nyckeln kraschar alltså inte hela servern, bara frakten svarar med fel.
function getConfig() {
    return {
        apiUrl: process.env.POSTNORD_API_URL ?? "",
        apiKey: process.env.POSTNORD_API_KEY ?? "",
        timeoutMs: Number(process.env.POSTNORD_TIMEOUT_MS ?? 5000),
        shopPostalCode: process.env.SHOP_POSTAL_CODE ?? "",
    };
}

const PostNordServicePoint = z.object({
    name: z.string().min(1),
    servicePointId: z.string().min(1),
    visitingAddress: z.object({
        streetName: z.string().min(1),
        streetNumber: z.string().nullable().optional(),
        postalCode: z.string().min(1),
        city: z.string().min(1),
    }),
});

const PostNordResponse = z.object({
    servicePointInformationResponse: z.object({
        servicePoints: z.array(z.unknown()),
    }),
});

const PostNordTransitTimeRow = z.object({
    service: z.object({
        basicServiceCode: z.string(),
        additionalServices: z.unknown().optional(),
    }),
    estimatedTimeOfArrival: z.object({
        timeOfArrival: z.string().nullish(),
        dayRangeOfArrival: z.object({
            daysMinimum: z.number(),
            daysMaximum: z.number(),
        }).nullish(),
    }).optional(),
    errorMessage: z.unknown().optional(),
});

type PostNordServicePoint = z.infer<typeof PostNordServicePoint>;

// PostNords format → vårt.
function toServicePoint(point: PostNordServicePoint): ServicePoint {
    const { streetName, streetNumber, postalCode, city } = point.visitingAddress;
    return {
        id: point.servicePointId,
        name: point.name,
        address: streetNumber ? `${streetName} ${streetNumber}` : streetName,
        postal_code: postalCode,
        city,
    };
}

async function fetchFromPostNord(url: URL, timeoutMs: number): Promise<unknown> {
    let response: Response;
    try {
        response = await fetch(url.toString(), {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(timeoutMs),
        });
    } catch (err) {
        if (err instanceof Error && err.name === "TimeoutError") {
            throw new Error(`PostNord svarade inte inom ${timeoutMs} ms (timeout)`);
        }
        throw new Error("Kunde inte nå PostNord (nätverksfel)");
    }

    if (!response.ok) {
        throw new Error(`PostNord svarade med status ${response.status}`);
    }

    try {
        return await response.json();
    } catch {
        throw new Error("PostNord skickade ett svar som inte gick att läsa");
    }
}

// postalCode ska redan vara validerat med PostalCode, dvs. på formen "12345".
export async function findServicePoints(postalCode: string): Promise<ServicePoint[]> {
    const { apiUrl, apiKey, timeoutMs } = getConfig();
    if (!apiKey) {
        throw new Error("POSTNORD_API_KEY saknas i .env.");
    }
    if (!apiUrl) {
        throw new Error("POSTNORD_API_URL saknas i .env.");
    }

    let url: URL;
    try {
        url = new URL(NEAREST_PATH, apiUrl);
    } catch {
        throw new Error("POSTNORD_API_URL är inte en giltig URL.");
    }
    url.searchParams.set("apikey", apiKey);
    url.searchParams.set("returnType", "json");
    url.searchParams.set("countryCode", COUNTRY_CODE);
    url.searchParams.set("postalCode", postalCode);
    url.searchParams.set("numberOfServicePoints", String(NUMBER_OF_SERVICE_POINTS));

    // 1. Fråga PostNord.
    const body = await fetchFromPostNord(url, timeoutMs);

    // 2. Kontrollera svaret.
    const parsed = PostNordResponse.safeParse(body);
    if (!parsed.success) {
        throw new Error(`PostNord svarade med oväntat format:\n${z.prettifyError(parsed.error)}`);
    }

    // 3. Trasiga ombud hoppas över.
    const rawPoints = parsed.data.servicePointInformationResponse.servicePoints;
    const points: PostNordServicePoint[] = [];
    for (const raw of rawPoints) {
        const point = PostNordServicePoint.safeParse(raw);
        if (!point.success) {
            console.warn("Frakt: hoppar över ett ombud med oväntat format:", z.prettifyError(point.error));
            continue;
        }
        points.push(point.data);
    }

    // Är alla trasiga är det ett fel, inte ett postnummer utan ombud.
    if (rawPoints.length > 0 && points.length === 0) {
        throw new Error("PostNord svarade med oväntat format: inget ombud gick att läsa");
    }

    // 4. Behåll PostNords ordning och returnera shoppens format.
    return points.slice(0, NUMBER_OF_SERVICE_POINTS).map(toServicePoint);
}

export async function estimateDelivery(
    toPostalCode: string,
): Promise<{ date: string | null; day_range: string | null }> {
    const { apiUrl, apiKey, timeoutMs, shopPostalCode } = getConfig();
    if (!apiKey) {
        throw new Error("POSTNORD_API_KEY saknas i .env.");
    }
    if (!apiUrl) {
        throw new Error("POSTNORD_API_URL saknas i .env.");
    }
    if (!shopPostalCode) {
        throw new Error("SHOP_POSTAL_CODE saknas i .env.");
    }

    let url: URL;
    try {
        url = new URL(TRANSIT_TIME_PATH, apiUrl);
    } catch {
        throw new Error("POSTNORD_API_URL är inte en giltig URL.");
    }
    url.searchParams.set("apikey", apiKey);
    url.searchParams.set("startTime", getStockholmStartTime());
    url.searchParams.set("serviceCodes", TRANSIT_TIME_SERVICE_CODE);
    url.searchParams.set("originPostalCode", shopPostalCode);
    url.searchParams.set("originCountryCode", COUNTRY_CODE);
    url.searchParams.set("destinationPostalCode", toPostalCode);
    url.searchParams.set("destinationCountryCode", COUNTRY_CODE);

    const body = await fetchFromPostNord(url, timeoutMs);
    const rows = z.array(z.unknown()).safeParse(body);
    if (!rows.success) {
        throw new Error("PostNord svarade med oväntat format för leveransuppskattning.");
    }

    const matchingRows = rows.data
        .map((row) => PostNordTransitTimeRow.safeParse(row))
        .filter((row) => row.success)
        .map((row) => row.data)
        .filter((row) =>
            row.service.basicServiceCode === TRANSIT_TIME_SERVICE_CODE
            && (row.service.additionalServices === undefined || row.service.additionalServices === null)
            && (row.errorMessage === undefined || row.errorMessage === null),
        );

    const result = matchingRows[0];
    if (!result) {
        throw new Error("PostNord kunde inte beräkna leverans för den valda tjänsten.");
    }

    const arrival = result.estimatedTimeOfArrival;
    if (!arrival || (!arrival.timeOfArrival && !arrival.dayRangeOfArrival)) {
        throw new Error("PostNord-svaret saknar ett giltigt leveransdatum eller dagintervall.");
    }

    if (arrival.timeOfArrival) {
        const date = arrival.timeOfArrival.slice(0, 10);
        if (!isValidCalendarDate(date)) {
            throw new Error("PostNord-svaret innehåller ett ogiltigt leveransdatum.");
        }
        return { date, day_range: null };
    }

    const dayRange = arrival.dayRangeOfArrival;
    if (!dayRange) {
        throw new Error("PostNord-svaret saknar ett giltigt leveransdatum eller dagintervall.");
    }
    const { daysMinimum, daysMaximum } = dayRange;
    return { date: null, day_range: `${daysMinimum}–${daysMaximum} dagar` };
}

function isValidCalendarDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    const daysInMonth = [
        31,
        year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28,
        31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
    ];
    return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth[month - 1];
}

function getStockholmStartTime(): string {
    const parts = new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Europe/Stockholm",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(new Date());
    const value = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value ?? "";

    return `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}`;
}
