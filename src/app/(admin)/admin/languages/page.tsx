import { LanguagesManager } from '@/components/admin/languages-manager'
import { PageHeader } from '@/components/admin/page-header'
import { blankLanguage, languageToForm } from '@/lib/admin/form-values'
import { requireAdmin } from '@/lib/auth/session'
import { spokenLanguageRepo } from '@/lib/db/repositories/admin-misc'

export default async function LanguagesPage() {
  await requireAdmin()
  const rows = await spokenLanguageRepo.list()
  const items = rows.map((row) => ({
    id: row.id,
    title: row.name,
    subtitle: `${row.code} · ${row.proficiency.toLowerCase()}`,
    status: row.status,
    missing: [],
    form: languageToForm(row),
  }))
  return (
    <>
      <PageHeader
        title="Spoken languages"
        description="Languages you speak, shown on the CV. Not the site languages."
      />
      <LanguagesManager items={items} blank={blankLanguage()} />
    </>
  )
}
