"use client";

import { useEffect } from "react";
import { recordSiteVisit } from "@/lib/analytics/siteVisit";

export function useRecordSiteVisit(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    recordSiteVisit();
  }, [enabled]);
}
