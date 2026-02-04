export async function POST(request: Request) {
  const body = await request.text();
  const upstream = await fetch("https://front-mission.bigs.or.kr/auth/signin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": request.headers.get("user-agent") ?? "Mozilla/5.0",
      Accept: request.headers.get("accept") ?? "*/*",
      Origin: request.headers.get("origin") ?? "",
      Referer: request.headers.get("referer") ?? "",
    },
    body,
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ?? "application/json",
    },
  });
}
