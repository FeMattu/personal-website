# Photos on AWS: S3 + CloudFront setup guide

Step-by-step guide to serve the photo library from a **private S3 bucket behind CloudFront**.
Every step gives the console path and the AWS CLI equivalent. Do it once, top to bottom.

The site works without any of this: with `STORAGE_DRIVER=local` (default) files live in
`LOCAL_STORAGE_DIR` and are served by `/api/media/...`. Switch to S3 only when you are ready (section 12).

Placeholders used below. Replace them everywhere:

| Placeholder     | Example                                                             |
| --------------- | ------------------------------------------------------------------- |
| `<BUCKET>`      | `fedem-photos-prod` (globally unique, lowercase, no dots)           |
| `<REGION>`      | `eu-south-1` (Milan). `eu-west-1` also fine                         |
| `<ACCOUNT_ID>`  | `123456789012` (`aws sts get-caller-identity`)                      |
| `<DIST_ID>`     | `E1ABCDEF234567` (CloudFront distribution id)                       |
| `<CDN_DOMAIN>`  | `photos.example.com` (or `dxxxx.cloudfront.net` until DNS is ready) |
| `<SITE_ORIGIN>` | `https://example.com` (exact origin of the website)                 |

Prerequisites: an AWS account with MFA on the root user, AWS CLI v2 (`aws --version`), and an
admin-capable IAM identity (IAM Identity Center or an admin IAM user) configured with `aws configure`
or `aws configure sso`. **Never use root access keys.**

---

## 1. Architecture and bucket layout

```
browser --> CloudFront (HTTPS, HTTP/3, cache, Brotli) --OAC/SigV4--> S3 (private bucket)
Next.js server --(IAM user keys or role)--> S3  (PutObject / GetObject / DeleteObject)
Postgres: stores only storage KEYS, never URLs
```

Bucket layout (all keys are content-hashed, so objects are immutable):

| Prefix                                                          | Content                                             | Written by     |
| --------------------------------------------------------------- | --------------------------------------------------- | -------------- |
| `originals/<hh>/<sha256>.<ext>`                                 | untouched uploaded photo (`hh` = first 2 hex chars) | app, on ingest |
| `v/<sha256>/<width>.<avif\|webp>`                               | derived renditions (320..2560 px)                   | app, on ingest |
| `uploads/avatar/<sha256>.<ext>`, `uploads/cover/<sha256>.<ext>` | avatar and project covers                           | app            |

Decisions:

- **Private bucket, Block Public Access ON (all four settings).** Nothing is reachable except through
  CloudFront. A public bucket is a data-leak and cost risk (anyone can hammer it directly, bypassing cache).
- **ACLs disabled (Object Ownership = Bucket owner enforced).** Access is controlled only by IAM and bucket
  policy. This is the default for new buckets and avoids the whole class of "ACL" errors.
- Originals can stay private even from the CDN if you prefer: restrict the CloudFront origin path or the
  bucket policy to `v/*` and `uploads/*` (see the note in section 3).

### Create the bucket

Console: S3 > Create bucket > name `<BUCKET>`, Region `<REGION>`, **ACLs disabled**, **Block all public access
checked**, Default encryption **SSE-S3** (keep it; see KMS note in section 9), Versioning off (content-hashed keys
never change; turn on only if you want undo for deletes).

CLI (note: for any region other than `us-east-1` the `LocationConstraint` is mandatory):

```bash
aws s3api create-bucket --bucket <BUCKET> --region <REGION> \
  --create-bucket-configuration LocationConstraint=<REGION> \
  --object-ownership BucketOwnerEnforced

aws s3api put-public-access-block --bucket <BUCKET> --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

aws s3api put-bucket-encryption --bucket <BUCKET> --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"},"BucketKeyEnabled":true}]}'
```

---

## 2. CloudFront distribution with Origin Access Control (OAC)

Why OAC and not a public bucket or the legacy OAI:

- Public bucket: bypasses the CDN, cannot be locked down per distribution.
- **OAI (Origin Access Identity) is legacy**: no SSE-KMS support, not available for S3 buckets in Regions
  launched after Dec 2022, no fine-grained policy conditions. AWS recommends OAC for all new distributions.
- **OAC** signs origin requests with SigV4; the bucket policy trusts only your distribution.

### Console

1. CloudFront > Create distribution.
2. Origin domain: pick the S3 bucket **REST endpoint** from the list
   (`<BUCKET>.s3.<REGION>.amazonaws.com`). Do **not** use the "static website endpoint"
   (`s3-website-...`): website endpoints cannot use OAC.
3. Origin access: **Origin access control settings (recommended)** > Create new OAC, Signing behavior
   **Sign requests (recommended)**, type S3.
4. Origin path: leave **empty** (a wrong origin path is a common cause of 403, section 9).
5. Viewer protocol policy: **Redirect HTTP to HTTPS**. Allowed methods: **GET, HEAD**.
6. Cache policy: **CachingOptimized** (managed). Origin request policy: none. Response headers policy:
   see section 6.
7. Compress objects automatically: **Yes**. Supported HTTP versions: **HTTP/2 and HTTP/3**.
8. Price class: **Use only North America and Europe** (PriceClass_100) if your audience is mostly there.
9. Alternate domain name and certificate: section 7 (can be added later).
10. Default root object: leave empty (we never serve `/`).
11. Create. CloudFront shows a banner "The S3 bucket policy needs to be updated": **copy the policy**
    (or use the one below).

### CLI

Create the OAC:

```bash
cat > oac.json <<'JSON'
{
  "Name": "photos-oac",
  "Description": "OAC for photos bucket",
  "SigningProtocol": "sigv4",
  "SigningBehavior": "always",
  "OriginAccessControlOriginType": "s3"
}
JSON
aws cloudfront create-origin-access-control --origin-access-control-config file://oac.json
# note the "Id" in the output -> <OAC_ID>
```

Create the distribution (`dist.json`). `658327ea-f89d-4fab-a63d-7e88639e58f6` is the managed
**CachingOptimized** cache policy id; `<RHP_ID>` is the response headers policy from section 6
(or remove the `ResponseHeadersPolicyId` line for now).

```json
{
  "CallerReference": "photos-2026-01",
  "Comment": "photos",
  "Enabled": true,
  "HttpVersion": "http2and3",
  "IsIPV6Enabled": true,
  "PriceClass": "PriceClass_100",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "s3-photos",
        "DomainName": "<BUCKET>.s3.<REGION>.amazonaws.com",
        "OriginPath": "",
        "S3OriginConfig": { "OriginAccessIdentity": "" },
        "OriginAccessControlId": "<OAC_ID>"
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "s3-photos",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] }
    },
    "Compress": true,
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "ResponseHeadersPolicyId": "<RHP_ID>"
  }
}
```

```bash
aws cloudfront create-distribution --distribution-config file://dist.json
# note "Id" (<DIST_ID>), "ARN" and "DomainName" (dxxxx.cloudfront.net)
```

### Bucket policy: only this distribution may read

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontReadViaOAC",
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::<BUCKET>/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::<ACCOUNT_ID>:distribution/<DIST_ID>"
        }
      }
    }
  ]
}
```

```bash
aws s3api put-bucket-policy --bucket <BUCKET> --policy file://bucket-policy.json
```

To keep originals private, change `Resource` to two entries: `arn:aws:s3:::<BUCKET>/v/*` and
`arn:aws:s3:::<BUCKET>/uploads/*`. The app (IAM user) still reads originals; the public internet cannot.
Include `s3:ListBucket` for the OAC principal only if you want CloudFront to return 404 (instead of 403) for
missing keys; this is cosmetic.

Do **not** add a statement that grants the IAM user here; IAM user permissions live in section 3.

---

## 3. IAM: least-privilege identity for the app

Why not root keys: root keys have unlimited power and cannot be scoped or easily rotated. Create a dedicated
identity that can only touch this bucket's prefixes.

Where the app runs decides the identity:

- **Vercel / any host outside AWS**: an IAM **user** with an access key (below), stored as environment variables.
- **EC2 / ECS / Lambda**: attach an IAM **role**; leave `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` unset and
  the SDK credential chain picks it up. Prefer this when possible (no long-lived keys).

Policy (`app-policy.json`). The two resource forms are both required: object actions need `bucket/*`, but
`s3:ListBucket` is a **bucket** action and needs the bucket ARN without `/*` (the classic AccessDenied).

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ObjectAccessOnAppPrefixes",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": [
        "arn:aws:s3:::<BUCKET>/originals/*",
        "arn:aws:s3:::<BUCKET>/v/*",
        "arn:aws:s3:::<BUCKET>/uploads/*"
      ]
    },
    {
      "Sid": "ListOnlyAppPrefixes",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::<BUCKET>",
      "Condition": {
        "StringLike": { "s3:prefix": ["originals/*", "v/*", "uploads/*"] }
      }
    }
  ]
}
```

`s3:ListBucket` is also what turns a missing key from `403 AccessDenied` into `404 NoSuchKey` on
GetObject/HeadObject. The provider treats 404 as "not found"; without ListBucket a missing key looks like 403.

CLI:

```bash
aws iam create-user --user-name photos-app
aws iam put-user-policy --user-name photos-app --policy-name photos-bucket-access \
  --policy-document file://app-policy.json
aws iam create-access-key --user-name photos-app
# Copy AccessKeyId and SecretAccessKey NOW; the secret is shown only once.
```

Console: IAM > Users > Create user (no console access) > Attach policies directly > Create policy (JSON tab) >
then Security credentials > Create access key > "Application running outside AWS".

Hygiene: rotate keys every 90 days (`create-access-key`, update env, `update-access-key --status Inactive`,
then delete), never commit keys, never paste them in chat or tickets.

### Environment variables and where they go

Put these in `.env` (local/server) or your host's secret store (Vercel project settings). Names match
`.env.example` and `src/env.ts`:

| Variable                     | Value                    | Notes                                                                                          |
| ---------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| `STORAGE_DRIVER`             | `s3`                     | `local` (default) uses disk                                                                    |
| `AWS_REGION`                 | `<REGION>`               | Must be the **bucket's** region                                                                |
| `S3_BUCKET`                  | `<BUCKET>`               |                                                                                                |
| `STORAGE_PUBLIC_BASE_URL`    | `https://<CDN_DOMAIN>`   | No trailing slash needed. Required for s3: public URLs are `<base>/<key>`                      |
| `AWS_ACCESS_KEY_ID`          | from `create-access-key` | Omit when using a role. Set both or neither                                                    |
| `AWS_SECRET_ACCESS_KEY`      | from `create-access-key` | No quotes, no trailing newline or space                                                        |
| `S3_ENDPOINT`                | empty for AWS            | Only for MinIO/S3-compatible, e.g. `http://localhost:9000`                                     |
| `S3_FORCE_PATH_STYLE`        | `false` for AWS          | `true` for MinIO                                                                               |
| `NEXT_PUBLIC_IMAGE_BASE_URL` | `https://<CDN_DOMAIN>`   | Base used by the `next/image` loader in `src/lib/photos/loader.ts`. Falls back to `/api/media` |

Also: `next.config.ts` reads `STORAGE_PUBLIC_BASE_URL` at build time for `images.remotePatterns`, so set it
before `next build`, not only at runtime.

---

## 4. CORS for presigned browser uploads (PUT)

Only needed if the browser uploads straight to S3 (section 5). Server-side uploads need no CORS.
CORS is a **bucket** setting (it applies to the S3 endpoint the browser talks to, not CloudFront).
Use exact origins, never `*` with PUT:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["<SITE_ORIGIN>", "http://localhost:3000"],
      "AllowedMethods": ["PUT"],
      "AllowedHeaders": ["Content-Type", "Cache-Control"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

```bash
aws s3api put-bucket-cors --bucket <BUCKET> --cors-configuration file://cors.json
```

Remove `http://localhost:3000` in production-only setups. If the images are read cross-origin by the page
(canvas, `fetch`), the CDN also needs CORS: add `Access-Control-Allow-Origin: <SITE_ORIGIN>` through the
response headers policy in section 6. `<img>` tags do not need CORS.

---

## 5. Presigned uploads vs server-side uploads

|            | Server-side (`storage.put`)                                                                    | Presigned (`storage.presignPut`)                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Flow       | browser -> Next.js route -> S3                                                                 | browser -> S3 directly with a short-lived URL                                                                    |
| Body limit | Vercel serverless request bodies are limited to **4.5 MB**; self-hosted Node has no such limit | Not limited by the app (S3 allows 5 GB per single PUT)                                                           |
| Processing | Natural: the route already has the bytes (validate, EXIF, sharp, variants)                     | Needs a second step: after upload the server downloads the object (`storage.get`), re-validates and processes it |
| Use when   | Running locally or self-hosted; small files (avatar, cover, <4 MB)                             | Big originals (photos up to 40 MB) on Vercel or any host with a body cap                                         |

Recommended plan: **server-side while local** (current state, `ingestPhoto` takes a `Buffer`).
When deploying on Vercel, upload originals with a presigned URL, then call a server action that
reads the object, runs `ingestPhoto`, and stores the variants.

How `StorageProvider.presignPut` supports it: `S3StorageProvider.presignPut(key, { contentType, maxBytes, expiresInSec })`
returns `{ url, headers }`. The browser must send exactly those headers:

```ts
const { url, headers } = await storage.presignPut(key, {
  contentType: 'image/jpeg',
  maxBytes: 40 * 1024 * 1024,
  expiresInSec: 300,
})
await fetch(url, { method: 'PUT', headers, body: file })
```

Notes:

- `Content-Type` and `Cache-Control` are signed: the PUT must send the same values or S3 returns
  `SignatureDoesNotMatch`.
- S3 cannot enforce a maximum size on a presigned PUT (only presigned POST can). `maxBytes` is validated for
  sanity; the real check is the post-upload `validateImageUpload` (size, magic bytes). Reject and delete
  oversized objects there, and keep `expiresInSec` short (60-300).
- The provider disables SDK default checksums (`requestChecksumCalculation: 'WHEN_REQUIRED'`) because recent
  SDK versions otherwise embed an `x-amz-checksum-crc32` of an empty body in the URL and the browser upload fails.
- `LocalStorageProvider` has no `presignPut`; callers must check `if (storage.presignPut)` and fall back to
  server-side upload.

---

## 6. CloudFront caching, compression, headers

**Cache policy: managed `CachingOptimized`** (id `658327ea-f89d-4fab-a63d-7e88639e58f6`): min TTL 1 s,
default 86400 s, max 31536000 s, no query strings/cookies/headers in the cache key, Brotli + gzip enabled.
Because the origin sends `Cache-Control: public, max-age=31536000, immutable` (the app sets it on every
PutObject for content-hashed keys, via `cacheControlFor`), CloudFront honors it up to the 1-year maximum and
browsers cache for a year without revalidation.

Important: `Cache-Control` is stored **on the S3 object at upload time**. Objects uploaded without it get
CloudFront's default TTL (1 day) and browsers revalidate. Fix existing objects with:

```bash
aws s3 cp s3://<BUCKET>/v/ s3://<BUCKET>/v/ --recursive \
  --metadata-directive REPLACE --cache-control "public, max-age=31536000, immutable" \
  --content-type image/webp --exclude "*" --include "*.webp"
# repeat with image/avif for *.avif (Content-Type must be re-specified when replacing metadata)
```

Other settings:

- **Compression**: keep "Compress objects automatically" on. CloudFront compresses only compressible types
  (CSS, JS, JSON, SVG...) and **never** re-compresses AVIF/WebP/JPEG meaningfully; images are already
  compressed, so `content-encoding` will usually be absent for them. That is expected, not a bug.
- **HTTP/2 + HTTP/3**: set `HttpVersion` to `http2and3` (done above). IPv6 on.
- **Format negotiation**: we pre-generate AVIF and WebP for every width, and the frontend selects them with
  `srcset` / `<picture>` (`buildSrcSet` in `src/lib/photos/loader.ts`). No `Accept`-header negotiation is
  needed and the cache key stays simple (do not add `Accept` to the cache key: it fragments the cache).
  A CloudFront Function that rewrites the extension by `Accept` is optional and not required.
- **Response headers policy** (recommended): create a custom policy (CloudFront > Policies > Response headers)
  or use the managed `SecurityHeadersPolicy` (`67f7725c-6f97-4210-82d7-5512b31e9d03`). Add custom headers
  `X-Content-Type-Options: nosniff` and, if you read images cross-origin, CORS `Access-Control-Allow-Origin`
  with `<SITE_ORIGIN>`. A custom policy via CLI:

```json
{
  "Name": "photos-headers",
  "SecurityHeadersConfig": {
    "ContentTypeOptions": { "Override": true },
    "StrictTransportSecurity": {
      "Override": true,
      "IncludeSubdomains": true,
      "Preload": true,
      "AccessControlMaxAgeSec": 63072000
    }
  },
  "CorsConfig": {
    "AccessControlAllowOrigins": { "Quantity": 1, "Items": ["<SITE_ORIGIN>"] },
    "AccessControlAllowHeaders": { "Quantity": 1, "Items": ["*"] },
    "AccessControlAllowMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] },
    "AccessControlAllowCredentials": false,
    "OriginOverride": true
  }
}
```

```bash
aws cloudfront create-response-headers-policy --response-headers-policy-config file://rhp.json
```

- **Invalidation strategy**: **never needed for hashed keys** (a changed image has a different key; old URLs
  stay valid and cached). For emergencies only (for example a wrongly published private photo; delete the
  object first, then invalidate): `aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"`.
  The first 1,000 invalidation paths per month are free; a wildcard counts as one path.
- **Private albums (optional, later)**: use CloudFront **signed URLs/cookies** with a **trusted key group**
  (CloudFront > Public keys + Key groups, then set "Restrict viewer access" on a separate behavior such as
  `/private/*`). Private content must not share the `immutable` public caching rules.

---

## 7. Custom domain and certificate

1. **ACM certificate must be in `us-east-1`** for CloudFront, regardless of the bucket's region.
   Console: switch to N. Virginia > Certificate Manager > Request public certificate for `<CDN_DOMAIN>` >
   DNS validation > create the validation CNAME (one click if the zone is in Route 53).

```bash
aws acm request-certificate --region us-east-1 --domain-name <CDN_DOMAIN> --validation-method DNS
aws acm describe-certificate --region us-east-1 --certificate-arn <CERT_ARN>   # shows the CNAME to create
```

2. CloudFront > distribution > Settings > Edit: Alternate domain name `<CDN_DOMAIN>`, Custom SSL certificate =
   the us-east-1 cert, Security policy `TLSv1.2_2021`.
3. DNS: Route 53 > hosted zone > Create record, name `photos`, type **A**, Alias **on**, target the distribution
   (also create AAAA for IPv6). The alias hosted zone id for CloudFront is always `Z2FDTNDATAQYW2`. Other DNS
   providers: a `CNAME photos -> dxxxx.cloudfront.net`.
4. Set `STORAGE_PUBLIC_BASE_URL=https://<CDN_DOMAIN>`.

**Region note**: the bucket can live in any region (`eu-south-1`, `eu-west-1`...). CloudFront is global and the
cert is `us-east-1`, but the app's `AWS_REGION` must equal the **bucket** region. A mismatch is the classic
failure: `PermanentRedirect` / 301 or `AuthorizationHeaderMalformed` (section 9).

---

## 8. Lifecycle, cost control

Lifecycle (abort incomplete multipart uploads after 7 days; optionally Intelligent-Tiering for originals):

```json
{
  "Rules": [
    {
      "ID": "abort-incomplete-multipart",
      "Status": "Enabled",
      "Filter": {},
      "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 }
    },
    {
      "ID": "originals-intelligent-tiering",
      "Status": "Enabled",
      "Filter": { "Prefix": "originals/" },
      "Transitions": [{ "Days": 0, "StorageClass": "INTELLIGENT_TIERING" }]
    }
  ]
}
```

```bash
aws s3api put-bucket-lifecycle-configuration --bucket <BUCKET> --lifecycle-configuration file://lifecycle.json
```

Intelligent-Tiering has a small per-object monitoring fee and ignores objects under 128 KB for tiering; for a
personal library of a few GB it is optional. Skip it if unsure.

Cost control:

- Create a budget with alerts: Billing > Budgets > Create budget > Cost budget, for example 5 USD/month, email
  alerts at 80% and 100%.
- `PriceClass_100` limits edge locations to North America and Europe (cheapest).
- Always serve via CloudFront: S3-to-internet transfer is more expensive than S3-to-CloudFront (free) plus
  CloudFront egress, and it bypasses caching. A private bucket enforces this.
- Long immutable caching means few origin requests. Do not lower TTLs.
- Pre-generated widths cap bandwidth: the grid requests small variants only (`GRID_SIZES`).

---

## 9. Troubleshooting (access and saving problems)

First, always run these three diagnostics with the same credentials the app uses:

```bash
aws sts get-caller-identity                         # who am I? is it the photos-app user, not root/another account?
aws s3api head-bucket --bucket <BUCKET> --region <REGION>     # exists + I can reach it? (403 = no permission, 404 = wrong name, 301 = wrong region)
echo test > t.txt && aws s3 cp t.txt s3://<BUCKET>/uploads/t.txt && aws s3 rm s3://<BUCKET>/uploads/t.txt   # PutObject + DeleteObject work?
curl -I https://<CDN_DOMAIN>/v/<some-existing-key>   # does the CDN serve it?
```

| Symptom                                                                           | Likely cause                                                                                                                                                                                                     | Fix                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AccessDenied` on PutObject/GetObject from the app                                | IAM policy resource is the bucket ARN (`arn:aws:s3:::<BUCKET>`) instead of `arn:aws:s3:::<BUCKET>/*` for object actions, or key is outside allowed prefixes (`originals/`, `v/`, `uploads/`)                     | Use the policy in section 3: objects need `bucket/prefix/*`; `ListBucket` needs the bare bucket ARN                                                                                                                             |
| `AccessDenied` although policy looks right                                        | Wrong identity (env vars shadow a profile, or another account's keys)                                                                                                                                            | `aws sts get-caller-identity` with the app's env; check a bucket policy `Deny`; check Block Public Access is not the cause (it never blocks IAM users)                                                                          |
| 403 `AccessDenied` / XML error through CloudFront                                 | Bucket policy missing, wrong `AWS:SourceArn` (different distribution id or account), OAC not attached to the origin, origin is the website endpoint, or a non-empty **Origin path** that does not match the keys | Re-check section 2: REST endpoint origin, OAC attached, `SourceArn` equals `arn:aws:cloudfront::<ACCOUNT_ID>:distribution/<DIST_ID>`, empty origin path                                                                         |
| 403 for a key that does not exist                                                 | Principal lacks `s3:ListBucket`, so S3 answers 403 instead of 404                                                                                                                                                | Add `s3:ListBucket` (section 3, and optionally for the OAC principal)                                                                                                                                                           |
| 403 at `https://<CDN_DOMAIN>/`                                                    | No default root object (we do not serve `/`)                                                                                                                                                                     | Expected. Test with a real key                                                                                                                                                                                                  |
| `SignatureDoesNotMatch`                                                           | Secret key has a trailing newline/space or quotes in `.env`; wrong region in the client; system clock off by more than 5 minutes; for presigned PUT: headers sent differ from the signed ones                    | Re-copy the secret on one line; set `AWS_REGION` to the bucket region; sync the clock (`w32tm /resync` on Windows); send exactly the returned `headers`                                                                         |
| `PermanentRedirect` / HTTP 301 / "must be addressed using the specified endpoint" | `AWS_REGION` is not the bucket's region                                                                                                                                                                          | `aws s3api get-bucket-location --bucket <BUCKET>`; set `AWS_REGION` accordingly (`null` means `us-east-1`)                                                                                                                      |
| `AuthorizationHeaderMalformed`                                                    | Same region mismatch                                                                                                                                                                                             | Same fix                                                                                                                                                                                                                        |
| Browser upload: CORS preflight fails ("No 'Access-Control-Allow-Origin'")         | Bucket CORS missing, origin not listed exactly (scheme, host, port; no trailing slash), method/headers not allowed                                                                                               | Section 4; verify with `aws s3api get-bucket-cors --bucket <BUCKET>`; check the browser's actual `Origin`                                                                                                                       |
| Presigned PUT returns 400 with a checksum error                                   | SDK added `x-amz-checksum-*` to the URL                                                                                                                                                                          | The provider already disables it; if you built your own client pass `requestChecksumCalculation: 'WHEN_REQUIRED'`                                                                                                               |
| "Credential could not be loaded" / `CredentialsProviderError`                     | Env names wrong or empty (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` exactly; not `AWS_KEY`, not `S3_*`); `.env` not loaded in the process; host (Vercel) has no env set for that environment                  | Print which of the vars are set (without values) in a script; set them in the host's project settings and redeploy                                                                                                              |
| App error "STORAGE_DRIVER=s3 requires: ..."                                       | Missing `S3_BUCKET`, `AWS_REGION`, or `STORAGE_PUBLIC_BASE_URL`                                                                                                                                                  | Set them (section 3)                                                                                                                                                                                                            |
| CloudFront 403/`AccessDenied` only on objects encrypted with **SSE-KMS**          | OAC needs `kms:Decrypt` on the key for the CloudFront service principal                                                                                                                                          | Simplest: use **SSE-S3** (AES256) as in section 1. For KMS, add to the key policy a statement allowing `cloudfront.amazonaws.com` `kms:Decrypt`, `kms:Encrypt`, `kms:GenerateDataKey*` with `AWS:SourceArn` of the distribution |
| `AccessControlListNotSupported` / "bucket does not allow ACLs"                    | Something sends an ACL (`--acl public-read`, `ACL:` in code) to a BucketOwnerEnforced bucket                                                                                                                     | Remove the ACL parameter. We never use ACLs                                                                                                                                                                                     |
| Updated file still shows the old image                                            | Cached old object                                                                                                                                                                                                | Not applicable for hashed keys (new bytes = new key). For an emergency: invalidate `/*` (section 6). Check `x-cache` and `age`                                                                                                  |
| 404 `NoSuchKey` on a fresh upload                                                 | Key mismatch (leading slash, wrong prefix) or the DB key differs from the uploaded key                                                                                                                           | `aws s3 ls s3://<BUCKET>/v/<sha>/`; compare with the DB key; `publicUrl` is `<base>/<key>` with no extra prefix                                                                                                                 |
| Images load slowly / always MISS                                                  | Objects lack `Cache-Control`, or `Vary`/query strings fragment the cache                                                                                                                                         | Check headers (section 10); make sure no query strings or `Accept` in the cache key                                                                                                                                             |
| New distribution returns 403/404 right after creation                             | DNS/propagation or bucket policy not applied yet                                                                                                                                                                 | Wait 5-15 minutes until status is `Deployed`; test the `dxxxx.cloudfront.net` domain first                                                                                                                                      |

---

## 10. Verification checklist

Upload one photo (or `aws s3 cp` a test file with metadata) and check:

```bash
KEY=v/<sha256>/640.webp    # a real variant key
# 1st request: Miss (or Hit if warmed); 2nd request must be Hit
curl -sI https://<CDN_DOMAIN>/$KEY | grep -iE "^(HTTP|x-cache|cache-control|content-type|content-encoding|age|via|etag)"
curl -sI https://<CDN_DOMAIN>/$KEY | grep -iE "^(x-cache|age)"
```

Expected on the second request:

- `HTTP/2 200` (or `HTTP/3 200` with `curl --http3`)
- `x-cache: Hit from cloudfront` (first request: `Miss from cloudfront`; `RefreshHit` after TTL expiry)
- `age: <seconds>` greater than 0
- `cache-control: public, max-age=31536000, immutable`
- `content-type: image/webp` (or `image/avif`), correct for the extension
- `content-encoding`: absent for AVIF/WebP/JPEG is normal; `br`/`gzip` appears for compressible types only
- `etag` and `via: ... (CloudFront)` present; `x-content-type-options: nosniff` if the headers policy is set

Negative checks:

```bash
curl -sI https://<BUCKET>.s3.<REGION>.amazonaws.com/$KEY | head -1     # expect 403: bucket is not public
curl -sI https://<CDN_DOMAIN>/originals/aa/doesnotexist.jpg | head -1  # expect 403/404, never 200
```

Then in the browser:

1. DevTools > Network > filter Img: images load from `<CDN_DOMAIN>`, sizes match the viewport (`srcset`), repeated
   reload shows `(disk cache)` or 304-free memory hits.
2. Run **Lighthouse** (Chrome DevTools > Lighthouse, mobile, "Performance"): check "Serve images in next-gen
   formats", "Efficiently encode images", "Properly size images", "Use efficient cache policy", and LCP. The
   first grid row should be `priority`/eager and have `width`/`height` to avoid layout shift (see
   `src/lib/photos/loader.ts`).

---

## 11. Local MinIO walkthrough (test the S3 provider offline)

MinIO is an S3-compatible server. `compose.yaml` defines the `minio` service under the `s3` profile.

```bash
docker compose --profile s3 up -d minio
# API: http://localhost:9000    Console: http://localhost:9001   (user/password: minioadmin / minioadmin)
```

Create the bucket, with the console (http://localhost:9001 > Buckets > Create bucket `photos`) or with `mc`:

```bash
docker run --rm --network host --entrypoint /bin/sh minio/mc -c "
  mc alias set local http://localhost:9000 minioadmin minioadmin &&
  mc mb --ignore-existing local/photos &&
  mc anonymous set download local/photos"
```

`anonymous set download` makes the bucket readable without credentials, which stands in for CloudFront locally
(no CDN in this setup). On Docker Desktop for Windows/macOS `--network host` may not reach the host; use
`http://host.docker.internal:9000` as the alias URL there.

`.env` for local S3 testing:

```env
STORAGE_DRIVER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=photos
S3_ENDPOINT=http://localhost:9000
S3_FORCE_PATH_STYLE=true
STORAGE_PUBLIC_BASE_URL=http://localhost:9000/photos
NEXT_PUBLIC_IMAGE_BASE_URL=http://localhost:9000/photos
```

Notes: path-style is required (MinIO has no bucket subdomains locally); MinIO accepts any region string. With
`STORAGE_DRIVER=s3` the `/api/media` route returns 404 by design (the CDN/base URL serves files), so image URLs
must come from `storage.publicUrl(key)` or the loader. Stop and reset: `docker compose --profile s3 down`
(add `-v` to delete the `minio-data` volume). Switch back with `STORAGE_DRIVER=local`.

---

## 12. Switching over to AWS

1. Complete sections 1-3 (bucket, CloudFront + OAC, bucket policy, IAM user). Optionally section 7 (domain).
2. Verify with a manual upload and the section 10 checks.
3. Set the env vars from the table in section 3 (`STORAGE_DRIVER=s3`, `AWS_REGION`, `S3_BUCKET`,
   `STORAGE_PUBLIC_BASE_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `NEXT_PUBLIC_IMAGE_BASE_URL`);
   leave `S3_ENDPOINT` empty and `S3_FORCE_PATH_STYLE=false`. Rebuild (the CDN host is read by `next.config.ts` at
   build time) and redeploy.
4. Migrate existing local files: `aws s3 sync ./storage-data s3://<BUCKET>/ --cache-control "public, max-age=31536000, immutable"`
   (keys are the relative paths, so they stay identical). `sync` cannot set per-type `Content-Type` correctly
   for every file on all platforms: check with `aws s3api head-object` that `.webp`/`.avif` objects have
   `image/webp`/`image/avif`; otherwise re-ingest those photos through the app.
5. Optional: apply CORS (section 4), lifecycle and budget (section 8).

**No data migration when the CDN changes.** The database stores only storage KEYS
(`originals/aa/<sha>.jpg`, `v/<sha>/640.webp`), never URLs. Changing the CloudFront domain, adding a custom
domain or moving back to local disk only requires changing `STORAGE_PUBLIC_BASE_URL` /
`NEXT_PUBLIC_IMAGE_BASE_URL` and redeploying.
