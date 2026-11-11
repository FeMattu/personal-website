import { Badge } from '@/components/ui/badge'
import type { ContentStatusValue } from '@/lib/admin/schema-common'

export function StatusBadge({ status }: { status: ContentStatusValue }) {
  return status === 'PUBLISHED' ? (
    <Badge>Published</Badge>
  ) : (
    <Badge variant="secondary">Draft</Badge>
  )
}

/** Lists the languages whose required text is still empty (hidden when complete). */
export function MissingBadge({ missing }: { missing: readonly string[] }) {
  if (missing.length === 0) return null
  return (
    <Badge variant="outline" title="Missing translations">
      Missing: {missing.map((code) => code.toUpperCase()).join(', ')}
    </Badge>
  )
}
