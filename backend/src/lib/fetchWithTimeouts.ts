type FetchOptions = {
    headers?: Record<string, string>;
    timeoutMs?: number;
};

export async function fetchWithTimeout(
    url: string,
    { headers = {}, timeoutMs = 5000 }: FetchOptions = {}
): Promise<Response> {
    let response : Response
    
    try {
        response = await fetch(url, {
            headers,
            signal: AbortSignal.timeout(timeoutMs),
        });
} catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
        throw new Error(`Inget svar från ${url} inom ${timeoutMs} ms (timeout)`, { cause: err });
    }
    throw new Error (`Kunde inte nå ${url} (nätverksfel)`, { cause: err });
}

if (!response.ok) {
    throw new Error(`${url} svarade med status ${response.status} ${response.statusText}` );
}

return response;
}