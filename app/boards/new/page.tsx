"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/app/lib/api";
import Image from "next/image";

type FieldErrors = {
  title?: string;
  content?: string;
  category?: string;
};

const BOARD_URL = "https://front-mission.bigs.or.kr/boards";
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

export default function NewBoardPage() {
  const router = useRouter();
  const [values, setValues] = useState({
    title: "",
    content: "",
    category: "NOTICE",
  });
  const [file, setFile] = useState<File | null>(null);
  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);
  const [fileError, setFileError] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState("");
  const [statusIsError, setStatusIsError] = useState(false);

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("글 등록 중...");
    setStatusIsError(false);

    const formData = new FormData();
    const requestBlob = new Blob([JSON.stringify(values)], {
      type: "application/json",
    });
    formData.append("request", requestBlob);
    if (file) formData.append("file", file);

    try {
      const res = await apiFetch(BOARD_URL, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let message = `글 등록에 실패했습니다. (HTTP ${res.status})`;
        const errorBody = await parseJsonSafe(res);
        const detail = pickErrorMessage(errorBody);
        if (detail) message = detail;
        if (typeof message === "string" && message.includes("Data too long")) {
          message = "길이 제한";
        }
        setStatus(message);
        setStatusIsError(true);
        return;
      }

      setStatus("글 등록 완료");
      setStatusIsError(false);
      router.push("/");
    } catch (error) {
      console.error(error);
      setStatus("네트워크 오류가 발생했습니다. 연결 상태를 확인하세요.");
      setStatusIsError(true);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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

  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#161616]">
      <main className="mx-auto flex w-full max-w-[768px] flex-col gap-6 px-4 pb-16 pt-10 sm:px-5 sm:pt-12">
        <header className="border-b border-[#2f2a24]/20 pb-6">
          <h1 className="text-2xl font-semibold md:text-3xl">글쓰기</h1>
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
                      setValues((prev) => ({ ...prev, category: option.value }))
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
          {previewUrl && (
            <div className="mt-2 overflow-hidden rounded-md border border-[#2f2a24]/20 bg-white">
              <Image
                src={previewUrl}
                alt="미리보기"
                width={800}
                height={600}
                unoptimized
                className="h-48 w-auto max-w-full object-contain"
              />
            </div>
          )}
          </label>

          <button
            type="submit"
            className="h-11 cursor-pointer rounded-md border border-[#161616] bg-[#161616] text-sm font-semibold text-[#f6f1e8]"
          >
            등록
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
      </main>
    </div>
  );
}
