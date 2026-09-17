import { ViewRouter } from './ViewRouter';

export const runtime = 'edge';

export default async function ViewCatchAllPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  return <ViewRouter slug={resolvedParams.slug} />;
}
