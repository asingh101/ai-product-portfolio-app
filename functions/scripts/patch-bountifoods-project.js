/**
 * Patch BountiFoods portfolio project copy in Firestore (by slug).
 * Run from functions/: node scripts/patch-bountifoods-project.js
 */
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({ projectId: "asinghpm101" });
}

const db = admin.firestore();

const SLUG = "brand-strategy-and-brand-audit-analysis";
const DEPRECATED_SLUG = "bountifoods-brand-audit";

const ABOUT = `In Winter 2026, I worked directly with the CEO of BountiFoods as an independent brand consultant. BountiFoods operates in Silicon Valley's competitive food and catering space, and the engagement was focused on a clear set of outcomes: strengthen brand visibility, sharpen differentiation from competitors, and build lasting brand value.

I approached this as I would any serious consulting engagement. I started with an in-depth brand audit, looking honestly at where BountiFoods stood against the market and where the gaps were. I combined that with primary and secondary market research on Silicon Valley's food and catering landscape, understanding who the real competitors were, how they positioned themselves, and where the whitespace existed. I also spent time inside the business, understanding how the company operated, what its strengths were, and what the brand story actually was versus how it was being communicated externally.

This consultation was done as part of my Achieving Brand Leadership course, with BountiFoods as the real-world client. I provided the CEO with tailored recommendations covering why branding fundamentally matters for a business at their stage, what brand architecture BountiFoods should explore to best capture market share, and the specific steps they could take to sharpen their competitive positioning and grow their presence in the Silicon Valley market.`;

const patch = {
  title: "BountiFoods: Brand Strategy + Brand Audit",
  description:
    "Independent brand consultation for a Silicon Valley food and catering business.",
  blocks: [
    { type: "heading", data: { text: "About this project", level: 2 } },
    { type: "text", data: { text: ABOUT } },
    {
      type: "docs",
      data: {
        deckUrl: "/portfolio/BountiFoods_Brand_Audit.pdf",
        reportUrl: "/portfolio/BountiFoods_Brand_Audit.pdf",
        reportButtonText: "Download Report",
      },
    },
  ],
};

async function main() {
  const snap = await db.collection("projects").where("slug", "==", SLUG).get();
  if (snap.empty) {
    console.log(`No project with slug ${SLUG}, bundled overlay in app will apply.`);
    return;
  }

  for (const doc of snap.docs) {
    const existing = doc.data();
    const extras = (existing.blocks || []).filter(
      (b) => b.type === "gallery" || b.type === "image"
    );
    await doc.ref.set(
      { ...patch, blocks: [...patch.blocks, ...extras] },
      { merge: true }
    );
    console.log(`Patched projects/${doc.id} (${SLUG})`);
  }

  const deprecated = await db.collection("projects").where("slug", "==", DEPRECATED_SLUG).get();
  for (const doc of deprecated.docs) {
    await doc.ref.set({ status: "draft" }, { merge: true });
    console.log(`Deprecated duplicate projects/${doc.id} (${DEPRECATED_SLUG})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
