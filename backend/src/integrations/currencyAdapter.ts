import { prettifyError, z } from "zod";
import { fetchWithTimeout } from "../lib/fetchWithTimeouts";

const BASE_URL = "https://api.frankfurter.dev/v1fdg";

export type Rates = {
    base: string;
    date: string;
    rates: Record<string, number>;
};

const FrankfurterResponse = z.object ({
    amount: z.number(),
    base: z.string(),
    date: z.string(),
    rates: z.record(z.string(), z.number().positive()),
});

export async function getRates(
    base = "SEK",
    symbols: string[] = ["SEK", "EUR", "USD", "IDR"]
): Promise<Rates> {
    const url = new URL(`${BASE_URL}/latest`)
    url.searchParams.set("base", base);
    url.searchParams.set("symbols", symbols.join(","));

    try {
        const response = await fetchWithTimeout(url.toString(), {
            timeoutMs: Number(process.env.CURRENCY_API_TIMEOUT_MS ?? 50000),
        });

        const parsed = FrankfurterResponse.safeParse(await response.json());
        if (!parsed.success) {
            throw new Error(`Frankfurter API svarade med oväntat format:
                \n ${prettifyError(parsed.error)}`);
        }

        const data = parsed.data;
        return { base: data.base, date: data.date, rates: data.rates };
    } catch (err) {
        throw new Error(`Kunde inte hämta valutakurserna`, { cause: err });
    }
}