'use client'

import { Check, CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { localeNames, locales, type Locale } from '@/i18n/config'

type Props = {
  value: string
  onValueChange: (locale: string) => void
  /** Locales whose required text is empty (from `missingLocales()`). */
  missing: readonly string[]
  children: (locale: Locale) => ReactNode
}

/** One tab per enabled language; each tab shows whether its required text is filled in. */
export function TranslationTabs({ value, onValueChange, missing, children }: Props) {
  return (
    <Tabs value={value} onValueChange={onValueChange}>
      <TabsList aria-label="Content language">
        {locales.map((code) => {
          const isMissing = missing.includes(code)
          return (
            <TabsTrigger key={code} value={code}>
              {localeNames[code]}
              {isMissing ? (
                <CircleAlert className="text-destructive" aria-label="translation missing" />
              ) : (
                <Check className="text-primary" aria-label="translation complete" />
              )}
            </TabsTrigger>
          )
        })}
      </TabsList>
      {locales.map((code) => (
        <TabsContent
          key={code}
          value={code}
          forceMount
          hidden={value !== code}
          className="grid gap-4 pt-2"
        >
          {children(code)}
        </TabsContent>
      ))}
    </Tabs>
  )
}
