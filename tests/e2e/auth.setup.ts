import 'dotenv/config'
import { expect, test as setup } from '@playwright/test'

export const ADMIN_STATE = 'playwright/.auth/admin.json'

/** Signs in once with the password provider and stores the session for the admin specs. */
setup('authenticate as admin', async ({ page }) => {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.E2E_ADMIN_PASSWORD ?? 'admin-dev-local'
  if (!email) throw new Error('ADMIN_EMAIL must be set in .env for the e2e suite')

  await page.goto('/login')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  // The first /admin hit compiles the whole admin tree in dev: allow for it.
  await expect(page).toHaveURL(/\/admin$/, { timeout: 90_000 })
  await page.context().storageState({ path: ADMIN_STATE })
})
