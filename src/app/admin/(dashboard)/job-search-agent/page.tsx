"use client";

import { useEffect } from "react";

export default function AdminJobSearchAgentRedirectPage() {
  useEffect(() => {
    window.location.replace("/admin/job-application-workflow-agent/");
  }, []);

  return (
    <main className="pt-12 text-on-surface-variant text-sm">Redirecting…</main>
  );
}
