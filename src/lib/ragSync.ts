import { db } from "./firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

async function writeRagDoc(id: string, title: string, content: string, sortOrder: number) {
  await setDoc(
    doc(db, "rag_context", id),
    {
      title,
      content,
      sortOrder,
      status: "active",
      autoSync: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function syncResumeToRag(experiences: any[]) {
  if (!experiences || experiences.length === 0) return;

  const lines = ["# Career Experience\n"];
  for (const exp of experiences) {
    const type = exp.type === "education" ? "Education" : "Career";
    lines.push(`## ${exp.company}, ${exp.role} (${exp.period}) [${type}]`);
    if (exp.description) lines.push(exp.description);
    if (exp.achievements?.length) {
      lines.push("**Key Achievements:**");
      for (const a of exp.achievements) lines.push(`- ${a}`);
    }
    if (exp.metrics?.length) {
      const metricStr = exp.metrics.map((m: any) => `${m.value} ${m.label}`).join(", ");
      lines.push(`**Metrics:** ${metricStr}`);
    }
    if (exp.techStack?.length) {
      lines.push(`**Tech Stack:** ${exp.techStack.join(", ")}`);
    }
    lines.push("");
  }

  await writeRagDoc("experience", "Career Experience", lines.join("\n"), 20);
}

export async function syncAboutToRag(about: any) {
  if (!about) return;
  const lines = [
    "# Professional Profile\n",
    `**Name:** ${about.headline || "Ankit Singh"}`,
    `**Tag:** ${about.profileTag || ""}`,
    about.subheadline ? `\n${about.subheadline}` : "",
  ].filter(Boolean);

  await writeRagDoc("profile", "Professional Profile", lines.join("\n"), 10);
}

export async function syncHomeToRag(home: any) {
  if (!home) return;
  const combinedBio =
    [home.heroBioBefore, home.heroBioAfter]
      .map((x: string | undefined) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean)
      .join("\n\n") || (home.heroSubtitle || "");
  const lines = [
    "# Homepage Content\n",
    `**Headline:** ${home.heroTitle || ""}`,
    combinedBio ? `**Bio:** ${combinedBio}` : "",
    home.aiConciergeTitle ? `\n**AI Concierge:** ${home.aiConciergeTitle}, ${home.aiConciergeDesc || ""}` : "",
    home.bentoHighlightTitle ? `\n**Featured Highlight:** ${home.bentoHighlightTitle}, ${home.bentoHighlightDesc || ""}` : "",
    home.bentoInsightTitle ? `**Latest Insight:** ${home.bentoInsightTitle}, ${home.bentoInsightDesc || ""}` : "",
  ].filter(Boolean);

  await writeRagDoc("home", "Homepage Content", lines.join("\n"), 15);
}

export async function syncProjectsToRag(projects: any[]) {
  if (!projects || projects.length === 0) return;

  const published = projects.filter((p) => p.status === "published");
  if (published.length === 0) return;

  const lines = ["# Projects & Case Studies\n"];
  for (const p of published) {
    lines.push(`## ${p.title}`);
    lines.push(`**Category:** ${p.category || "General"}`);
    if (p.description) lines.push(p.description);
    if (p.tags?.length) lines.push(`**Tags:** ${p.tags.join(", ")}`);
    if (p.metrics?.length) {
      const metricStr = p.metrics.map((m: any) => `${m.value} ${m.label}`).join(", ");
      lines.push(`**Metrics:** ${metricStr}`);
    }
    lines.push(`**Detail page:** /portfolio/${p.slug}`);
    lines.push("");
  }

  await writeRagDoc("projects", "Projects & Case Studies", lines.join("\n"), 30);
}

export async function syncEventsToRag(events: any[]) {
  if (!events || events.length === 0) return;

  const published = events.filter((e) => e.status === "published");
  if (published.length === 0) return;

  const lines = ["# Events\n"];
  for (const e of published) {
    lines.push(`## ${e.title}`);
    lines.push(`**Category:** ${e.category || "General"} | **Date:** ${e.date || "TBD"}`);
    if (e.location) lines.push(`**Location:** ${e.location}`);
    if (e.description) lines.push(e.description);
    lines.push(`**Detail page:** /events/${e.slug}`);
    lines.push("");
  }

  await writeRagDoc("events", "Events", lines.join("\n"), 40);
}

export async function syncBlogToRag(posts: any[]) {
  if (!posts || posts.length === 0) return;

  const published = posts.filter((p) => p.status === "published");
  if (published.length === 0) return;

  const lines = ["# Blog Posts\n"];
  for (const p of published) {
    lines.push(`## ${p.title}`);
    lines.push(`**Category:** ${p.category || "General"} | **Date:** ${p.date || ""}`);
    if (p.excerpt) lines.push(p.excerpt);
    lines.push(`**Read:** /blog/${p.slug}`);
    lines.push("");
  }

  await writeRagDoc("blog", "Blog Posts", lines.join("\n"), 50);
}
