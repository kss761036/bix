"use client";

import { useState } from "react";

type FieldErrors = {
  username?: string;
  name?: string;
  password?: string;
  confirmPassword?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function SignUpPage() {
  const [values, setValues] = useState({
    username: "",
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  const validate = (next = values) => {
    const nextErrors: FieldErrors = {};

    if (!next.username) {
      nextErrors.username = "이메일을 입력하세요.";
    } else if (!EMAIL_REGEX.test(next.username)) {
      nextErrors.username = "이메일 형식이 올바르지 않습니다.";
    }

    if (!next.name) {
      nextErrors.name = "이름을 입력하세요.";
    }

    if (!next.password) {
      nextErrors.password = "비밀번호를 입력하세요.";
    } else if (!PASSWORD_REGEX.test(next.password)) {
      nextErrors.password = "8자 이상, 영문/숫자/특수문자 조합이어야 합니다.";
    }

    if (!next.confirmPassword) {
      nextErrors.confirmPassword = "비밀번호 확인을 입력하세요.";
    } else if (next.confirmPassword !== next.password) {
      nextErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) return;
  };

  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#161616]">
      <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-5 pb-20 pt-16">
        <header className="border-b border-[#2f2a24]/20 pb-5">
          <h1 className="text-2xl font-semibold">회원가입</h1>
          <p className="mt-2 text-sm text-[#6a6258]">
            이메일과 사용자 정보를 입력하세요.
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
              이름
            </span>
            <input
              type="text"
              name="name"
              value={values.name}
              onChange={handleChange("name")}
              placeholder="홍길동"
              className="h-11 rounded-md border border-[#2f2a24]/20 bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#161616]/40"
            />
            {errors.name && (
              <span className="text-xs text-[#ef6a3a]">{errors.name}</span>
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
              placeholder="8자 이상, 영문/숫자/특수문자 포함"
              className="h-11 rounded-md border border-[#2f2a24]/20 bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#161616]/40"
            />
            {errors.password && (
              <span className="text-xs text-[#ef6a3a]">{errors.password}</span>
            )}
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6a6258]">
              비밀번호 확인
            </span>
            <input
              type="password"
              name="confirmPassword"
              value={values.confirmPassword}
              onChange={handleChange("confirmPassword")}
              placeholder="비밀번호 다시 입력"
              className="h-11 rounded-md border border-[#2f2a24]/20 bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#161616]/40"
            />
            {errors.confirmPassword && (
              <span className="text-xs text-[#ef6a3a]">
                {errors.confirmPassword}
              </span>
            )}
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
