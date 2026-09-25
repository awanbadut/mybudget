import { revalidatePath } from 'next/cache';

export function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignored when invoked outside Next.js request lifecycle
  }
}
