export type JobSearchAgentUi = {
  enabled: boolean;
  heroPill: string;
  heroTitle: string;
  heroTitleAccent: string;
  heroDescription: string;
  workflowSteps: { title: string; description: string }[];
};

/** Canonical public route for the Job Application Workflow Agent prototype. */
export const JOB_APPLICATION_WORKFLOW_AGENT_PATH = "/ai-prototypes/job-application-workflow-agent";
export const JOB_APPLICATION_WORKFLOW_AGENT_ADMIN_PATH = "/admin/job-application-workflow-agent";

export const JOB_SEARCH_AGENT_UI_INITIAL: JobSearchAgentUi = {
  enabled: true,
  heroPill: "Agentic workflow",
  heroTitle: "Job Application",
  heroTitleAccent: "Workflow Agent",
  heroDescription:
    "Paste a job description and your resume. Get a fit score, evidence-backed skill gaps, rewritten bullets, and a tailored cover letter, in one guided workflow.",
  workflowSteps: [
    {
      title: "Analyze fit",
      description: "0-100 score with strong / reach / weak tier and JD line citations.",
    },
    {
      title: "Surface gaps",
      description: "Missing skills with proof pulled from the job description.",
    },
    {
      title: "Rewrite bullets",
      description: "Reframe your experience for the role - accept or reject each suggestion.",
    },
    {
      title: "Draft cover letter",
      description: "Personalized letter streamed from your fit analysis, not a generic template.",
    },
  ],
};
