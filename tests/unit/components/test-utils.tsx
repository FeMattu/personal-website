import { render } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { ThemeProvider } from 'next-themes'
import type { ReactElement } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import enMessages from '@/i18n/messages/en.json'
import itMessages from '@/i18n/messages/it.json'

const messages = { en: enMessages, it: itMessages }

/** Renders with the same providers as the public layout (messages, theme, tooltips). */
export function renderPublic(ui: ReactElement, locale: 'en' | 'it' = 'en') {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <NextIntlClientProvider locale={locale} messages={messages[locale]}>
        <TooltipProvider>{ui}</TooltipProvider>
      </NextIntlClientProvider>
    </ThemeProvider>,
  )
}
