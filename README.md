# BIX 배포 링크

# https://bix-sepia.vercel.app

# 실행 방법

1. 프로젝트를 클론한 뒤 폴더로 이동합니다.
2. 의존성을 설치합니다.
3. `.env.local` 파일을 만들고 환경변수를 설정합니다.
4. 개발 서버를 실행합니다.

```bash
git clone <repo-url>
cd bix
npm install
```

`.env.local`

```env
NEXT_PUBLIC_API_BASE_URL=https://front-mission.bigs.or.kr
```

실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 으로 접속하면 됩니다.
