"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LineButton from "@/app/components/LineButton";

export default function HeaderActions() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("-");
  const [userEmail, setUserEmail] = useState<string>("-");

  const decodeJwtPayload = (token: string) => {
    try {
      const payload = token.split(".")[1];
      if (!payload) return null;
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const json = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
          .join(""),
      );
      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      return null;
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("accessToken");
      window.localStorage.removeItem("refreshToken");
    }
    router.push("/auth/signin");
  };

  useEffect(() => {
    const updateUser = () => {
      if (typeof window === "undefined") return;
      const token = window.localStorage.getItem("accessToken");
      if (!token) {
        setUserName("-");
        setUserEmail("-");
        return;
      }
      const payload = decodeJwtPayload(token);
      const name =
        typeof payload?.name === "string" ? payload.name : undefined;
      const username =
        typeof payload?.username === "string" ? payload.username : undefined;
      setUserName(name ?? "-");
      setUserEmail(username ?? "-");
    };

    updateUser();
    const interval = window.setInterval(updateUser, 5000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="text-xs font-semibold text-[#161616] leading-tight">
        <span className="block">{userName}</span>
        <span className="block text-[#6a6258]">{userEmail}</span>
      </span>
      <LineButton href="/boards/new">글쓰기</LineButton>
      <LineButton onClick={handleLogout}>로그아웃</LineButton>
    </div>
  );
}
