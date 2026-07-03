export interface SkillCategory {
  title: string;
  skills: string[];
  /** Accent for Venn circle styling, fixed per circle */
  accent: "product" | "technical" | "execution" | "ai";
}

export type CompetencyMatrixContent = {
  title: string;
  subtitle: string;
  centerLabel: string;
  centerSublabel: string;
  categories: SkillCategory[];
};

export const competencyCategories: SkillCategory[] = [
  {
    title: "Product",
    accent: "product",
    skills: [
      "PRDs",
      "PLM",
      "Product Strategy",
      "A/B Testing",
      "Roadmap",
      "Business Strategy",
      "Customer Journey Mapping",
      "Competitive Analysis",
      "GTM",
      "Cohort Analysis",
      "Customer Research",
    ],
  },
  {
    title: "AI Fluency",
    accent: "ai",
    skills: [
      "Rapid Prototyping",
      "RAG",
      "LLMs",
      "MCP",
      "Cursor",
      "Figma",
      "Claude Code",
      "AI/ML",
    ],
  },
  {
    title: "Technical",
    accent: "technical",
    skills: [
      "SQL",
      "APIs",
      "AWS",
      "Python",
      "Java",
      "Excel",
      "Evaluations",
      "Distributed Systems",
      "Tableau",
    ],
  },
  {
    title: "Execution",
    accent: "execution",
    skills: [
      "Agile",
      "Scrum",
      "JIRA",
      "SAFe",
      "Confluence",
      "SDLC",
      "Looker",
      "Feature Prioritization",
      "Epics",
      "User Stories",
      "KPIs",
    ],
  },
];

export const DEFAULT_COMPETENCY_MATRIX: CompetencyMatrixContent = {
  title: "Competency Matrix",
  subtitle:
    "Four intersecting domains: product judgment, technical depth, delivery rigor, and AI fluency.",
  centerLabel: "Full-Stack",
  centerSublabel: "PM Profile",
  categories: competencyCategories,
};

const AI_FLUENCY_CANONICAL_SKILLS = competencyCategories.find((c) => c.accent === "ai")!.skills;

/** Merge Firestore CMS matrix with repo defaults; ensures AI Fluency includes MCP. */
export function resolveCompetencyMatrix(
  remote: CompetencyMatrixContent | undefined | null
): CompetencyMatrixContent {
  const base = remote ?? DEFAULT_COMPETENCY_MATRIX;
  const categories = (base.categories?.length ? base.categories : DEFAULT_COMPETENCY_MATRIX.categories).map(
    (cat) => {
      if (cat.accent !== "ai") {
        return { ...cat, skills: (cat.skills || []).filter((s) => s.trim()) };
      }

      const remoteSkills = (cat.skills || []).filter((s) => s.trim());
      const merged: string[] = [];
      const seen = new Set<string>();

      for (const skill of AI_FLUENCY_CANONICAL_SKILLS) {
        const key = skill.toLowerCase();
        if (seen.has(key)) continue;
        const fromRemote = remoteSkills.find((s) => s.toLowerCase() === key);
        merged.push(fromRemote ?? skill);
        seen.add(key);
      }

      for (const skill of remoteSkills) {
        const key = skill.toLowerCase();
        if (!seen.has(key)) {
          merged.push(skill);
          seen.add(key);
        }
      }

      return { ...cat, skills: merged };
    }
  );

  return {
    ...DEFAULT_COMPETENCY_MATRIX,
    ...base,
    categories,
  };
}

/** @deprecated Use competencyCategories */
export const technicalSkills: SkillCategory = competencyCategories[2];
/** @deprecated Use competencyCategories */
export const strategicSkills: SkillCategory = competencyCategories[0];

export const coreArsenal: string[] = [
  "SQL",
  "AWS",
  "Agentic AI",
  "Product Ops",
  "GTM Strategy",
];
