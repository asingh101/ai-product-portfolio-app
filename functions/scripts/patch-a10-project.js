/**
 * Patch A10 ADC portfolio project copy in Firestore (by slug).
 * Run from functions/: node scripts/patch-a10-project.js
 */
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({ projectId: "asinghpm101" });
}

const db = admin.firestore();

const SLUG = "product-strategy-a10-ai-application-delivery-controller-adc";

const ABOUT = `In November 2025, I won the A10 Networks Agentic AI Product Management Hackathon. The strategy was compelling enough that A10's leadership invited me to present it to their executive team, turning a competition entry into a real product conversation.

The problem I tackled: enterprise networks are under attack like never before. AI-powered threats are faster, smarter, and harder to stop, and traditional Application Delivery Controllers were not built for this. I built a product strategy and go-to-market positioning for A10's upcoming AI ADC, focused on three things: how to position it against existing solutions, what would convince an enterprise security buyer to choose it, and why deploying it inside their network was worth the investment.

The answer came down to one core idea. A10's AI ADC detects threats and adapts in real time, at the speed of the network, without slowing anything down. Unlike traditional ADCs that rely on static rule sets, A10's AI layer continuously learns traffic patterns, identifies anomalies, and responds to threats before they reach critical infrastructure. For enterprise buyers, that means stronger security posture without the tradeoff of added latency or operational complexity. That is the value proposition that wins in enterprise security.`;

const patch = {
  title: "Product Strategy + GTM",
  description: "Won the hackathon. Got invited to the boardroom.",
  blocks: [
    { type: "heading", data: { text: "About this project", level: 2 } },
    { type: "text", data: { text: ABOUT } },
    {
      type: "docs",
      data: {
        deckUrl: "/portfolio/A10_AI_ADC_Case_Study.pdf",
        reportUrl: "",
        reportButtonText: "Download presentation",
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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
