import BlogPostClient from "./BlogPostClient";

export function generateStaticParams() {
  return [{ slug: "_" }];
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <BlogPostClient fallbackSlug={slug} />;
}
