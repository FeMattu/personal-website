import { expect, test } from '@playwright/test'

const LOCALES = ['it', 'en'] as const
const ROUTES = [
  '',
  '/projects',
  '/skills',
  '/photos',
  '/contact',
  '/experience/jevis-it-senior-associate',
  '/education/unipi-bsc-computer-science',
  '/certifications/ielts-6-5',
]

test.describe('smoke: every public route renders per locale', () => {
  for (const locale of LOCALES) {
    for (const route of ROUTES) {
      test(`/${locale}${route}`, async ({ page }) => {
        const response = await page.goto(`/${locale}${route}`)
        expect(response?.status()).toBe(200)
        await expect(page.locator('html')).toHaveAttribute('lang', locale)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await expect(page.locator('main#main')).toBeVisible()
      })
    }
  }

  test('unknown path under a locale is a real 404', async ({ page }) => {
    const response = await page.goto('/it/does-not-exist')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { name: 'Pagina non trovata' })).toBeVisible()
  })

  test('root redirects to a locale', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/(it|en)$/)
  })
})

test.describe('navigation', () => {
  test('top navbar is present on every page and there is no sidebar', async ({
    page,
    isMobile,
  }) => {
    for (const route of ['/it', '/it/projects', '/it/photos']) {
      await page.goto(route)
      await expect(page.getByRole('banner')).toBeVisible()
      expect(await page.locator('aside, [data-sidebar]').count()).toBe(0)
      if (!isMobile) {
        await expect(page.getByRole('navigation', { name: 'Navigazione principale' })).toBeVisible()
      }
    }
  })

  test('mobile menu opens in a sheet', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only')
    await page.goto('/it')
    await page.getByRole('button', { name: 'Apri il menu' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('dialog').getByRole('link', { name: 'Competenze' }).click()
    await expect(page).toHaveURL(/#skills$/)
  })

  test('language switch keeps the page and changes the copy', async ({ page, isMobile }) => {
    test.skip(isMobile, 'covered on desktop')
    await page.goto('/it/projects')
    await page.getByRole('button', { name: /Cambia lingua/ }).click()
    await page.getByRole('menuitemradio', { name: 'English' }).click()
    await expect(page).toHaveURL(/\/en\/projects$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible()
  })
})

test.describe('theme', () => {
  test('toggles dark mode, persists it, and does not flash on reload', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'covered on desktop')
    await page.goto('/en')
    await page.getByRole('button', { name: 'Change theme' }).click()
    await page.getByRole('menuitemradio', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(bg).not.toBe('rgb(255, 255, 255)')

    await page.getByRole('button', { name: 'Change theme' }).click()
    await page.getByRole('menuitemradio', { name: 'Light' }).click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })
})

test.describe('contact form', () => {
  test('validates and shows translated errors', async ({ page }) => {
    await page.goto('/en/contact')
    await page.getByRole('button', { name: 'Send message' }).click()
    await expect(page.getByText('Please enter your name.')).toBeVisible()
  })
})

test.describe('seo', () => {
  test('sitemap, robots and hreflang', async ({ page, request }) => {
    expect((await request.get('/sitemap.xml')).status()).toBe(200)
    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toContain('Disallow: /admin')
    await page.goto('/en')
    const hreflangs = await page
      .locator('link[rel="alternate"][hreflang]')
      .evaluateAll((els) => els.map((e) => e.getAttribute('hreflang')))
    expect(hreflangs).toEqual(expect.arrayContaining(['it', 'en', 'x-default']))
  })
})
