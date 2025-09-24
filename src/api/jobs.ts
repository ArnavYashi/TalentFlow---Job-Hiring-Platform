// src/api/jobs.ts
import { keepPreviousData, useQuery } from '@tanstack/react-query'

export type JobStatus = 'active' | 'archived'
export interface Job {
  id: string
  title: string
  slug: string
  status: JobStatus
  tags: string[]
  order: number
  createdAt: number
  updatedAt?: number
  department?: string
  location?: string
}

type UseJobsParams = { search?: string; status?: string; page?: number; pageSize?: number }

/** Query hook for jobs (server-like) */
export function useJobs(params: UseJobsParams) {
  const { search = '', status = '', page = 1, pageSize = 10 } = params

  return useQuery({
    queryKey: ['jobs', search, status, page, pageSize],
    queryFn: async () => {
      const qs = new URLSearchParams({
        search,
        status,
        page: String(page),
        pageSize: String(pageSize),
      })
      const res = await fetch(`/jobs?${qs.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch jobs')
      return (await res.json()) as Promise<{ data: Job[]; total: number }>
    },
    placeholderData: keepPreviousData,
  })
}

/** Create a new job */
export async function createJob(payload: Partial<Job>) {
  // ensure required fields are present - server will also set defaults
  const body = {
    ...payload,
    title: payload.title ?? '',
    slug: payload.slug ?? '',
    tags: payload.tags ?? [],
  }
  const res = await fetch('/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(err.message || 'Failed to create job')
  }
  return res.json()
}

/** Update an existing job */
export async function updateJob(id: string, patch: Partial<Job>) {
  const res = await fetch(`/jobs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(err.message || 'Failed to update job')
  }
  return res.json()
}
