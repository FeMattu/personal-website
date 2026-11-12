import { revalidatePath, revalidateTag } from 'next/cache'
import { CONTENT_TAG } from '@/lib/content'

/** Expires immediately (no stale-while-revalidate: an admin must see their own write) the cached public content and the ISR pages after any admin write. */
export function revalidateContent(): void {
  revalidateTag(CONTENT_TAG, { expire: 0 })
  revalidatePath('/', 'layout')
}
