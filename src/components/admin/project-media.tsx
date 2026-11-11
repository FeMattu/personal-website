'use client'

import { ImagePlus } from 'lucide-react'
import Image from 'next/image'
import { useRef, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import {
  addProjectImage,
  removeProjectCover,
  removeProjectImage,
  reorderProjectImages,
  uploadProjectCover,
} from '@/actions/admin/projects'
import { Label } from '@/components/ui/label'
import { mediaUrl } from '@/lib/media'
import { ConfirmDelete } from './confirm-delete'
import { ImageUploadField } from './image-upload-field'
import { SortableList } from './sortable-list'

type Props = {
  projectId: string
  coverKey: string | null
  images: { id: string; storageKey: string }[]
}

/** Cover + gallery management for an existing project (every change is saved immediately). */
export function ProjectMedia({ projectId, coverKey, images }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function onAdd(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return
    setBusy(true)
    for (const file of files) {
      const formData = new FormData()
      formData.set('file', file)
      const result = await addProjectImage(projectId, formData)
      if (!result.ok) toast.error(`${file.name}: ${result.fieldErrors?.file ?? result.error}`)
    }
    setBusy(false)
    if (inputRef.current) inputRef.current.value = ''
    toast.success('Gallery updated')
  }

  return (
    <section aria-labelledby="media-heading" className="grid max-w-3xl gap-6">
      <h2 id="media-heading" className="text-lg font-semibold">
        Images
      </h2>
      <ImageUploadField
        label="Cover image"
        currentKey={coverKey}
        onUpload={(formData) => uploadProjectCover(projectId, formData)}
        onRemove={() => removeProjectCover(projectId)}
      />
      <div className="grid gap-2">
        <Label htmlFor="gallery-files">Gallery</Label>
        <input
          ref={inputRef}
          id="gallery-files"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          disabled={busy}
          onChange={onAdd}
          className="text-sm file:mr-3 file:rounded-md file:border file:bg-secondary file:px-3 file:py-1 file:text-sm"
        />
        <p className="text-xs text-muted-foreground">
          <ImagePlus className="mr-1 inline size-3.5" aria-hidden />
          Drag to reorder. Each image up to 5 MB.
        </p>
        {images.length > 0 ? (
          <SortableList
            items={images}
            getLabel={(image) => `image ${image.storageKey.split('/').pop() ?? ''}`}
            onReorder={(ids) => reorderProjectImages(projectId, ids)}
            renderItem={(image) => (
              <div className="flex items-center justify-between gap-3">
                <Image
                  src={mediaUrl(image.storageKey)}
                  alt=""
                  width={64}
                  height={64}
                  unoptimized
                  className="size-16 rounded-md border object-cover"
                />
                <ConfirmDelete
                  label="gallery image"
                  title="Remove this image?"
                  description="The image is removed from the gallery. The stored file is kept."
                  onConfirm={async () => {
                    const result = await removeProjectImage(projectId, image.id)
                    if (result.ok) toast.success('Image removed')
                    else toast.error(result.error)
                  }}
                />
              </div>
            )}
          />
        ) : null}
      </div>
    </section>
  )
}
