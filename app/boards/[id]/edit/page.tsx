"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/app/lib/api";

type BoardDetail = {
  id: number;
  title: string;
  content: string;
  boardCategory: string;
  imageUrl?: string | null;
  createdAt: string;
};

type FieldErrors = {
  title?: string;
  content?: string;
  category?: string;
};

const DETAIL_URL = "https://front-mission.bigs.or.kr/boards";
const MEDIA_BASE_URL = "https://front-mission.bigs.or.kr";
const CATEGORY_OPTIONS = [
  { value: "NOTICE", label: "공지" },
  { value: "FREE", label: "자유" },
  { value: "QNA", label: "Q&A" },
  { value: "ETC", label: "기타" },
];

async function parseJsonSafe(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function pickErrorMessage(errorBody: unknown) {
  if (!errorBody || typeof errorBody !== "object") return null;
  const body = errorBody as Record<string, unknown>;
  const direct =
    body.message ?? body.error ?? body.detail ?? body.statusMessage ?? null;
  if (typeof direct === "string") return direct;

  for (const value of Object.values(body)) {
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      if (typeof first === "string") return first;
    }
  }
  return null;
}

export default function EditBoardPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = String(params.id ?? "");
  const listPage = searchParams.get("page") ?? "1";

  const [values, setValues] = useState({
    title: "",
    content: "",
    category: "NOTICE",
  });
  const [detail, setDetail] = useState<BoardDetail | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState("로딩 중...");
  const [statusIsError, setStatusIsError] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await apiFetch(`${DETAIL_URL}/${id}`, { cache: "no-store" });
        if (!active) return;
        if (!res.ok) {
          setStatus(`글을 불러오지 못했습니다. (HTTP ${res.status})`);
          setStatusIsError(true);
          return;
        }
        const payload = (await parseJsonSafe(res)) as BoardDetail | null;
        if (!payload) {
          setStatus("글을 불러오지 못했습니다.");
          setStatusIsError(true);
          return;
        }
        setDetail(payload);
        setValues({
          title: payload.title ?? "",
          content: payload.content ?? "",
          category: payload.boardCategory ?? "NOTICE",
        });
        setStatus("");
        setStatusIsError(false);
      } catch {
        if (active) {
          setStatus("네트워크 오류가 발생했습니다.");
          setStatusIsError(true);
        }
      }
    };

    if (id) load();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const validate = (next = values) => {
    const nextErrors: FieldErrors = {};
    if (!next.title) nextErrors.title = "제목을 입력하세요.";
    if (!next.content) nextErrors.content = "내용을 입력하세요.";
    if (!next.category) nextErrors.category = "카테고리를 선택하세요.";
    setErrors(nextErrors);
    return nextErrors;
  };

  const handleChange =
    (key: keyof typeof values) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const next = { ...values, [key]: event.target.value };
      setValues(next);
      validate(next);
    };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    if (!nextFile) {
      setFile(null);
      setFileError("");
      return;
    }

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/svg+xml",
    ];
    const maxBytes = 1024 * 1024;

    if (!allowedTypes.includes(nextFile.type)) {
      setFile(null);
      setFileError("PNG, JPG, WEBP, SVG만 업로드 가능합니다.");
      return;
    }

    if (nextFile.size > maxBytes) {
      setFile(null);
      setFileError("파일 용량은 1MB 이하만 가능합니다.");
      return;
    }

    setFile(nextFile);
    setFileError("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("수정 중...");
    setStatusIsError(false);

    const formData = new FormData();
    const requestBlob = new Blob([JSON.stringify(values)], {
      type: "application/json",
    });
    formData.append("request", requestBlob);
    if (file) formData.append("file", file);

    try {
      const res = await apiFetch(`${DETAIL_URL}/${id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!res.ok) {
        let message = `수정에 실패했습니다. (HTTP ${res.status})`;
        const errorBody = await parseJsonSafe(res);
        const detail = pickErrorMessage(errorBody);
        if (detail) message = detail;
        setStatus(message);
        setStatusIsError(true);
        return;
      }

      setStatus("수정 완료");
      setStatusIsError(false);
      router.push(`/boards/${id}?page=${listPage}`);
    } catch {
      setStatus("네트워크 오류가 발생했습니다.");
      setStatusIsError(true);
    }
  };

  const resolveImageUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${MEDIA_BASE_URL}${url}`;
  };

  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#161616]">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 pb-16 pt-12">
        <header className="flex items-center justify-between border-b border-[#2f2a24]/20 pb-6">
          <h1 className="text-2xl font-semibold md:text-3xl">글 수정</h1>
          <button
            type="button"
            onClick={() => router.back()}
            className="h-9 rounded-md border border-[#2f2a24]/20 px-3 text-xs font-semibold text-[#161616]"
          >
            취소
          </button>
        </header>

        <form className="flex flex-col gap-5 text-sm" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6a6258]">
              카테고리
            </span>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((option) => {
                const selected = values.category === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setValues((prev) => ({
                        ...prev,
                        category: option.value,
                      }))
                    }
                    className={`h-9 rounded-md border px-3 text-xs font-semibold transition ${
                      selected
                        ? "border-[#161616] bg-[#161616] text-[#f6f1e8]"
                        : "border-[#2f2a24]/20 bg-transparent text-[#161616]"
                    } cursor-pointer`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {errors.category && (
              <span className="text-xs text-[#ef6a3a]">{errors.category}</span>
            )}
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6a6258]">
              제목
            </span>
            <input
              type="text"
              name="title"
              value={values.title}
              onChange={handleChange("title")}
              className="h-11 rounded-md border border-[#2f2a24]/20 bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#161616]/40"
            />
            {errors.title && (
              <span className="text-xs text-[#ef6a3a]">{errors.title}</span>
            )}
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6a6258]">
              내용
            </span>
            <textarea
              name="content"
              rows={6}
              value={values.content}
              onChange={handleChange("content")}
              className="rounded-md border border-[#2f2a24]/20 bg-transparent px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#161616]/40"
            />
            {errors.content && (
              <span className="text-xs text-[#ef6a3a]">{errors.content}</span>
            )}
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6a6258]">
              이미지 (선택)
            </span>
            <div className="flex flex-col gap-2 rounded-md border border-[#2f2a24]/20 px-3 py-2">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleFileChange}
                className="cursor-pointer text-xs text-[#6a6258] file:mr-3 file:h-9 file:cursor-pointer file:rounded-md file:border file:border-[#2f2a24]/30 file:bg-transparent file:px-3 file:text-xs file:font-semibold file:text-[#161616]"
              />
              <span className="text-xs text-[#6a6258]">
                {file ? file.name : "선택된 파일 없음"}
              </span>
              {fileError && (
                <span className="text-xs text-[#ef6a3a]">{fileError}</span>
              )}
            </div>
          </label>

          {previewUrl && (
            <div className="overflow-hidden rounded-md border border-[#2f2a24]/20 bg-white">
              <img
                src={previewUrl}
                alt="미리보기"
                className="h-48 w-full object-contain"
              />
            </div>
          )}

          <button
            type="submit"
            className="h-11 cursor-pointer rounded-md border border-[#161616] bg-[#161616] text-sm font-semibold text-[#f6f1e8]"
          >
            저장
          </button>
          {status && (
            <p
              className={`text-xs ${
                statusIsError ? "text-[#ef6a3a]" : "text-[#6a6258]"
              }`}
              role="status"
            >
              {status}
            </p>
          )}
        </form>

        {values.title === "" && status && (
          <div className="text-xs text-[#6a6258]">{status}</div>
        )}

        {detail?.imageUrl && !previewUrl && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6a6258]">
              기존 이미지
            </span>
            <img
              src={resolveImageUrl(detail.imageUrl) ?? ""}
              alt="기존 이미지"
              className="h-auto max-w-full w-auto self-start object-contain"
            />
          </div>
        )}
      </main>
    </div>
  );
}
