# Content mapping (CV and old site -> database)

Source of truth: the LaTeX CV (`D:\OneDrive - University of Pisa\0-DOCUMENTI\1-FEDERICO\4-CV\CV-latex\CV.tex`, English only) plus
the texts of the old site (IT + EN). Seeded by `prisma/seed.ts` from `prisma/seed-data.ts`. **Nothing is invented**: where the CV gives
no data the field is empty/null and editable from the admin. The seed uses `upsert` with an empty `update`, so admin edits are never overwritten.

| CV section                                                      | Model                                                                                            | Notes                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Header: name, e-mail, phone, city, LinkedIn                     | `SiteSettings` (`ownerName`, `email`, `phone`), `SiteSettingsTranslation.location`, `SocialLink` | GitHub/Instagram links come from the old site's contacts       |
| Professional Summary                                            | `SiteSettingsTranslation.bio` (IT + EN)                                                          | IT text from the old site                                      |
| Interests                                                       | `SiteSettingsTranslation.interests`                                                              |                                                                |
| Role line (hero)                                                | `SiteSettingsTranslation.role`                                                                   | "Sviluppatore full-stack · Studente di LM in AI"               |
| Education (3 entries, thesis POESIA, Erasmus+)                  | `Education` + `EducationTranslation` (`title`, `summary`, `highlights[]`)                        | MSc open-ended (`endDate` null)                                |
| Technical Skills (4 categories)                                 | `SkillCategory` + `Skill`                                                                        | **No level** set (CV gives none): `level` null, never rated    |
| Spoken languages (Italian native, English fluent, IELTS 6.5)    | `SpokenLanguage` (`proficiency` enum) + translation `detail`                                     |                                                                |
| Work Experience (JEVIS x3 roles, Hastega, Freelance, TFP Watch) | `Experience` + `ExperienceTranslation` (`role`, `summary`, `highlights[]`) + `Tag`               | JEVIS roles are separate rows (one per role/period)            |
| Certifications (IELTS 6.5, BLSD, D.Lgs. 81/2008)                | `Certification` + `CertificationTranslation.name`                                                | issuer/date empty                                              |
| Freelance clients (Ethibit Srl, EIS Versilia, AGB Design)       | `Project` (DRAFT) + `ProjectTranslation.title`                                                   | no description, links or cover: fill in from `/admin/projects` |
| CV PDF                                                          | `SiteSettings.cvPath` -> `public/cv/federico-mattucci-cv.pdf`                                    | English CV; replace the file to update                         |

## Not seeded (kept out on purpose)

- Avatar (`SiteSettings.avatarKey`): the old photo lives in the old S3 bucket; upload a new one from `/admin/site`.
- Photo albums/photos (3 albums "Portrait", "Sky", "Street Photography" and 15 photos in the old DB, keys under `portfolio/...` in the old bucket):
  re-import later through the admin/ingest pipeline once S3 works (`docs/PHOTOS-AWS-SETUP.md`). Backup of the old rows is outside the repo.
- Italian translation of experience/education/skills texts that were authored in Italian on the old site are included; anything the CV only has in English
  was translated as in the old seed (reviewed: no new claims).
