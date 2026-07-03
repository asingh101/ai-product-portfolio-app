"use client";

import { useCallback, useRef, useState } from "react";
import type { FetchProfileResponse, ProfileInput, ProfileMeta } from "@/lib/role-align/types";

export type FetchPhase = "idle" | "fetching" | "success" | "error";

export function useRoleAlignProfileFetch() {
  const [phase, setPhase] = useState<FetchPhase>("idle");
  const [profile, setProfile] = useState<ProfileInput | null>(null);
  const [profileMeta, setProfileMeta] = useState<ProfileMeta | null>(null);
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("idle");
    setProfile(null);
    setProfileMeta(null);
    setError(null);
  }, []);

  const fetchProfile = useCallback(async (linkedInUrl: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase("fetching");
    setError(null);

    const apiUrl =
      process.env.NEXT_PUBLIC_ROLE_ALIGN_FETCH_URL ||
      process.env.NEXT_PUBLIC_CHAT_API_URL?.replace(/\/chat\/?$/, "/roleAlignFetchProfile") ||
      "";

    if (!apiUrl) {
      setError({
        message: "Profile fetch API is not configured.",
        retryable: false,
      });
      setPhase("error");
      return { ok: false as const };
    }

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedInUrl: linkedInUrl.trim() }),
        signal: controller.signal,
      });

      const data = (await res.json()) as FetchProfileResponse;

      if (!res.ok || !data.ok || !data.profile) {
        setError({
          message: data.message || "Could not load LinkedIn profile.",
          retryable: data.retryable ?? res.status >= 500,
        });
        setPhase("error");
        return { ok: false as const };
      }

      setProfile(data.profile);
      setProfileMeta(data.profileMeta ?? null);
      setPhase("success");
      return { ok: true as const, profile: data.profile, profileMeta: data.profileMeta };
    } catch (e) {
      if (controller.signal.aborted) return { ok: false as const };
      setError({
        message: e instanceof Error ? e.message : "Profile fetch failed",
        retryable: true,
      });
      setPhase("error");
      return { ok: false as const };
    }
  }, []);

  return {
    phase,
    profile,
    profileMeta,
    error,
    fetchProfile,
    reset,
  };
}
