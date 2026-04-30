import type { SnapshotMeta, SnapshotPayload } from '@/types';

export async function fetchSnapshotManifest(): Promise<SnapshotMeta> {
  const response = await fetch('/data/manifest.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`无法加载快照目录: ${response.status}`);
  }
  return response.json();
}

export async function fetchSnapshotByDate(date: string): Promise<SnapshotPayload> {
  const response = await fetch(`/data/snapshots/${date}.json`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`无法加载 ${date} 快照: ${response.status}`);
  }
  return response.json();
}
