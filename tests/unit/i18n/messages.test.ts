import { describe, expect, it } from 'vitest'
import { defaultLocale, isLocale, locales } from '@/i18n/config'
import enMessages from '@/i18n/messages/en.json'
import itMessages from '@/i18n/messages/it.json'

function keys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object'
      ? keys(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  )
}

describe('messages', () => {
  it('it.json and en.json have exactly the same keys', () => {
    expect(keys(enMessages).sort()).toEqual(keys(itMessages).sort())
  })

  it('has no empty strings', () => {
    for (const messages of [enMessages, itMessages]) {
      for (const key of keys(messages)) {
        const value = key
          .split('.')
          .reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], messages)
        expect(value, key).not.toBe('')
      }
    }
  })

  it('config is consistent', () => {
    expect(isLocale(defaultLocale)).toBe(true)
    expect(locales).toContain('it')
    expect(isLocale('xx')).toBe(false)
  })
})
