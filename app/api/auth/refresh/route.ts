export async function POST(request: Request) {
  const body = await request.text();
  const upstream = await fetch("https://front-mission.bigs.or.kr/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
