export interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
  metrics: { label: string; value: string }[];
  type: "work" | "education";
  achievements?: string[];
  techStack?: string[];
  domain?: string;
}

export const experiences: Experience[] = [
  {
    company: "Santa Clara University (Leavey School of Business)",
    role: "MBA Candidate l Marketing & Strategy",
    period: "2024 – 2026",
    type: "education",
    description: "Specializing in Marketing and Technology Strategy. Leading 100+ professionals as President of the Net Impact Club and VP of the AI Product Club.",
    achievements: [
      "President, SCU Net Impact Club, Leading sustainability-focused business initiatives",
      "VP, AI Product Club, Leading hackathons, LLM product critiques, and generative AI workshops",
      "Focus: Bridging technical systems with market-defining product strategy"
    ],
    metrics: [
      { value: "100+", label: "Club Members" },
      { value: "2026", label: "Graduation" }
    ]
  },
  {
    company: "Beebizy",
    role: "Product Manager Intern",
    period: "2025",
    type: "work",
    description: "Drove end-to-end product discovery and GTM strategy for an early-stage consumer platform.",
    achievements: [
      "Conducted 30+ user interviews to identify core pain points",
      "Defined MVP feature sets through rapid prototyping and user testing",
      "Launched 3 key features in a single internship cycle",
      "Built data-driven prioritization frameworks (RICE scoring, impact mapping)"
    ],
    metrics: [
      { value: "30+", label: "User Interviews" },
      { value: "3", label: "Feature Launches" }
    ]
  },
  {
    company: "Amazon",
    role: "Software Development Engineer II",
    period: "2019 – 2023",
    type: "work",
    description: "Architected and scaled high-throughput microservices powering Amazon's global fulfillment network.",
    achievements: [
      "Scaled systems serving 1.2M+ users with 99.9% uptime SLA",
      "Led cross-functional initiatives bridging engineering execution with product strategy",
      "Drove 25% improvement in user retention through data-driven feature optimization",
      "Designed distributed systems handling millions of daily transactions",
      "Mentored junior engineers and led architecture reviews"
    ],
    techStack: ["Java", "AWS (DynamoDB, Lambda, SQS, S3)", "Kubernetes", "CI/CD"],
    metrics: [
      { value: "1.2M+", label: "Users Scaled" },
      { value: "99.9%", label: "Uptime" },
      { value: "25%", label: "Retention ↑" }
    ]
  },
  {
    company: "Syracuse University",
    role: "M.S. Computer Science",
    period: "2017 – 2019",
    type: "education",
    description: "Focused on advanced systems architecture and artificial intelligence. Specialized in large-scale distributed systems.",
    achievements: [
      "Specialized in Systems & AI focus",
      "Conducted research in distributed computing and neural networks",
      "Achieved high performance in systems architecture coursework"
    ],
    metrics: [
      { value: "MS CS", label: "Degree" },
      { value: "Syracuse", label: "Institution" }
    ]
  },
  {
    company: "Atos Syntel",
    role: "Programmer Analyst",
    period: "2017",
    type: "work",
    description: "Developed enterprise automation solutions for Fortune 500 insurance clients.",
    achievements: [
      "Reduced manual processing time by 40% through workflow automation",
      "Achieved 98% data accuracy across critical business workflows",
      "Built full-stack applications for claims processing and policy management",
      "Implemented automated testing frameworks improving release quality"
    ],
    metrics: [
      { value: "40%", label: "Time Reduction" },
      { value: "98%", label: "Accuracy" }
    ]
  }
];

/** Keep resume metrics aligned when Firestore CMS has stale values. */
export function normalizeResumeExperiences(experiences: Experience[]): Experience[] {
  return experiences.map((exp) => {
    if (exp.company !== "Beebizy") return exp;

    const metrics = (exp.metrics ?? []).map((metric) => {
      if (
        metric.label === "User Interviews" &&
        /^50\+?$/.test(metric.value.trim())
      ) {
        return { ...metric, value: "30+" };
      }
      return metric;
    });

    const achievements = (exp.achievements ?? []).map((line) =>
      line.replace(/50\+ user interviews/i, "30+ user interviews")
    );

    return { ...exp, metrics, achievements };
  });
}
