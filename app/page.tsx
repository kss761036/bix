import { Suspense } from "react";
import BoardListClient from "@/app/components/BoardListClient";

export default function Home() {
  return (
    <Suspense fallback={<div />}>
      <BoardListClient />
    </Suspense>
  );
}
