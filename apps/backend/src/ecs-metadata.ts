import { EcsMetadata } from 'shared';

export async function fetchEcsMetadata(): Promise<EcsMetadata | null> {
  const uri = process.env['ECS_CONTAINER_METADATA_URI_V4'];
  if (!uri) return null;
  try {
    const res = await fetch(`${uri}/task`);
    if (!res.ok) return null;
    const raw = (await res.json()) as Record<string, unknown>;
    return {
      cluster: String(raw['Cluster'] ?? 'unknown'),
      taskArn: String(raw['TaskARN'] ?? 'unknown'),
      taskFamily: String(raw['Family'] ?? 'unknown'),
      taskRevision: String(raw['Revision'] ?? 'unknown'),
    } as EcsMetadata;
  } catch {
    return null;
  }
}
