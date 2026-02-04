export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#161616]">
      <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-5 pb-20 pt-16">
        <header className="border-b border-[#2f2a24]/20 pb-5">
          <h1 className="text-2xl font-semibold">회원가입</h1>
          <p className="mt-2 text-sm text-[#6a6258]">
            이메일과 사용자 정보를 입력하세요.
          </p>
        </header>

        <form className="flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6a6258]">
              이메일
            </span>
            <input
              type="email"
              name="username"
              placeholder="developer@bigs.or.kr"
              className="h-11 rounded-md border border-[#2f2a24]/20 bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#161616]/40"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6a6258]">
              이름
            </span>
            <input
              type="text"
              name="name"
              placeholder="개발자"
              className="h-11 rounded-md border border-[#2f2a24]/20 bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#161616]/40"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6a6258]">
              비밀번호
            </span>
            <input
              type="password"
              name="password"
              placeholder="8자 이상, 특수문자 포함"
              className="h-11 rounded-md border border-[#2f2a24]/20 bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#161616]/40"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6a6258]">
              비밀번호 확인
            </span>
            <input
              type="password"
              name="confirmPassword"
              placeholder="비밀번호 다시 입력"
              className="h-11 rounded-md border border-[#2f2a24]/20 bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#161616]/40"
            />
          </label>

          <button
            type="submit"
            className="mt-2 h-11 rounded-md border border-[#161616] bg-[#161616] text-sm font-semibold text-[#f6f1e8]"
          >
            회원가입
          </button>
        </form>
      </main>
    </div>
  );
}
