// Lokalt körs backend på en egen port (3000), i produktion ligger den på
// samma domän som frontend (Vercel serverless-funktion under /api).
export const API_URL = import.meta.env.DEV ? "http://localhost:3000/api" : "/api";
