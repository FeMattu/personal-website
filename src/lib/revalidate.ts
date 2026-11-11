import { revalidatePath, revalidateTag } from 'next/cache'
import { CONTENT_TAG } from '@/lib/content'

/** Purges the cached public content and the ISR pages after any admin write. */
export function revalidateContent(): void {
  revalidateTag(CONTENT_TAG, 'max')
  revalidatePath('/', 'layout')
}
