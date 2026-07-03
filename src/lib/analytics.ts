import { logEvent, Analytics } from "firebase/analytics";
import { initAnalytics } from "./firebase";
import { incrementField } from "./firestore";

let analyticsInstance: Analytics | null = null;

async function getAnalyticsInstance() {
  if (!analyticsInstance) {
    analyticsInstance = await initAnalytics();
  }
  return analyticsInstance;
}

// Track page view
export async function trackPageView(pagePath: string, pageTitle: string) {
  const analytics = await getAnalyticsInstance();
  if (analytics) {
    logEvent(analytics, "page_view", {
      page_path: pagePath,
      page_title: pageTitle,
    });
  }
}

// Track resume download
export async function trackResumeDownload() {
  const analytics = await getAnalyticsInstance();
  if (analytics) {
    logEvent(analytics, "file_download", {
      file_name: "resume.pdf",
      content_type: "application/pdf",
    });
  }
  // Also increment Firestore counter
  try {
    await incrementField("analytics", "global", "resumeDownloads");
  } catch {
    // Firestore write may fail for unauthenticated users
  }
}

// Track chatbot interaction
export async function trackChatInteraction(prompt: string) {
  const analytics = await getAnalyticsInstance();
  if (analytics) {
    logEvent(analytics, "chatbot_interaction", {
      prompt_length: prompt.length,
    });
  }
  try {
    await incrementField("analytics", "global", "chatbotInteractions");
  } catch {
    // Firestore write may fail for unauthenticated users
  }
}

// Track mentorship click
export async function trackMentorshipClick(serviceType: string) {
  const analytics = await getAnalyticsInstance();
  if (analytics) {
    logEvent(analytics, "mentorship_click", {
      service_type: serviceType,
    });
  }
}
