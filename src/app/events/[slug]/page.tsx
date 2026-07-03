import EventDetailClient from "./EventDetailClient";

export function generateStaticParams() {
  return [{ slug: "_" }];
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <EventDetailClient fallbackSlug={slug} />;
}
