"use client";

import { useRouter } from "next/navigation";
import LineButton from "@/app/components/LineButton";

export default function HeaderActions() {
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("accessToken");
      window.localStorage.removeItem("refreshToken");
    }
    router.push("/auth/signin");
  };

  return (
    <div className="flex items-center gap-3">
      <LineButton href="/boards/new">글쓰기</LineButton>
      <LineButton onClick={handleLogout}>로그아웃</LineButton>
    </div>
  );
}
