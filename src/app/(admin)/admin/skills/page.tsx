import { PageHeader } from '@/components/admin/page-header'
import { SkillsManager, type CategoryEditorRow } from '@/components/admin/skills-manager'
import { defaultLocale, locales } from '@/i18n/config'
import { blankCategory, categoryToForm, skillToForm } from '@/lib/admin/form-values'
import { requireAdmin } from '@/lib/auth/session'
import { categoryRepo } from '@/lib/db/repositories/admin-skills'
import { missingLocales } from '@/lib/i18n/localize'

export default async function SkillsPage() {
  await requireAdmin()
  const rows = await categoryRepo.listWithSkills()
  const categories: CategoryEditorRow[] = rows.map((category) => ({
    id: category.id,
    title: category.translations.find((t) => t.locale === defaultLocale)?.name || category.slug,
    status: category.status,
    missing: missingLocales(category.translations, locales, 'name'),
    form: categoryToForm(category),
    skills: category.skills.map((skill) => ({
      id: skill.id,
      title: skill.name,
      subtitle: skill.level ? skill.level.toLowerCase() : undefined,
      status: skill.status,
      missing: [],
      form: skillToForm(skill),
    })),
  }))
  return (
    <>
      <PageHeader
        title="Skills"
        description="Categories and skills. Drag to reorder; descriptions are optional per language."
      />
      <SkillsManager categories={categories} blankCategory={blankCategory()} />
    </>
  )
}
