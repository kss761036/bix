const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://bix-sepia.vercel.app",
];

function getAllowedOrigins() {
  const raw = process.env.CORS_ALLOWED_ORIGINS;
  if (!raw) return DEFAULT_ALLOWED_ORIGINS;
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function getAllowOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return DEFAULT_ALLOWED_ORIGINS[0];
  const allowed = getAllowedOrigins();
  return allowed.includes(origin) ? origin : DEFAULT_ALLOWED_ORIGINS[0];
}

export function corsHeaders(request: Request) {
  return {
    "Access-Control-Allow-Origin": getAllowOrigin(request),
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

export function optionsResponse(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}

export async function proxyAuthPost(url: string, request: Request) {
  const body = await request.text();
  const upstream = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
    },
    body,
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      ...corsHeaders(request),
      "Content-Type":
        upstream.headers.get("content-type") ?? "application/json",
    },
  });
}
