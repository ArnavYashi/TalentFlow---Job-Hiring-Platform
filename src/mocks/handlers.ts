// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'
import { db } from '../db'
import { v4 as uuid } from 'uuid'
import type { JobStatus } from '../db/index'

const maybeFail = (write = false) => {
  if (!write) return false
  // 5-10% failure on writes:
  return Math.random() < 0.08
}

export const handlers = [
  // GET /jobs?search=&status=&page=&pageSize=&sort=
  http.get('/jobs', async ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status') || ''
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10')

    let jobs = await db.jobs.toArray()
    if (search) {
      const s = search.toLowerCase()
      jobs = jobs.filter(j => j.title.toLowerCase().includes(s) || (j.tags || []).some(t => t.toLowerCase().includes(s)))
    }
    if (status) jobs = jobs.filter(j => j.status === status)

    // simple sort by order
    jobs = jobs.sort((a, b) => a.order - b.order)

    const start = (page - 1) * pageSize
    const paged = jobs.slice(start, start + pageSize)

    // Simulate delay with setTimeout if needed, but MSW http does not support delay in HttpResponseInit
    return HttpResponse.json({ data: paged, total: jobs.length }, { status: 200 })
  }),

  // POST /jobs
  http.post('/jobs', async ({ request }) => {
    const body = await request.json() as {
      title: string;
      slug: string;
      tags?: string[];
      order?: number;
    } | null;
    if (maybeFail(true)) return HttpResponse.json({ message: 'Random write failure (for testing rollback).' }, { status: 500 })

    const newJob = {
      id: uuid(),
      title: body?.title ?? '',
      slug: body?.slug ?? '',
  status: 'active' as JobStatus,
      tags: body?.tags ?? [],
      order: body?.order ?? Date.now(),
      createdAt: Date.now()
    }
    await db.jobs.add(newJob)
    return HttpResponse.json(newJob, { status: 201 })
  }),


  // More handlers (PATCH /jobs/:id, PATCH reorder, candidates endpoints, etc.) will be added later...
  // add to src/mocks/handlers.ts (inside handlers array)
  // PATCH /jobs/:id
 // PATCH /jobs/:id
http.patch('/jobs/:id', async ({ params, request }) => {
  const { id } = params
  if (!id) {
    return HttpResponse.json({ message: 'Job ID required' }, { status: 400 })
  }

  const body = await request.json() as Partial<{
    title: string
    slug: string
    status: JobStatus
    tags: string[]
    order: number
  }>

  const job = await db.jobs.get(id as string)
  if (!job) {
    return HttpResponse.json({ message: 'Job not found' }, { status: 404 })
  }

  const updated = { ...job, ...body, updatedAt: Date.now() }
  await db.jobs.put(updated)

  return HttpResponse.json(updated, { status: 200 })
}),

 // GET /candidates?search=&stage=&page=&pageSize=
  http.get('/candidates', async ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase() || ''
    const stage = url.searchParams.get('stage') || ''
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50')

    let candidates = await db.candidates.toArray()

    if (search) {
      candidates = candidates.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search)
      )
    }

    if (stage) {
      candidates = candidates.filter((c) => c.stage === stage)
    }

    const start = (page - 1) * pageSize
    const paged = candidates.slice(start, start + pageSize)

    return HttpResponse.json({ data: paged, total: candidates.length }, { status: 200 })
  }),

  // PATCH /candidates/:id to update stage
  http.patch('/candidates/:id', async ({ params, request }) => {
    const { id } = params
    if (!id) return HttpResponse.json({ message: 'Candidate ID required' }, { status: 400 })

    const body = await request.json() as Partial<{ stage: string }>
    if (maybeFail(true)) return HttpResponse.json({ message: 'Random write failure' }, { status: 500 })

    const candidate = await db.candidates.get(id as string)
    if (!candidate) return HttpResponse.json({ message: 'Candidate not found' }, { status: 404 })

    // Only allow valid stage values
    const validStages = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'] as const
    let updatedStage = candidate.stage
    if (body.stage && validStages.includes(body.stage as any)) {
      updatedStage = body.stage as typeof validStages[number]
    }

    const updated = { ...candidate, ...body, stage: updatedStage, updatedAt: Date.now() }
    await db.candidates.put(updated)

    return HttpResponse.json(updated, { status: 200 })
  }),

  // GET /candidates/:id/timeline
  http.get('/candidates/:id/timeline', async ({ params }) => {
    const { id } = params
    const candidate = await db.candidates.get(id as string)
    if (!candidate) return HttpResponse.json({ message: 'Candidate not found' }, { status: 404 })

    // Example timeline (replace with real history if stored)
    const timeline = [
      { stage: 'applied', date: candidate.createdAt },
      { stage: candidate.stage, date: candidate.updatedAt ?? Date.now() },
    ]

    return HttpResponse.json({ timeline }, { status: 200 })
  }),
]
