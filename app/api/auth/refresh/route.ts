import { optionsResponse, proxyAuthPost } from "../_lib";

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function POST(request: Request) {
  return proxyAuthPost("https://front-mission.bigs.or.kr/auth/refresh", request);
}
