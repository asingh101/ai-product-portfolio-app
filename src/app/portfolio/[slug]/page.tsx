import ProjectDetailClient from "./ProjectDetailClient";
import { BUNDLED_PORTFOLIO_PROJECTS } from "@/lib/bundledPortfolioProjects";

export function generateStaticParams() {
  return [
    { slug: "_" },
    ...BUNDLED_PORTFOLIO_PROJECTS.map((p) => ({ slug: p.slug })),
  ];
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProjectDetailClient slug={slug} />;
}
