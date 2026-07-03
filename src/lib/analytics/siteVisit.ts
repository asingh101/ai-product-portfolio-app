import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

const SESSION_KEY = "site_session_recorded";
const VISITOR_BASELINE = 105;
const STATS_REF = doc(db, "site_stats", "public");

async function ensureVisitorBaseline(): Promise<void> {
  try {
    const snap = await getDoc(STATS_REF);
    if (!snap.exists()) {
      await setDoc(STATS_REF, { totalUsers: VISITOR_BASELINE });
      return;
    }
    const current = snap.data().totalUsers;
    if (typeof current === "number" && current < VISITOR_BASELINE) {
      await updateDoc(STATS_REF, { totalUsers: VISITOR_BASELINE });
    }
  } catch {
    // Best-effort seed
  }
}

export function recordSiteVisit() {
  if (typeof window === "undefined") return;
  if (sessionStorage.getItem(SESSION_KEY)) return;

  sessionStorage.setItem(SESSION_KEY, "1");

  void (async () => {
    await ensureVisitorBaseline();
    try {
      await updateDoc(STATS_REF, { totalUsers: increment(1) });
    } catch {
      try {
        await setDoc(STATS_REF, { totalUsers: VISITOR_BASELINE });
      } catch {
        try {
          await updateDoc(STATS_REF, { totalUsers: increment(1) });
        } catch {
          // Ignore, counter is best-effort
        }
      }
    }
  })();
}

export async function fetchSiteUserCount(): Promise<number | null> {
  try {
    await ensureVisitorBaseline();
    const snap = await getDoc(STATS_REF);
    if (!snap.exists()) return VISITOR_BASELINE;
    const count = snap.data().totalUsers;
    return typeof count === "number" ? count : VISITOR_BASELINE;
  } catch {
    return null;
  }
}
