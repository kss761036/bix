"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LineButton from "@/app/components/LineButton";

export default function HeaderActions() {
  const router = useRouter();
  const [lastRefresh, setLastRefresh] = useState<string>("-");

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("accessToken");
      window.localStorage.removeItem("refreshToken");
    }
    router.push("/auth/signin");
  };

  useEffect(() => {
    const update = () => {
      if (typeof window === "undefined") return;
      const stored = window.localStorage.getItem("lastRefreshAt");
      setLastRefresh(stored ? stored : "-");
    };
    update();
    const interval = window.setInterval(update, 3000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-[#6a6258]">
        마지막 갱신: {lastRefresh}
      </span>
      <LineButton href="/boards/new">글쓰기</LineButton>
      <LineButton onClick={handleLogout}>로그아웃</LineButton>
    </div>
  );
}
