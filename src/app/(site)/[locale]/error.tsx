'use client'

import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('errors')
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <section role="alert" className="grid min-h-[60vh] place-items-center py-16 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">{t('genericTitle')}</h1>
        <p className="text-muted-foreground">{t('genericText')}</p>
        <div className="flex justify-center gap-3">
          <Button onClick={reset}>{t('retry')}</Button>
          <Button asChild variant="outline">
            <Link href="/">{t('goHome')}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
