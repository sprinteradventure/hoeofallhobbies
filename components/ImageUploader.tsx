'use client'

import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Upload, Plus, X, Loader2 } from 'lucide-react'

// ============================================================================
// ImageUploader — primary file-picker upload + secondary URL paste.
// Uploads go through POST /api/upload (Supabase Storage, sellers only).
// Controlled component: owns no submission logic, just the URL list.
// ============================================================================

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 5 * 1024 * 1024

export default function ImageUploader({
  value,
  onChange,
}: {
  value: string[]
  onChange: (urls: string[]) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingCount, setUploadingCount] = useState(0)
  const [error, setError] = useState('')
  const [urlInput, setUrlInput] = useState('')

  const uploading = uploadingCount > 0

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setError('')

    // Client-side pre-validation with friendly messages.
    const files = Array.from(fileList)
    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`"${file.name}" isn't a supported image. Please use JPEG, PNG, WebP, or GIF.`)
        return
      }
      if (file.size > MAX_BYTES) {
        setError(`"${file.name}" is over 5 MB. Please choose a smaller image.`)
        return
      }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Please sign in again to upload photos.')
        return
      }

      setUploadingCount(files.length)
      const uploaded = await Promise.all(
        files.map(async (file) => {
          try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await fetch('/api/upload', {
              method: 'POST',
              headers: { Authorization: `Bearer ${session.access_token}` },
              body: formData,
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok || !data?.url) {
              throw new Error(data?.error || `Couldn't upload "${file.name}".`)
            }
            return data.url as string
          } finally {
            setUploadingCount((n) => n - 1)
          }
        })
      )
      onChange([...value, ...uploaded])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setUploadingCount(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function addUrl() {
    const url = urlInput.trim()
    if (!url) return
    onChange([...value, url])
    setUrlInput('')
    setError('')
  }

  function removeImage(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      {/* Primary: file picker tile */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={`w-full rounded-xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-2 transition-all ${
          uploading
            ? 'border-blush bg-ivory/50 cursor-wait opacity-70'
            : 'border-gold/50 bg-ivory hover:border-gold hover:bg-gold/5 cursor-pointer'
        }`}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 text-gold animate-spin" />
        ) : (
          <Upload className="h-8 w-8 text-gold" />
        )}
        <p className="font-semibold text-charcoal">
          {uploading ? `Uploading ${uploadingCount} photo${uploadingCount === 1 ? '' : 's'}...` : 'Add photos'}
        </p>
        <p className="text-xs text-taupe">JPEG, PNG, WebP or GIF — up to 5 MB each</p>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* Secondary: paste a URL */}
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="...or paste an image URL"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          className="input flex-1"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
        />
        <button
          type="button"
          onClick={addUrl}
          disabled={!urlInput.trim()}
          className="btn btn-ghost border border-blush px-4 disabled:opacity-50"
          aria-label="Add image URL"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Thumbnails */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {value.map((url, i) => (
            <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-blush">
              <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                aria-label={`Remove photo ${i + 1}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
