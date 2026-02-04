type ApiPost = {
  id: number;
  title: string;
  category: string;
  createdAt: string;
};

type UiPost = {
  id: number;
  title: string;
  categoryLabel: string;
  date: string;
};

type CategoryMap = Record<string, string>;

const API_URL = "https://front-mission.bigs.or.kr/boards";
const CATEGORY_URL = "https://front-mission.bigs.or.kr/boards/categories";
const CATEGORY_ORDER = ["NOTICE", "FREE", "QNA", "ETC"];

const EMPTY_POSTS: ApiPost[] = [];
const EMPTY_CATEGORIES: CategoryMap = {};

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

async function fetchPosts(token: string): Promise<ApiPost[]> {
  const res = await fetch(`${API_URL}?page=0&size=10`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) return [];
  const payload = await res.json();
  return payload?.content ?? [];
}

async function fetchCategories(token: string): Promise<CategoryMap> {
  const res = await fetch(CATEGORY_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) return {};
  const payload = await res.json();
  return payload ?? {};
}

export default async function Home() {
  const token = process.env.BOARD_API_TOKEN;

  const [rawPosts, categoryMap] = token
    ? await Promise.all([fetchPosts(token), fetchCategories(token)])
    : [EMPTY_POSTS, EMPTY_CATEGORIES];

  const categoryLabels = CATEGORY_ORDER.map((key) => categoryMap[key]).filter(
    Boolean,
  );

  const posts: UiPost[] = rawPosts.map((post) => ({
    id: post.id,
    title: post.title,
    categoryLabel: categoryMap[post.category] ?? post.category ?? "기타",
    date: formatDate(post.createdAt),
  }));

  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#161616]">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 pb-16 pt-12">
        <header className="border-b border-[#2f2a24]/20 pb-6">
          <h1 className="text-2xl font-semibold md:text-3xl">게시판</h1>
        </header>

        <section className="flex flex-col gap-2 text-sm">
          <div className="grid grid-cols-[80px_1fr_120px] items-center gap-4 border-b border-[#2f2a24]/20 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6a6258]">
            <span>카테고리</span>
            <span>제목</span>
            <span>작성일</span>
          </div>
          {posts.length > 0 ? (
            posts.map((post) => (
              <article
                key={post.id}
                className="grid grid-cols-[80px_1fr_120px] items-center gap-4 border-b border-[#2f2a24]/10 py-3"
              >
                <span className="text-xs font-semibold text-[#161616]">
                  {post.categoryLabel}
                </span>
                <div className="flex flex-col gap-1">
                  <h2 className="text-sm font-medium text-[#161616]">
                    {post.title}
                  </h2>
                  <span className="text-[11px] text-[#6a6258]">
                    글 번호 {post.id}
                  </span>
                </div>
                <span className="text-xs text-[#6a6258]">{post.date}</span>
              </article>
            ))
          ) : (
            <div className="border-b border-[#2f2a24]/10 py-6 text-center text-xs text-[#6a6258]">
              표시할 글이 없습니다.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
