/**
 * One-off: update Beebizy user interviews 50+ → 30+ in site_content/resume
 * Run: node scripts/patch-beebizy-interviews.js
 */
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({ projectId: "asinghpm101" });
}

const db = admin.firestore();

async function main() {
  const ref = db.doc("site_content/resume");
  const snap = await ref.get();
  if (!snap.exists) {
    console.log("No site_content/resume doc, defaults in code will apply.");
    return;
  }

  const data = snap.data();
  const experiences = (data.experiences || []).map((exp) => {
    if (!String(exp.company || "").toLowerCase().includes("beebizy")) return exp;
    const metrics = (exp.metrics || []).map((m) =>
      m.label === "User Interviews" && m.value === "50+"
        ? { ...m, value: "30+" }
        : m
    );
    const achievements = (exp.achievements || []).map((a) =>
      typeof a === "string" ? a.replace(/50\+ user interviews/gi, "30+ user interviews") : a
    );
    return { ...exp, metrics, achievements };
  });

  await ref.set({ experiences }, { merge: true });
  console.log("Updated Beebizy entry in site_content/resume");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
