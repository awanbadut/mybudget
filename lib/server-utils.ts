import { revalidatePath } from 'next/cache';
import { getUserId } from '@/lib/auth';

export { getUserId };

export function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignored when invoked outside Next.js request lifecycle
  }
}

// Legacy function kept for backward compatibility
export function getDevUserId(): string {
  const raw = process.env.DEV_USER_ID;
  if (!raw) return '00000000-0000-0000-0000-000000000001';
  return raw.trim().replace(/^[\"']|[\"']$/g, '');
}
