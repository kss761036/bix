"use client";

import { useEffect, useRef } from "react";
import { refreshAccessToken } from "@/app/lib/api";

export default function AuthRefreshGate() {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    refreshAccessToken().catch(() => {
      // ignore refresh errors at startup
    });

    const interval = window.setInterval(() => {
      refreshAccessToken().catch(() => {
        // ignore refresh errors during background refresh
      });
    }, 10 * 60 * 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
