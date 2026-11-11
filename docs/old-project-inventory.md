# Old project inventory (read-only source)

Path: `D:\OneDrive - University of Pisa\2-LAVORO\7-PERSONALE\FedericoMattucci`. It is itself a previous rewrite
(`feat/site-redesign`) of the original portfolio: Next 16.3, React 19, Prisma 6.19 + Postgres, Auth.js v5 (GitHub),
next-intl, shadcn `radix-nova`, S3 + CloudFront (signed URLs), vitest 5 + Playwright, **npm**. Left untouched.

## Routes (kept in the new site, see `REWRITE_PLAN.md`)

| Old route | Purpose | New |
| --------- | ------- | --- |
| `/[locale]` | home: hero, experience, education, skills, projects, photos teaser, contact | kept |
| `/[locale]/experience/[slug]`, `/education/[slug]`, `/projects/[slug]` | detail pages | kept (+ `/certifications/[slug]`) |
| `/[locale]/photos` | gallery | placeholder shell (data layer ready) |
| `/[locale]/[...rest]` | catch-all 404 | `not-found.tsx` |
| `/login`, `/admin/**` | admin (experience, education, skills, projects, certifications, social links, languages, messages, photos, site-texts) | rebuilt |
| `/api/auth/*` | Auth.js | rebuilt |
| `/sitemap.xml`, `/robots.txt` | SEO | rebuilt |

## Data model (essentials)

`Locale`, `SiteText(key -> {it,en} JSON)`, `Experience`, `Education`, `Certification`, `SkillCategory`, `Skill`
(`level` 1..5 optional), `Project` (cover + gallery S3 keys, tags, live/repo), `SocialLink`, `Album`, `Photo`
(S3 key, EXIF JSON, blur), `Message` (+ ipHash), Auth.js tables. Translations were JSON maps per field. The new schema
normalises this into per-locale translation tables (`DECISIONS.md` D-04).

## Content (all re-used, nothing invented)

Seeded from the current LaTeX CV: 6 experiences (JEVIS x3 roles, Hastega, freelance, TFP Watch), 3 education entries,
3 certifications, 4 skill categories + 5 spoken languages, 5 social links, 3 client projects as drafts
(Ethibit Srl, EIS Versilia, AGB Design), bio/interests/role texts in IT + EN. The old Postgres (6 experiences, 26 skills,
3 albums, 15 photos, 0 messages, 0 users) contained exactly the seed data: no admin edits were lost.
Exported before the rewrite to `<scratchpad>/backup/old-site-data.sql` (outside the repo).

## Assets

`public/images/logo/Logo-black*.jpg` (not carried over: low-value JPEG logos; the new site uses a typographic wordmark),
profile photo `profile/profile.jpg` and 15 portfolio photos live in the old S3 bucket (keys listed in the old DB; photo
import is deferred until S3 access works, see `PHOTOS-AWS-SETUP.md`).

## Integrations

- Database: Postgres (Docker, port 54330 in the old setup).
- Auth: GitHub OAuth + `ADMIN_EMAIL` allow-list (old `.env.local` had no OAuth client id: login could not work locally).
- Storage: S3 + CloudFront **signed URLs** (key pair). New design uses OAC + public CDN URLs for hashed keys.
- Email: Resend REST API (`RESEND_API_KEY`, `CONTACT_TO_EMAIL`); the key was empty (messages only stored).
- Env copied to the new `.env` (git-ignored): `ADMIN_EMAIL`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
  bucket name, CDN URL (as `OLD_CLOUDFRONT_URL`, informational). New secrets (`AUTH_SECRET`, DB password) were generated.
  `.env.example` has placeholders only.

## Not carried over

Old lockfile (`package-lock.json`), `.next`, `coverage`, `test-results`, `bash.exe.stackdump`, `tsconfig.tsbuildinfo`,
the two Lambda `.py` files, `.vscode`, `scripts/e2e-server.mjs`, all old source code.
