type FetchOptions = {
    method?: string;
    headers?: Record<string, string>;
    body?: URLSearchParams;
    timeoutMs?: number;
};

export async function fetchWithTimeout(
    url: string,
    { method = "GET", headers = {}, body, timeoutMs = 5000 }: FetchOptions = {}
): Promise<Response> {
    let response : Response
    
    try {
        response = await fetch(url, {
            method,
            headers,
            body,
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