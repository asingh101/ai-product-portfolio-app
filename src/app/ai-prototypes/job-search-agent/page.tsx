"use client";

import { useEffect } from "react";
import { JOB_APPLICATION_WORKFLOW_AGENT_PATH } from "@/lib/job-search-agent/constants";

export default function JobSearchAgentRedirectPage() {
  useEffect(() => {
    window.location.replace(`${JOB_APPLICATION_WORKFLOW_AGENT_PATH}/`);
  }, []);

  return (
    <main className="pt-28 pb-24 px-6 text-center">
      <p className="text-on-surface-variant">Redirecting to Job Application Workflow Agent…</p>
    </main>
  );
}
