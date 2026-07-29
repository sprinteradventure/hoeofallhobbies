'use client'

import { useRef, useState } from 'react'
import { uploadToStorage } from '@/lib/uploadMedia'
import { Upload, X, Loader2 } from 'lucide-react'

// ============================================================================
// VideoUploader — single optional short video for a listing.
// Direct-to-storage via /api/upload/sign (videos far exceed the serverless
// body cap). Controlled component: value is the stored video_url (or null).
// ============================================================================

const ACCEPTED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_BYTES = 50 * 1024 * 1024 // Supabase free-tier per-file cap

export default function VideoUploader({
  value,
  onChange,
}: {
  value: string | null
  onChange: (url: string | null) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  async function handleFile(file: File | null) {
    if (!file) return
    setError('')

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(`"${file.name}" isn't a supported video. Please use MP4, WebM, or MOV.`)
      return
    }
    if (file.size > MAX_BYTES) {
      setError(`"${file.name}" is over 50 MB. Please choose a shorter or smaller video.`)
      return
    }

    try {
      setUploading(true)
      setProgress(0)
      const url = await uploadToStorage('video', file, setProgress)
      onChange(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      setProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-blush bg-black">
          <video
            src={value}
            controls
            playsInline
            preload="metadata"
            className="w-full max-h-72"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
            aria-label="Remove video"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`w-full rounded-xl border-2 border-dashed p-6 flex flex-col items-center justify-center gap-2 transition-all ${
            uploading
              ? 'border-blush bg-ivory/50 cursor-wait opacity-80'
              : 'border-gold/50 bg-ivory hover:border-gold hover:bg-gold/5 cursor-pointer'
          }`}
        >
          {uploading ? (
            <Loader2 className="h-7 w-7 text-gold animate-spin" />
          ) : (
            <Upload className="h-7 w-7 text-gold" />
          )}
          <p className="font-semibold text-charcoal">
            {uploading ? `Uploading video… ${progress}%` : 'Add a short video (up to 50 MB)'}
          </p>
          <p className="text-xs text-taupe">MP4, WebM or MOV — optional</p>
          {uploading && (
            <div className="w-full max-w-xs h-1.5 rounded-full bg-blush overflow-hidden">
              <div
                className="h-full bg-gold transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}
    </div>
  )
}
