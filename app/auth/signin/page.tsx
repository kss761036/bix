"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/app/lib/api";
import Link from "next/link";

type FieldErrors = {
  username?: string;
  password?: string;
};

type SignInResponse = {
  accessToken?: string;
  refreshToken?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const AUTH_BASE_URL = "https://front-mission.bigs.or.kr/auth";

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

function readToken(key: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function writeToken(key: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
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

export default function SignInPage() {
  const router = useRouter();
  const [values, setValues] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState("");

  const validate = (next = values) => {
    const nextErrors: FieldErrors = {};

    if (!next.username) {
      nextErrors.username = "이메일을 입력하세요.";
    } else if (!EMAIL_REGEX.test(next.username)) {
      nextErrors.username = "이메일 형식이 올바르지 않습니다.";
    }

    if (!next.password) {
      nextErrors.password = "비밀번호를 입력하세요.";
    } else if (!PASSWORD_REGEX.test(next.password)) {
      nextErrors.password =
        "8자 이상, 영문/숫자/특수문자 조합이어야 합니다.";
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  const handleChange =
    (key: keyof typeof values) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = { ...values, [key]: event.target.value };
      setValues(next);
      validate(next);
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) return;
    setStatus("로그인 요청 중...");

    try {
      const res = await apiFetch(`${AUTH_BASE_URL}/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
        }),
      });

      if (!res.ok) {
        let message = `로그인에 실패했습니다. (HTTP ${res.status})`;
        const errorBody = await parseJsonSafe(res);
        const detail = pickErrorMessage(errorBody);
        if (detail) message = detail;
        setStatus(message);
        return;
      }

      const payload = (await parseJsonSafe(res)) as SignInResponse | null;
      if (payload?.accessToken) writeToken("accessToken", payload.accessToken);
      if (payload?.refreshToken) writeToken("refreshToken", payload.refreshToken);

      setStatus("로그인 완료");
      router.push("/");
    } catch (error) {
      console.error(error);
      setStatus("네트워크 오류가 발생했습니다. 연결 상태를 확인하세요.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#161616]">
      <main className="mx-auto flex w-full max-w-[450px] flex-col gap-8 px-4 pb-20 pt-12 sm:px-5 sm:pt-16">
        <header className="border-b border-[#2f2a24]/20 pb-5">
          <h1 className="text-2xl font-semibold">로그인</h1>
          <p className="mt-2 text-sm text-[#6a6258]">
            이메일과 비밀번호로 로그인합니다.
          </p>
        </header>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6a6258]">
              이메일
            </span>
            <input
              type="email"
              name="username"
              value={values.username}
              onChange={handleChange("username")}
              placeholder="example@gmail.com"
              className="h-11 rounded-md border border-[#2f2a24]/20 bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#161616]/40"
            />
            {errors.username && (
              <span className="text-xs text-[#ef6a3a]">{errors.username}</span>
            )}
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6a6258]">
              비밀번호
            </span>
            <input
              type="password"
              name="password"
              value={values.password}
              onChange={handleChange("password")}
              className="h-11 rounded-md border border-[#2f2a24]/20 bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#161616]/40"
            />
            {errors.password && (
              <span className="text-xs text-[#ef6a3a]">{errors.password}</span>
            )}
          </label>

          <button
            type="submit"
            className="mt-2 h-11 rounded-md border border-[#161616] bg-[#161616] text-sm font-semibold text-[#f6f1e8]"
          >
            로그인
          </button>
          {status && (
            <p className="text-xs text-[#6a6258]" role="status">
              {status}
            </p>
          )}
        </form>

        <div className="flex flex-col gap-3 border-t border-[#2f2a24]/10 pt-4">
          <Link
            href="/auth/signup"
            className="h-11 rounded-md border border-[#2f2a24]/20 px-3 text-center text-sm font-semibold leading-[44px] text-[#161616]"
          >
            회원가입
          </Link>
        </div>
      </main>
    </div>
  );
}
