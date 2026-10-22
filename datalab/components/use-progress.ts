"use client";

import { useEffect, useState } from "react";

import { dataLabApi, progressSocketUrl } from "./api";
import { useAuth } from "./auth-provider";
import type { Language, LanguageProgress } from "./types";

type Board = { languages: Language[]; progress: Record<string, LanguageProgress> };

/**
 * Target languages and their live counts. Counts load once, then update as
 * data-lab.progress messages arrive over the WebSocket while signed in.
 */
function useProgress() {
  const { user, getToken } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([dataLabApi.languages(), dataLabApi.progress()])
      .then(([languages, progress]) => {
        if (cancelled) return;
        setBoard({
          languages: languages.filter((l) => l.role === "target"),
          progress: Object.fromEntries(progress.map((p) => [p.code, p])),
        });
      })
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let socket: WebSocket | null = null;
    let closed = false;
    getToken().then((token) => {
      if (closed) return;
      socket = new WebSocket(progressSocketUrl(token));
      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data) as { type: string; payload: LanguageProgress };
        if (msg.type !== "data-lab.progress") return;
        setBoard((b) => b && { ...b, progress: { ...b.progress, [msg.payload.code]: msg.payload } });
      };
    });
    return () => {
      closed = true;
      socket?.close();
    };
  }, [user, getToken]);

  return { board, error };
}

export { useProgress };
