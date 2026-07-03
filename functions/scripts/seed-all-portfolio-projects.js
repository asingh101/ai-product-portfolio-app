/**
 * Seed all canonical portfolio projects into Firestore (idempotent).
 * Writes the full bundled content (text + docs/PDF blocks) so CMS matches the live site.
 *
 * Run from functions/: node scripts/seed-all-portfolio-projects.js
 */
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({ projectId: "asinghpm101" });
}

const db = admin.firestore();

const TESLA_STP_PDF = "/portfolio/Tesla_STP_Strategy_2025.pdf";
const A10_ADC_PDF = "/portfolio/A10_AI_ADC_Case_Study.pdf";
const BOUNTIFOODS_PDF = "/portfolio/BountiFoods_Brand_Audit.pdf";

const TESLA_STP_ABOUT = `This project is a full marketing strategy analysis of Tesla at a critical inflection point: rising competition, a polarizing CEO, and a brand perception gap that threatens its premium positioning. Working as part of a four-person team in a graduate-level Product Messaging and Positioning course (MKTG 3710), we applied the STP framework to identify Tesla's highest-opportunity customer groups, define a prioritized targeting strategy, and develop a differentiated positioning architecture grounded in Tesla's core competitive advantage: its integrated energy ecosystem.

The analysis began with a four-dimensional segmentation across demographic, psychographic, behavioral, and geographic variables, evaluated through a MASDA framework (Measurable, Accessible, Substantial, Differentiable, Actionable) to score segment viability. From there, we built a differentiated targeting model with three tiers: premium eco-conscious professionals at 70% focus, affluent urban residents locked out by charging access barriers at 20%, and aspirational Gen Z buyers at 10% as a long-term loyalty investment. The positioning statement, perceptual map, 4D message framework, and a three-level messaging hierarchy (100, 50, and 25 words) were developed to translate strategy into executional clarity. The analysis concluded with five strategic recommendations covering brand recovery, CEO brand risk, sub-branding architecture, and Tesla's pivot toward lifestyle-first communications.`;

const A10_ADC_ABOUT = `In November 2025, I won the A10 Networks Agentic AI Product Management Hackathon. The strategy was compelling enough that A10's leadership invited me to present it to their executive team, turning a competition entry into a real product conversation.

The problem I tackled: enterprise networks are under attack like never before. AI-powered threats are faster, smarter, and harder to stop, and traditional Application Delivery Controllers were not built for this. I built a product strategy and go-to-market positioning for A10's upcoming AI ADC, focused on three things: how to position it against existing solutions, what would convince an enterprise security buyer to choose it, and why deploying it inside their network was worth the investment.

The answer came down to one core idea. A10's AI ADC detects threats and adapts in real time, at the speed of the network, without slowing anything down. Unlike traditional ADCs that rely on static rule sets, A10's AI layer continuously learns traffic patterns, identifies anomalies, and responds to threats before they reach critical infrastructure. For enterprise buyers, that means stronger security posture without the tradeoff of added latency or operational complexity. That is the value proposition that wins in enterprise security.`;

const BOUNTIFOODS_ABOUT = `In Winter 2026, I worked directly with the CEO of BountiFoods as an independent brand consultant. BountiFoods operates in Silicon Valley's competitive food and catering space, and the engagement was focused on a clear set of outcomes: strengthen brand visibility, sharpen differentiation from competitors, and build lasting brand value.

I approached this as I would any serious consulting engagement. I started with an in-depth brand audit, looking honestly at where BountiFoods stood against the market and where the gaps were. I combined that with primary and secondary market research on Silicon Valley's food and catering landscape, understanding who the real competitors were, how they positioned themselves, and where the whitespace existed. I also spent time inside the business, understanding how the company operated, what its strengths were, and what the brand story actually was versus how it was being communicated externally.

This consultation was done as part of my Achieving Brand Leadership course, with BountiFoods as the real-world client. I provided the CEO with tailored recommendations covering why branding fundamentally matters for a business at their stage, what brand architecture BountiFoods should explore to best capture market share, and the specific steps they could take to sharpen their competitive positioning and grow their presence in the Silicon Valley market.`;

/** Canonical projects — keep in sync with src/lib/bundledPortfolioProjects.ts */
const CANONICAL_PROJECTS = [
  {
    id: "project-tesla-stp-2025",
    slug: "tesla-marketing-strategy-positioning",
    title: "Marketing Strategy + Positioning",
    category: "Marketing",
    description:
      "STP analysis of Tesla at a competitive inflection point, segmentation, differentiated targeting, positioning architecture, and messaging hierarchy (MKTG 3710).",
    tags: ["STP", "Tesla", "Positioning", "Segmentation", "MKTG 3710"],
    metrics: [
      { value: "4", label: "Team members" },
      { value: "3", label: "Target tiers" },
    ],
    thumbnail: "/images/portfolio/tesla-wordmark-thumb.png",
    status: "published",
    sortOrder: -10,
    blocks: [
      { type: "heading", data: { text: "About this project", level: 2 } },
      { type: "text", data: { text: TESLA_STP_ABOUT } },
      {
        type: "docs",
        data: {
          deckUrl: TESLA_STP_PDF,
          reportUrl: TESLA_STP_PDF,
          reportButtonText: "Download presentation",
        },
      },
    ],
  },
  {
    id: "project-a10-adc",
    slug: "product-strategy-a10-ai-application-delivery-controller-adc",
    title: "Product Strategy + GTM",
    category: "Product Management",
    description: "Won the hackathon. Got invited to the boardroom.",
    tags: ["Product Strategy", "GTM", "Agentic AI", "ADC", "Enterprise Security"],
    metrics: [
      { value: "1st", label: "Place" },
      { value: "2025", label: "Hackathon" },
    ],
    status: "published",
    sortOrder: -5,
    blocks: [
      { type: "heading", data: { text: "About this project", level: 2 } },
      { type: "text", data: { text: A10_ADC_ABOUT } },
      {
        type: "docs",
        data: {
          deckUrl: A10_ADC_PDF,
          reportUrl: "",
          reportButtonText: "Download presentation",
        },
      },
    ],
  },
  {
    id: "project-bountifoods-brand-audit",
    slug: "brand-strategy-and-brand-audit-analysis",
    title: "BountiFoods: Brand Strategy + Brand Audit",
    category: "Branding",
    description:
      "Independent brand consultation for a Silicon Valley food and catering business.",
    tags: ["Brand Audit", "Brand Strategy", "Consulting", "Silicon Valley", "Food & Catering"],
    metrics: [
      { value: "CEO", label: "Direct client" },
      { value: "2026", label: "Engagement" },
    ],
    status: "published",
    sortOrder: 0,
    blocks: [
      { type: "heading", data: { text: "About this project", level: 2 } },
      { type: "text", data: { text: BOUNTIFOODS_ABOUT } },
      {
        type: "docs",
        data: {
          deckUrl: BOUNTIFOODS_PDF,
          reportUrl: BOUNTIFOODS_PDF,
          reportButtonText: "Download Report",
        },
      },
    ],
  },
];

const DEPRECATED_SLUG = "bountifoods-brand-audit";

/** Legacy slugs that should be merged into the canonical project on seed. */
const ALTERNATE_SLUGS = {
  "product-strategy-a10-ai-application-delivery-controller-adc": [
    "a10-networks-product-strategy-gtm",
    "a10-product-strategy-gtm",
  ],
};

function mergeBlocks(canonicalBlocks, existingBlocks) {
  const canonicalHasDocs = canonicalBlocks.some((b) => b.type === "docs");
  const extras = (existingBlocks || []).filter((b) => {
    if (b.type === "gallery" || b.type === "image") return true;
    if (b.type === "docs" && !canonicalHasDocs) return true;
    return false;
  });
  return [...canonicalBlocks, ...extras];
}

async function seedProject(canonical) {
  const { id, ...data } = canonical;
  const alternates = ALTERNATE_SLUGS[canonical.slug] || [];

  let snap = await db.collection("projects").where("slug", "==", canonical.slug).get();
  if (snap.empty) {
    for (const alt of alternates) {
      snap = await db.collection("projects").where("slug", "==", alt).get();
      if (!snap.empty) break;
    }
  }
  if (snap.empty) {
    const byId = await db.collection("projects").doc(id).get();
    if (byId.exists) {
      snap = { empty: false, docs: [byId] };
    }
  }

  let targetId = id;
  let existingBlocks = [];

  if (!snap.empty) {
    const doc = snap.docs[0];
    targetId = doc.id;
    existingBlocks = doc.data().blocks || [];
  }

  const payload = {
    ...data,
    blocks: mergeBlocks(canonical.blocks, existingBlocks),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const ref = db.collection("projects").doc(targetId);
  const existing = await ref.get();
  if (!existing.exists) {
    payload.createdAt = admin.firestore.FieldValue.serverTimestamp();
  }

  await ref.set(payload, { merge: false });
  console.log(`Seeded projects/${targetId} (${canonical.slug}) — ${payload.blocks.length} blocks`);

  for (const alt of alternates) {
    const altSnap = await db.collection("projects").where("slug", "==", alt).get();
    for (const doc of altSnap.docs) {
      if (doc.id !== targetId) {
        await doc.ref.set({ status: "draft" }, { merge: true });
        console.log(`Deprecated duplicate projects/${doc.id} (${alt})`);
      }
    }
  }
}

async function deprecateDuplicates() {
  const snap = await db.collection("projects").where("slug", "==", DEPRECATED_SLUG).get();
  for (const doc of snap.docs) {
    await doc.ref.set({ status: "draft" }, { merge: true });
    console.log(`Deprecated duplicate projects/${doc.id} (${DEPRECATED_SLUG})`);
  }
}

async function main() {
  for (const project of CANONICAL_PROJECTS) {
    await seedProject(project);
  }
  await deprecateDuplicates();
  console.log("Done — all portfolio projects synced to Firestore.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
