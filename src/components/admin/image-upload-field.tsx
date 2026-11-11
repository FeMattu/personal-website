'use client'

import { ImageUp, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useRef, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { ActionResult } from '@/lib/action-result'
import { mediaUrl } from '@/lib/media'

type Props = {
  label: string
  /** Current storage key (the DB stores keys only). */
  currentKey: string | null
  onUpload: (formData: FormData) => Promise<ActionResult<unknown>>
  onRemove?: () => Promise<ActionResult>
  hint?: string
  accept?: string
}

/** Single-image uploader: posts `FormData { file }` to a server action and previews the stored key. */
export function ImageUploadField({
  label,
  currentKey,
  onUpload,
  onRemove,
  hint = 'JPEG, PNG, WebP or AVIF, up to 5 MB.',
  accept = 'image/jpeg,image/png,image/webp,image/avif',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const inputId = `${label.replace(/\W+/g, '-').toLowerCase()}-file`

  async function onChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy(true)
    const formData = new FormData()
    formData.set('file', file)
    const result = await onUpload(formData)
    setBusy(false)
    if (inputRef.current) inputRef.current.value = ''
    if (result.ok) toast.success('Image uploaded')
    else toast.error(result.fieldErrors?.file ?? result.error)
  }

  async function remove() {
    if (!onRemove) return
    setBusy(true)
    const result = await onRemove()
    setBusy(false)
    if (result.ok) toast.success('Image removed')
    else toast.error(result.error)
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="flex flex-wrap items-center gap-3">
        {currentKey ? (
          <Image
            src={mediaUrl(currentKey)}
            alt={`${label} preview`}
            width={96}
            height={96}
            unoptimized
            className="size-24 rounded-lg border object-cover"
          />
        ) : (
          <div className="flex size-24 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
            <ImageUp aria-hidden />
          </div>
        )}
        <div className="grid gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={accept}
            disabled={busy}
            onChange={onChange}
            className="text-sm file:mr-3 file:rounded-md file:border file:bg-secondary file:px-3 file:py-1 file:text-sm"
          />
          {currentKey && onRemove ? (
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={remove}>
              <Trash2 /> Remove
            </Button>
          ) : null}
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
    </div>
  )
}
