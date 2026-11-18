// Inloggning med Google via OAuth 2.0 och OpenID Connect (authorization code + PKCE).
// Googles tokens lämnar aldrig den här filen: vi läser kunden ur ID-token och slänger resten.

import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { fetchWithTimeout } from "../lib/fetchWithTimeouts.js";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "openid email profile";

export type GoogleProfile = { sub: string; email: string; name: string | null };

function getConfig() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri) {
        throw new Error("GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET eller GOOGLE_REDIRECT_URI saknas i .env.");
    }
    return {
        clientId,
        clientSecret,
        redirectUri,
        timeoutMs: Number(process.env.GOOGLE_TIMEOUT_MS ?? 5000),
    };
}

const GoogleTokenResponse = z.object({
    id_token: z.string().min(1),
});

const GoogleIdTokenClaims = z.object({
    iss: z.enum(["https://accounts.google.com", "accounts.google.com"]),
    aud: z.string(),
    exp: z.number(),
    sub: z.string().min(1).max(255),
    email: z.email().max(255),
    name: z.string().max(255).optional(),
});

export function createLoginAttempt() {
    const { clientId, redirectUri } = getConfig();
    const state = randomBytes(32).toString("base64url");
    const codeVerifier = randomBytes(32).toString("base64url");
    const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");

    const url = new URL(AUTH_URL);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", SCOPE);
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");

    return { url: url.toString(), state, codeVerifier };
}

export async function exchangeCodeForProfile(code: string, codeVerifier: string): Promise<GoogleProfile> {
    const { clientId, clientSecret, redirectUri, timeoutMs } = getConfig();

    const response = await fetchWithTimeout(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
            code_verifier: codeVerifier,
        }),
        timeoutMs,
    });

    const tokens = GoogleTokenResponse.safeParse(await response.json());
    if (!tokens.success) {
        throw new Error(`Google svarade med oväntat format:\n${z.prettifyError(tokens.error)}`);
    }

    // Signaturen kontrolleras inte: ID-token kom direkt från Googles token-endpoint över HTTPS,
    // och då räcker TLS enligt OpenID Connect Core 3.1.3.7. Kommer en ID-token någon annan väg
    // (t.ex. från webbläsaren) måste signaturen kontrolleras mot Googles nycklar.
    const payload = tokens.data.id_token.split(".")[1] ?? "";
    let rawClaims: unknown;
    try {
        rawClaims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    } catch {
        throw new Error("Googles ID-token gick inte att läsa.");
    }

    const claims = GoogleIdTokenClaims.safeParse(rawClaims);
    if (!claims.success) {
        throw new Error(`Googles ID-token har oväntat innehåll:\n${z.prettifyError(claims.error)}`);
    }
    if (claims.data.aud !== clientId) {
        throw new Error("Googles ID-token är utfärdad till en annan app (aud).");
    }
    if (claims.data.exp * 1000 < Date.now()) {
        throw new Error("Googles ID-token har gått ut (exp).");
    }

    return { sub: claims.data.sub, email: claims.data.email, name: claims.data.name ?? null };
}
