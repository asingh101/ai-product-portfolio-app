const admin = require("firebase-admin");

const ALLOWED_TOOLS = new Set(["hub", "resume", "linkedin", "job_search_agent"]);
const ALLOWED_EVENTS = new Set([
  "view",
  "tab_view",
  "analyze_start",
  "analyze_complete",
  "analyze_fail",
  "rewrite_start",
  "rewrite_complete",
  "rewrite_fail",
  "cover_letter_start",
  "cover_letter_complete",
  "cover_letter_fail",
  "fetch_start",
  "fetch_complete",
  "fetch_fail",
]);

async function recordUsage(db, { tool, event }) {
  if (!ALLOWED_TOOLS.has(tool) || !ALLOWED_EVENTS.has(event)) {
    throw Object.assign(new Error("Invalid tool or event"), { code: "VALIDATION" });
  }

  const date = new Date().toISOString().slice(0, 10);
  const field = `${tool}.${event}`;
  const docRef = db.collection("tool_usage_daily").doc(date);

  await docRef.set(
    {
      [field]: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

function createRecordToolUsageHandler({ db }) {
  return async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const { tool, event } = req.body || {};
      if (!tool || !event) {
        res.status(400).json({ error: "tool and event required" });
        return;
      }

      await recordUsage(db, { tool, event });
      res.json({ ok: true });
    } catch (error) {
      if (error.code === "VALIDATION") {
        res.status(400).json({ error: error.message });
        return;
      }
      console.error("[recordToolUsage]", error);
      res.status(500).json({ error: "Failed to record usage" });
    }
  };
}

module.exports = { createRecordToolUsageHandler, recordUsage };
