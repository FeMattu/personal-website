'use client'

import { Languages } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { localeNames, locales, type Locale } from '@/i18n/config'
import { usePathname, useRouter } from '@/i18n/navigation'

export function LanguageSwitcher() {
  const t = useTranslations('a11y')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()

  function change(next: string) {
    // `params` carries the dynamic segments so `/projects/[slug]` keeps its slug in the new locale.
    const { locale: _locale, ...rest } = params as Record<string, string | string[]>
    let target = pathname
    for (const [key, value] of Object.entries(rest)) {
      target = target.replace(`[${key}]`, Array.isArray(value) ? value.join('/') : value)
    }
    router.replace(target as '/', { locale: next as Locale })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t('language')} className="gap-1.5 px-2">
          <Languages className="size-4" aria-hidden />
          <span className="text-xs font-medium uppercase">{locale}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={locale} onValueChange={change}>
          {locales.map((code) => (
            <DropdownMenuRadioItem key={code} value={code} lang={code}>
              {localeNames[code]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
