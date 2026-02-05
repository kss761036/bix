"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/app/lib/api";
import LineButton from "@/app/components/LineButton";
import Image from "next/image";

type BoardDetail = {
  id: number;
  title: string;
  content: string;
  boardCategory: string;
  imageUrl?: string | null;
  createdAt: string;
  author?: string | null;
};

type CategoryMap = Record<string, string>;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://front-mission.bigs.or.kr";
const DETAIL_URL = `${API_BASE_URL}/boards`;
const CATEGORY_URL = `${API_BASE_URL}/boards/categories`;
const MEDIA_BASE_URL = API_BASE_URL;
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

export default function BoardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = String(params.id ?? "");
  const listPage = searchParams.get("page") ?? "1";

  const [detail, setDetail] = useState<BoardDetail | null>(null);
  const [categoryMap, setCategoryMap] = useState<CategoryMap>({});
  const [status, setStatus] = useState("로딩 중...");
  const [actionStatus, setActionStatus] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [detailRes, categoriesRes] = await Promise.all([
          apiFetch(`${DETAIL_URL}/${id}`, { cache: "no-store" }),
          apiFetch(CATEGORY_URL, { cache: "no-store" }),
        ]);

        if (!active) return;

        if (!detailRes.ok) {
          setStatus(`글을 불러오지 못했습니다. (HTTP ${detailRes.status})`);
          return;
        }

        const detailPayload = (await parseJsonSafe(detailRes)) as BoardDetail | null;
        setDetail(detailPayload);

        if (categoriesRes.ok) {
          const categoryPayload = await parseJsonSafe(categoriesRes);
          setCategoryMap(categoryPayload ?? {});
        } else {
          setCategoryMap({});
        }

        setStatus("");
      } catch {
        if (active) setStatus("네트워크 오류가 발생했습니다.");
      }
    };

    if (id) load();

    return () => {
      active = false;
    };
  }, [id]);

  const categoryLabel = useMemo(() => {
    if (!detail) return "";
    return (
      categoryMap[detail.boardCategory] ??
      CATEGORY_LABELS[detail.boardCategory] ??
      "기타"
    );
  }, [detail, categoryMap]);

  const resolveImageUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${MEDIA_BASE_URL}${url}`;
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = window.confirm("정말 삭제할까요?");
    if (!confirmed) return;

    setActionStatus("삭제 중...");
    try {
      const res = await apiFetch(`${DETAIL_URL}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setActionStatus(`삭제에 실패했습니다. (HTTP ${res.status})`);
        return;
      }
      setActionStatus("");
      router.push(`/?page=${listPage}`);
    } catch {
      setActionStatus("네트워크 오류가 발생했습니다.");
    }
  };

  if (!detail) {
    return (
      <div className="min-h-screen bg-[#f6f1e8] text-[#161616]">
        <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 pb-16 pt-12">
          <header className="flex items-center justify-between border-b border-[#2f2a24]/20 pb-6">
            <h1 className="text-2xl font-semibold md:text-3xl">게시글</h1>
            <button
              type="button"
              onClick={() => router.back()}
              className="h-9 rounded-md border border-[#2f2a24]/20 px-3 text-xs font-semibold text-[#161616]"
            >
              뒤로
            </button>
          </header>
          <div className="border-b border-[#2f2a24]/10 py-6 text-center text-xs text-[#6a6258]">
            {status}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#161616]">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 pb-16 pt-12">
        <header className="flex items-center justify-between border-b border-[#2f2a24]/20 pb-6">
          <h1 className="text-2xl font-semibold md:text-3xl">게시글</h1>
          <div className="flex items-center gap-2">
            <LineButton href={`/boards/${id}/edit`}>수정</LineButton>
            <LineButton onClick={handleDelete}>삭제</LineButton>
            <LineButton href={`/?page=${listPage}`}>목록</LineButton>
          </div>
        </header>

        <section className="flex flex-col gap-6 text-sm">
          <div className="flex flex-col gap-2 border-b border-[#2f2a24]/10 pb-4">
            <h2 className="text-2xl font-semibold text-[#161616]">
              {detail.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#6a6258]">
              <span>{categoryLabel}</span>
              <span>·</span>
              <span>{formatDateTime(detail.createdAt)}</span>
            </div>
          </div>

          <p className="whitespace-pre-wrap leading-7 text-[#2f2a24]">
            {detail.content}
          </p>

          {detail.imageUrl && (
            <Image
              src={resolveImageUrl(detail.imageUrl) ?? ""}
              alt=""
              width={800}
              height={600}
              unoptimized
              className="h-auto w-auto max-w-full self-start object-contain"
            />
          )}
          {actionStatus && (
            <p className="text-xs text-[#6a6258]" role="status">
              {actionStatus}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
