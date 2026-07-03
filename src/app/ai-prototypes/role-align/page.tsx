"use client";

import { useEffect } from "react";

export default function RoleAlignRedirectPage() {
  useEffect(() => {
    window.location.replace("/ai-prototypes/profile-optimization?tab=linkedin");
  }, []);

  return (
    <main className="pt-28 pb-24 px-6 text-center">
      <p className="text-on-surface-variant">Redirecting to Profile Optimization…</p>
    </main>
  );
}
