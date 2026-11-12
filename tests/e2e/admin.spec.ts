import { expect, test, type Locator, type Page } from '@playwright/test'

/** Clicks and waits for the server action (a POST) to finish, so a reload cannot abort the write. */
async function clickAndWaitForAction(page: Page, button: Locator) {
  const done = page.waitForResponse(
    (r) => r.request().method() === 'POST' && !r.url().includes('__nextjs'),
  )
  await button.click()
  await done
}

const ADMIN_STATE = 'playwright/.auth/admin.json'

test.describe('admin: unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('/admin redirects to /login', async ({ page }) => {
    await page.goto('/admin/experience')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible()
  })

  test('rejects a wrong password', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('E-mail').fill(process.env.ADMIN_EMAIL ?? 'x@example.com')
    await page.getByLabel('Password').fill('definitely-wrong')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.locator('form [role="alert"]')).toContainText('Invalid')
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('admin: signed in', () => {
  test.use({ storageState: ADMIN_STATE })

  test('has the sidebar only under /admin, and the public navbar shows the Admin entry', async ({
    page,
  }) => {
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.locator('[data-slot="sidebar"]').first()).toBeAttached()

    await page.goto('/en')
    expect(await page.locator('aside, [data-slot="sidebar"]').count()).toBe(0)
    await expect(page.getByRole('link', { name: 'Admin' }).first()).toBeAttached()
  })

  test('edits site text and sees it on the public site', async ({ page }) => {
    await page.goto('/admin/site')
    const tagline = `E2E tagline ${Date.now()}`
    await page.getByRole('tab', { name: /English/ }).click()
    const field = page.getByRole('tabpanel', { name: /English/ }).getByLabel('Tagline')
    const before = await field.inputValue()
    await field.fill(tagline)
    await clickAndWaitForAction(page, page.getByRole('button', { name: 'Save' }))

    await page.goto('/en')
    await expect(page.getByText(tagline)).toBeVisible()

    // restore
    await page.goto('/admin/site')
    await page.getByRole('tab', { name: /English/ }).click()
    await page
      .getByRole('tabpanel', { name: /English/ })
      .getByLabel('Tagline')
      .fill(before)
    await clickAndWaitForAction(page, page.getByRole('button', { name: 'Save' }))
  })

  test('reorders experience with the move buttons and the order persists', async ({ page }) => {
    await page.goto('/admin/experience')
    const rows = page.locator('li:has(button[aria-label^="Move"])')
    const titles = async () => (await rows.allInnerTexts()).map((t) => t.split('\n')[0]!.trim())
    const original = await titles()
    expect(original.length).toBeGreaterThan(1)

    await clickAndWaitForAction(
      page,
      page.getByRole('button', { name: `Move ${original[0]} down` }),
    )
    await expect.poll(titles).not.toEqual(original)
    const moved = await titles()

    await page.reload()
    expect(await titles()).toEqual(moved)

    // restore the original order
    await clickAndWaitForAction(page, page.getByRole('button', { name: `Move ${original[0]} up` }))
    await expect.poll(titles).toEqual(original)
    await page.reload()
    expect(await titles()).toEqual(original)
  })
})
