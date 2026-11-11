import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function NewLink({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild>
      <Link href={href}>
        <Plus /> {label}
      </Link>
    </Button>
  )
}
