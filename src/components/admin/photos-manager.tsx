'use client'

import { Pencil, Star, Upload } from 'lucide-react'
import Image from 'next/image'
import { useRef, useState, useTransition, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import {
  deletePhoto,
  setPhotoFeatured,
  setPhotoStatus,
  updatePhoto,
  uploadPhoto,
} from '@/actions/admin/photos'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { locales } from '@/i18n/config'
import { translationRows } from '@/lib/admin/mappers'
import type { ContentStatusValue } from '@/lib/admin/schema-common'
import { photoSchema, type PhotoInput } from '@/lib/admin/schema-content'
import { mediaUrl } from '@/lib/media'
import { missingLocales } from '@/lib/i18n/localize'
import { ConfirmDelete } from './confirm-delete'
import { FormFooter } from './form-footer'
import { STATUS_OPTIONS, SelectField, SwitchField, TextField, useAdminForm } from './form-kit'
import { MissingBadge, StatusBadge } from './status-badge'
import { TranslationTabs } from './translation-tabs'

export type PhotoRow = {
  id: string
  title: string
  /** Storage key of a small variant (or the original) used as thumbnail. */
  thumbKey: string
  width: number
  height: number
  status: ContentStatusValue
  featured: boolean
  albumTitle: string | null
  /** Locales without alt text. */
  missing: string[]
  form: PhotoInput
}

type Props = { photos: PhotoRow[]; albums: { id: string; title: string }[] }

function PhotoForm({
  id,
  initial,
  albums,
  onDone,
}: {
  id: string
  initial: PhotoInput
  albums: Props['albums']
  onDone: () => void
}) {
  const { form, onSubmit, submitting, locale, setLocale } = useAdminForm({
    schema: photoSchema,
    defaultValues: initial,
    submit: (values) => updatePhoto(id, values),
    successMessage: 'Photo saved',
    onSuccess: onDone,
  })
  const missing = missingLocales(translationRows(form.watch('translations')), locales, 'alt')
  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          form={form}
          name="albumId"
          label="Album"
          emptyLabel="No album"
          options={albums.map((a) => ({ value: a.id, label: a.title }))}
        />
        <SelectField form={form} name="status" label="Status" options={STATUS_OPTIONS} />
        <SwitchField form={form} name="featured" label="Featured" />
        <TextField form={form} name="tags" label="Tags" hint="Comma separated." />
      </div>
      <TranslationTabs value={locale} onValueChange={setLocale} missing={missing}>
        {(code) => (
          <>
            <TextField form={form} name={`translations.${code}.title`} label="Title" />
            <TextField
              form={form}
              name={`translations.${code}.alt`}
              label="Alt text"
              hint="Describes the photo for screen readers."
            />
            <TextField
              form={form}
              name={`translations.${code}.description`}
              label="Description"
              multiline
              rows={3}
            />
          </>
        )}
      </TranslationTabs>
      <FormFooter submitting={submitting} />
    </form>
  )
}

/** Photo library: upload (processed server side), edit, publish, feature and delete. */
export function PhotosManager({ photos, albums }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [albumId, setAlbumId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const editing = photos.find((p) => p.id === editingId)

  async function onUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    for (const file of files) {
      const formData = new FormData()
      formData.set('file', file)
      formData.set('albumId', albumId)
      const result = await uploadPhoto(formData)
      if (result.ok) toast.success(`${file.name} uploaded as draft`)
      else toast.error(`${file.name}: ${result.fieldErrors?.file ?? result.error}`)
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function run(work: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const result = await work()
      if (result.ok) toast.success(success)
      else toast.error(result.error ?? 'Something went wrong')
    })
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="upload-album">Add to album</Label>
            <select
              id="upload-album"
              value={albumId}
              onChange={(event) => setAlbumId(event.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30"
            >
              <option value="">No album</option>
              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.title}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="upload-files">
              <Upload className="size-4" aria-hidden /> Upload photos
            </Label>
            <input
              ref={inputRef}
              id="upload-files"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif"
              disabled={uploading}
              onChange={onUpload}
              className="text-sm file:mr-3 file:rounded-md file:border file:bg-secondary file:px-3 file:py-1 file:text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Up to 40 MB each. Uploads start as drafts; variants are generated automatically.
            </p>
          </div>
        </CardContent>
      </Card>

      {photos.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          No photos yet.
        </p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4">
          {photos.map((photo) => (
            <li key={photo.id}>
              <Card className="overflow-hidden pt-0">
                <Image
                  src={mediaUrl(photo.thumbKey)}
                  alt={photo.title}
                  width={320}
                  height={Math.round((320 * photo.height) / photo.width)}
                  unoptimized
                  className="aspect-4/3 w-full object-cover"
                />
                <CardContent className="grid gap-2">
                  <p className="truncate text-sm font-medium">{photo.title}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={photo.status} />
                    <MissingBadge missing={photo.missing} />
                    {photo.albumTitle ? (
                      <span className="text-xs text-muted-foreground">{photo.albumTitle}</span>
                    ) : null}
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${photo.title}`}
                      onClick={() => setEditingId(photo.id)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={pending}
                      aria-pressed={photo.featured}
                      aria-label={`${photo.featured ? 'Unfeature' : 'Feature'} ${photo.title}`}
                      onClick={() =>
                        run(() => setPhotoFeatured(photo.id, !photo.featured), 'Updated')
                      }
                    >
                      <Star className={photo.featured ? 'fill-primary text-primary' : ''} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        run(
                          () =>
                            setPhotoStatus(
                              photo.id,
                              photo.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED',
                            ),
                          'Status updated',
                        )
                      }
                    >
                      {photo.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                    </Button>
                    <ConfirmDelete
                      label={photo.title}
                      title="Delete this photo?"
                      description="The photo is removed from the site. Stored files are kept."
                      onConfirm={() => run(() => deletePhoto(photo.id), 'Deleted')}
                    />
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editing !== undefined} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit photo</DialogTitle>
            <DialogDescription>Titles and alt text are edited per language.</DialogDescription>
          </DialogHeader>
          {editing ? (
            <PhotoForm
              key={editing.id}
              id={editing.id}
              initial={editing.form}
              albums={albums}
              onDone={() => setEditingId(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
