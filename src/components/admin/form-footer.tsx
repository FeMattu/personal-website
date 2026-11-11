import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Props = { submitting: boolean; cancelHref?: string; saveLabel?: string }

/** Sticky-less save bar shared by the page editors. */
export function FormFooter({ submitting, cancelHref, saveLabel = 'Save' }: Props) {
  return (
    <div className="flex items-center gap-2 border-t pt-4">
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : saveLabel}
      </Button>
      {cancelHref ? (
        <Button asChild variant="ghost">
          <Link href={cancelHref}>Back to list</Link>
        </Button>
      ) : null}
    </div>
  )
}
