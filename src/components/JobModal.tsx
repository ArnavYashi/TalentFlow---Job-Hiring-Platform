// src/components/JobModal.tsx
import React, { useEffect, useState } from 'react'
import type { Job } from '../api/jobs'

type Props = {
  job?: Job | null
  onSave: (jobData: Partial<Job> & { id?: string }) => Promise<any>
}

/** simple slugify util */
function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function JobModal({ job, onSave }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [status, setStatus] = useState<'active' | 'archived'>('active')
  const [tagsInput, setTagsInput] = useState('') // comma-separated
  const [department, setDepartment] = useState('')
  const [location, setLocation] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && job) {
      setTitle(job.title ?? '')
      setSlug(job.slug ?? '')
      setStatus(job.status ?? 'active')
      setTagsInput((job.tags || []).join(', '))
      setDepartment(job.department ?? '')
      setLocation(job.location ?? '')
      setError(null)
    } else if (open && !job) {
      // reset for create
      setTitle('')
      setSlug('')
      setStatus('active')
      setTagsInput('')
      setDepartment('')
      setLocation('')
      setError(null)
    }
  }, [open, job])

  async function checkSlugUnique(candidateSlug: string) {
    // fetch a large page to get all jobs (our seeded count is small)
    const res = await fetch('/jobs?page=1&pageSize=1000')
    if (!res.ok) return true // be lenient if network fails
    const json = await res.json()
    const existing: Job[] = json.data || []
    return !existing.some((j) => j.slug === candidateSlug && j.id !== job?.id)
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Title is required.')
      return
    }

    const computedSlug = slug.trim() || slugify(title)
    const isUnique = await checkSlugUnique(computedSlug)
    if (!isUnique) {
      setError('Slug is already taken. Change title or edit slug.')
      return
    }

    const payload: Partial<Job> & { id?: string } = {
      title: title.trim(),
      slug: computedSlug,
      status,
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      department: department.trim() || undefined,
      location: location.trim() || undefined,
    }
    if (job?.id) payload.id = job.id

    setSaving(true)
    try {
      await onSave(payload)
      setOpen(false)
    } catch (err: any) {
      setError(err?.message || 'Failed to save job')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {job ? 'Edit Job' : 'Create Job'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-labelledby="job-modal-title"
          role="dialog"
          aria-modal="true"
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              if (!saving) setOpen(false)
            }}
          />
          {/* dialog */}
          <form
            onSubmit={handleSubmit}
            className="relative z-10 w-full max-w-lg bg-black rounded shadow p-6"
          >
            <h2 id="job-modal-title" className="text-lg font-semibold mb-4">
              {job ? 'Edit Job' : 'Create Job'}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Title *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full border p-2 rounded"
                  placeholder="e.g. Frontend Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Slug (optional)</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="mt-1 w-full border p-2 rounded"
                  placeholder="will be auto-generated from title if left empty"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Tags (comma separated)</label>
                <input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="mt-1 w-full border p-2 rounded"
                  placeholder="frontend, react, remote"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium">Department</label>
                  <input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="mt-1 w-full border p-2 rounded"
                    placeholder="Engineering"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium">Location</label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1 w-full border p-2 rounded"
                    placeholder="Remote / City"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="mt-1 w-full border p-2 rounded"
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={saving}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50"
              >
                {saving ? 'Saving...' : job ? 'Save changes' : 'Create job'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
