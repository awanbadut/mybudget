import { revalidatePath } from 'next/cache';

export function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignored when invoked outside Next.js request lifecycle
  }
}

export function getDevUserId(): string {
  const raw = process.env.DEV_USER_ID;
  if (!raw) return '00000000-0000-0000-0000-000000000001';
  return raw.trim().replace(/^["']|["']$/g, '');
}
