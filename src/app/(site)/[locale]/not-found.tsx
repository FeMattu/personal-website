import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export default async function NotFound() {
  const t = await getTranslations('errors')
  return (
    <section className="grid min-h-[60vh] place-items-center py-16 text-center">
      <div className="max-w-md space-y-4">
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="text-3xl font-semibold tracking-tight">{t('notFoundTitle')}</h1>
        <p className="text-muted-foreground">{t('notFoundText')}</p>
        <Button asChild>
          <Link href="/">{t('goHome')}</Link>
        </Button>
      </div>
    </section>
  )
}
