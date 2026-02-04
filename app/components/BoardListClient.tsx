"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Pagination from "@mui/material/Pagination";
import HeaderActions from "@/app/components/HeaderActions";
import { apiFetch } from "@/app/lib/api";
import Image from "next/image";

type ApiPost = {
  id: number;
  title: string;
  category: string;
  createdAt: string;
  imageUrl?: string | null;
};

type UiPost = {
  id: number;
  title: string;
  categoryLabel: string;
  date: string;
  imageUrl?: string | null;
};

type CategoryMap = Record<string, string>;

const API_URL = "https://front-mission.bigs.or.kr/boards";
const CATEGORY_URL = "https://front-mission.bigs.or.kr/boards/categories";
const MEDIA_BASE_URL = "https://front-mission.bigs.or.kr";
const PAGE_SIZE = 10;
const CATEGORY_LABELS: CategoryMap = {
  NOTICE: "공지",
  FREE: "자유",
  QNA: "Q&A",
  ETC: "기타",
};

function formatDateTime(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16).replace("T", " ");
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

async function parseJsonSafe(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function BoardListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [categoryMap, setCategoryMap] = useState<CategoryMap>({});
  const [imageMap, setImageMap] = useState<Record<number, string | null>>({});
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const page = useMemo(() => {
    const value = Number(searchParams.get("page") ?? "1");
    return Number.isNaN(value) || value < 1 ? 1 : value;
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (typeof window !== "undefined") {
        const token = window.localStorage.getItem("accessToken");
        if (!token) {
          router.replace("/auth/signin");
          return;
        }
      }
      setIsLoading(true);
      try {
        const [postsRes, categoriesRes] = await Promise.all([
          apiFetch(`${API_URL}?page=${page - 1}&size=${PAGE_SIZE}`, {
            cache: "no-store",
          }),
          apiFetch(CATEGORY_URL, { cache: "no-store" }),
        ]);

        if (!active) return;

        if (!postsRes.ok) {
          if (postsRes.status === 401 || postsRes.status === 403) {
            router.replace("/auth/signin");
            return;
          }
          setStatus(
            `글 목록을 불러오지 못했습니다. (HTTP ${postsRes.status})`,
          );
          setPosts([]);
          setImageMap({});
          setTotalPages(1);
          setIsLoading(false);
          return;
        }

        const postPayload = await parseJsonSafe(postsRes);
        const items: ApiPost[] = postPayload?.content ?? [];
        setPosts(items);
        setTotalPages(Number(postPayload?.totalPages ?? 1));

        if (items.length > 0) {
          const detailResults = await Promise.all(
            items.map(async (item) => {
              const detailRes = await apiFetch(`${API_URL}/${item.id}`, {
                cache: "no-store",
              });
              if (!detailRes.ok) return [item.id, null] as const;
              const detailPayload = await parseJsonSafe(detailRes);
              return [item.id, detailPayload?.imageUrl ?? null] as const;
            }),
          );
          if (active) {
            setImageMap(
              detailResults.reduce<Record<number, string | null>>(
                (acc, [id, url]) => {
                  acc[id] = url;
                  return acc;
                },
                {},
              ),
            );
          }
        } else {
          setImageMap({});
        }

        if (categoriesRes.ok) {
          const categoryPayload = await parseJsonSafe(categoriesRes);
          setCategoryMap(categoryPayload ?? {});
        } else {
          setCategoryMap({});
        }

        setStatus("");
        setIsLoading(false);
      } catch {
        if (active) {
          setStatus("네트워크 오류가 발생했습니다.");
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [page]);

  const uiPosts: UiPost[] = useMemo(
    () =>
      posts.map((post) => ({
        id: post.id,
        title: post.title,
        categoryLabel:
          categoryMap[post.category] ??
          CATEGORY_LABELS[post.category] ??
          "기타",
        date: formatDateTime(post.createdAt),
        imageUrl: imageMap[post.id] ?? null,
      })),
    [posts, categoryMap, imageMap],
  );

  const resolveImageUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${MEDIA_BASE_URL}${url}`;
  };

  const skeletonRows = Array.from({ length: 6 }, (_, index) => index);

  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#161616]">
      <main className="mx-auto flex w-full max-w-[768px] flex-col gap-6 px-4 pb-16 pt-10 sm:px-5 sm:pt-12">
        <header className="flex items-center justify-between border-b border-[#2f2a24]/20 pb-6">
          <h1 className="text-2xl font-semibold md:text-3xl">게시판</h1>
          <HeaderActions />
        </header>

        <section className="flex flex-col text-sm">
          <div className="grid items-center border-b border-[#2f2a24]/20 pb-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#6a6258] min-[601px]:grid-cols-[80px_1fr_140px] max-[600px]:grid-cols-[64px_1fr] min-[601px]:gap-4 max-[600px]:gap-3">
            <span className="text-center">카테고리</span>
            <span className="text-center">제목</span>
            <span className="hidden text-center min-[601px]:block">작성일</span>
          </div>
          {isLoading ? (
            skeletonRows.map((row) => (
              <div
                key={row}
                className="grid items-center border-b border-[#2f2a24]/10 py-3 min-[601px]:grid-cols-[80px_1fr_140px] max-[600px]:grid-cols-[64px_1fr] min-[601px]:gap-4 max-[600px]:gap-3"
              >
                <div className="flex justify-center">
                  <div className="h-3 w-12 animate-pulse rounded bg-[#2f2a24]/10" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 animate-pulse rounded border border-[#2f2a24]/10 bg-[#2f2a24]/10" />
                  <div className="h-3 w-40 animate-pulse rounded bg-[#2f2a24]/10" />
                </div>
                <div className="hidden justify-center min-[601px]:flex">
                  <div className="h-3 w-20 animate-pulse rounded bg-[#2f2a24]/10" />
                </div>
              </div>
            ))
          ) : uiPosts.length > 0 ? (
            uiPosts.map((post) => (
              <Link
                key={post.id}
                href={`/boards/${post.id}?page=${page}`}
                className="grid items-center border-b border-[#2f2a24]/10 px-2 py-3 transition hover:bg-[#f2f2f2] min-[601px]:grid-cols-[80px_1fr_140px] max-[600px]:grid-cols-[64px_1fr] min-[601px]:gap-4 max-[600px]:gap-3"
              >
                <span className="text-center text-xs font-semibold text-[#161616]">
                  {post.categoryLabel}
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex min-w-0 items-center gap-3">
                    {post.imageUrl && (
                      <Image
                        src={resolveImageUrl(post.imageUrl) ?? ""}
                        alt=""
                        width={32}
                        height={32}
                        unoptimized
                        className="h-8 w-8 rounded border border-[#2f2a24]/20 object-cover"
                      />
                    )}
                    <span className="truncate text-sm font-medium text-[#161616]">
                      {post.title}
                    </span>
                  </div>
                  <span className="text-xs text-[#6a6258] min-[601px]:hidden">
                    {post.date}
                  </span>
                </div>
                <span className="hidden text-center text-xs text-[#6a6258] min-[601px]:block">
                  {post.date}
                </span>
              </Link>
            ))
          ) : (
            <div className="border-b border-[#2f2a24]/10 py-6 text-center text-xs text-[#6a6258]">
              {status || "표시할 글이 없습니다."}
            </div>
          )}
        </section>

        {totalPages > 1 && (
          <div className="flex justify-center pt-4">
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => {
                router.replace(`/?page=${value}`);
              }}
              shape="rounded"
              size="small"
            />
          </div>
        )}
      </main>
    </div>
  );
}
