const BASE_URL = "https://api.frankfurter.dev/v1";

export type Rates = {
    base: string;
    date: string;
    rates: Record<string, number>;
};

type FrankfurterResponse = {
    amount: number;
    base: string;
    date: string;
    rates: Record<string, number>;
};

// https://api.frankfurter.dev/v1/latest?base=SEK&symbols=SEK,EUR,USD,IDR
export async function getRates(
    base = "SEK",
    symbols: string[] = ["SEK", "EUR", "USD", "IDR"]
): Promise<Rates> {
    const url = new URL(`${BASE_URL}/latest`);
    url.searchParams.set("base", base);
    url.searchParams.set("symbols", symbols.join(','));

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Frankfurter svarade med felkod ${response.status}`);
        }

        const data = (await response.json()) as FrankfurterResponse;

        return { base: data.base, date: data.date, rates: data.rates };
    } catch (err) {
        throw new Error("Kunde inte hämta valutakurser");
    }
}