/**
 * Seed Tesla STP portfolio project into Firestore (idempotent).
 * Run from functions/: node scripts/seed-tesla-project.js
 */
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({ projectId: "asinghpm101" });
}

const db = admin.firestore();

const PROJECT_ID = "project-tesla-stp-2025";

const project = {
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
    {
      type: "heading",
      data: { text: "About this project", level: 2 },
    },
    {
      type: "text",
      data: {
        text: `This project is a full marketing strategy analysis of Tesla at a critical inflection point: rising competition, a polarizing CEO, and a brand perception gap that threatens its premium positioning. Working as part of a four-person team in a graduate-level Product Messaging and Positioning course (MKTG 3710), we applied the STP framework to identify Tesla's highest-opportunity customer groups, define a prioritized targeting strategy, and develop a differentiated positioning architecture grounded in Tesla's core competitive advantage: its integrated energy ecosystem.

The analysis began with a four-dimensional segmentation across demographic, psychographic, behavioral, and geographic variables, evaluated through a MASDA framework (Measurable, Accessible, Substantial, Differentiable, Actionable) to score segment viability. From there, we built a differentiated targeting model with three tiers: premium eco-conscious professionals at 70% focus, affluent urban residents locked out by charging access barriers at 20%, and aspirational Gen Z buyers at 10% as a long-term loyalty investment. The positioning statement, perceptual map, 4D message framework, and a three-level messaging hierarchy (100, 50, and 25 words) were developed to translate strategy into executional clarity. The analysis concluded with five strategic recommendations covering brand recovery, CEO brand risk, sub-branding architecture, and Tesla's pivot toward lifestyle-first communications.`,
      },
    },
    {
      type: "docs",
      data: {
        deckUrl: "/portfolio/Tesla_STP_Strategy_2025.pdf",
        reportUrl: "/portfolio/Tesla_STP_Strategy_2025.pdf",
        reportButtonText: "Download presentation",
      },
    },
  ],
};

async function main() {
  await db.collection("projects").doc(PROJECT_ID).set(project, { merge: true });
  console.log(`Seeded projects/${PROJECT_ID} (${project.slug})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
