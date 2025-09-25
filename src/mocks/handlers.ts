// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'
import { db } from '../db'
import { v4 as uuid } from 'uuid'
import type { JobStatus } from '../db/index'

const maybeFail = (write = false) => {
  if (!write) return false
  // 5–10% failure on writes
  return Math.random() < 0.08
}

export const handlers = [
  // ---------------- JOBS ----------------

  // GET /jobs
  http.get('/jobs', async ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status') || ''
    const location = url.searchParams.get('location') || ''
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10')

    let jobs = await db.jobs.toArray()

    if (search) {
      const s = search.toLowerCase()
      jobs = jobs.filter(
        j =>
          j.title.toLowerCase().includes(s) ||
          (j.tags || []).some(t => t.toLowerCase().includes(s))
      )
    }
    if (status) jobs = jobs.filter(j => j.status === status)
    if (location) jobs = jobs.filter(j => (j as any).location?.toLowerCase().includes(location.toLowerCase()))

    // simple sort by order
    jobs = jobs.sort((a, b) => a.order - b.order)

    const start = (page - 1) * pageSize
    const paged = jobs.slice(start, start + pageSize)

    return HttpResponse.json({ data: paged, total: jobs.length }, { status: 200 })
  }),

  // POST /jobs
  http.post('/jobs', async ({ request }) => {
    const body = (await request.json()) as {
      title: string
      slug: string
      tags?: string[]
      order?: number
      location?: string
    } | null

    if (maybeFail(true))
      return HttpResponse.json(
        { message: 'Random write failure (for testing rollback).' },
        { status: 500 }
      )

    const newJob = {
      id: uuid(),
      title: body?.title ?? '',
      slug: body?.slug ?? '',
      status: 'active' as JobStatus,
      tags: body?.tags ?? [],
      location: body?.location ?? 'Remote',
      order: body?.order ?? Date.now(),
      createdAt: Date.now(),
    }
    await db.jobs.add(newJob)
    return HttpResponse.json(newJob, { status: 201 })
  }),

  // PATCH /jobs/:id
  http.patch('/jobs/:id', async ({ params, request }) => {
    const { id } = params
    if (!id) {
      return HttpResponse.json({ message: 'Job ID required' }, { status: 400 })
    }

    const body = (await request.json()) as Partial<{
      title: string
      slug: string
      status: JobStatus
      tags: string[]
      order: number
      location?: string
    }>

    const job = await db.jobs.get(id as string)
    if (!job) {
      return HttpResponse.json({ message: 'Job not found' }, { status: 404 })
    }

    const updated = { ...job, ...body, updatedAt: Date.now() }
    await db.jobs.put(updated)

    return HttpResponse.json(updated, { status: 200 })
  }),
  http.get('/jobs/:id', async ({ params }) => {
  const { id } = params
  if (!id) return HttpResponse.json({ message: 'Job ID required' }, { status: 400 })

  const job = await db.jobs.get(id as string)
  if (!job) return HttpResponse.json({ message: 'Job not found' }, { status: 404 })

  return HttpResponse.json(job, { status: 200 })
}),

  // PATCH /jobs/reorder
  http.patch('/jobs/reorder', async ({ request }) => {
    const body = (await request.json()) as { orderedIds: string[] }

    if (!body?.orderedIds) {
      return HttpResponse.json({ message: 'orderedIds required' }, { status: 400 })
    }

    for (let i = 0; i < body.orderedIds.length; i++) {
      const id = body.orderedIds[i]
      await db.jobs.update(id, { order: i })
    }

    const updatedJobs = await db.jobs.toArray()
    return HttpResponse.json({ data: updatedJobs }, { status: 200 })
  }),

  // ---------------- CANDIDATES ----------------

  // GET /candidates
  http.get('/candidates', async ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase() || ''
    const stage = url.searchParams.get('stage') || ''
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50')

    let candidates = await db.candidates.toArray()

    if (search) {
      candidates = candidates.filter(
        c =>
          c.name.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search)
      )
    }

    if (stage) {
      candidates = candidates.filter(c => c.stage === stage)
    }

    const start = (page - 1) * pageSize
    const paged = candidates.slice(start, start + pageSize)

    return HttpResponse.json(
      { data: paged, total: candidates.length },
      { status: 200 }
    )
  }),

  // POST /candidates
  http.post('/candidates', async ({ request }) => {
    const body = (await request.json()) as {
      name: string
      email: string
      stage?: string
    } | null

    if (!body?.name || !body?.email) {
      return HttpResponse.json(
        { message: 'Name and email required' },
        { status: 400 }
      )
    }

    const newCandidate = {
      id: uuid(),
      name: body.name,
      email: body.email,
      stage: (body.stage || 'applied') as 'applied' | 'screen' | 'tech' | 'offer' | 'hired' | 'rejected',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    await db.candidates.add(newCandidate)
    return HttpResponse.json(newCandidate, { status: 201 })
  }),

  // PATCH /candidates/:id (stage update)
  http.patch('/candidates/:id', async ({ params, request }) => {
  console.log('[MSW] PATCH /candidates/:id called', params)
    const { id } = params
    if (!id)
      return HttpResponse.json({ message: 'Candidate ID required' }, { status: 400 })

    const body = (await request.json()) as Partial<{ stage: string }>
    if (maybeFail(true))
      return HttpResponse.json({ message: 'Random write failure' }, { status: 500 })

    const candidate = await db.candidates.get(id as string)
    if (!candidate)
      return HttpResponse.json({ message: 'Candidate not found' }, { status: 404 })

    const validStages = [
      'applied',
      'screen',
      'tech',
      'offer',
      'hired',
      'rejected',
    ] as const

    let updatedStage = candidate.stage
    if (body.stage && validStages.includes(body.stage as any)) {
      updatedStage = body.stage as (typeof validStages)[number]
    }

    const updated = {
      ...candidate,
      ...body,
      stage: updatedStage,
      updatedAt: Date.now(),
    }
    await db.candidates.put(updated)
  console.log('[MSW] Candidate updated in DB:', updated)

    return HttpResponse.json(updated, { status: 200 })
  }),

  // PATCH /candidates/:id/edit (full edit)
  http.patch('/candidates/:id/edit', async ({ params, request }) => {
    const { id } = params
    if (!id)
      return HttpResponse.json({ message: 'Candidate ID required' }, { status: 400 })

    const body = (await request.json()) as Partial<{
      name: string
      email: string
      stage: string
    }>
    const candidate = await db.candidates.get(id as string)
    if (!candidate)
      return HttpResponse.json({ message: 'Candidate not found' }, { status: 404 })

    const validStages = [
      'applied',
      'screen',
      'tech',
      'offer',
      'hired',
      'rejected',
    ] as const

    let updatedStage = candidate.stage
    if (body.stage && validStages.includes(body.stage as any)) {
      updatedStage = body.stage as (typeof validStages)[number]
    }

    const updated = { ...candidate, ...body, stage: updatedStage, updatedAt: Date.now() }
    await db.candidates.put(updated)

    return HttpResponse.json(updated, { status: 200 })
  }),

  // GET /candidates/:id/timeline
  http.get('/candidates/:id/timeline', async ({ params }) => {
    const { id } = params
    const candidate = await db.candidates.get(id as string)
    if (!candidate)
      return HttpResponse.json({ message: 'Candidate not found' }, { status: 404 })

    const timeline = [
      { stage: 'applied', date: candidate.createdAt },
      { stage: candidate.stage, date: candidate.updatedAt ?? Date.now() },
    ]

    return HttpResponse.json({ timeline }, { status: 200 })
  }),


   // ---------------- ASSESSMENTS ----------------
// GET /assessments/:jobId
http.get('/assessments/:jobId', async ({ params }) => {
  const { jobId } = params;
  const normalizedJobId =
    typeof jobId === 'string'
      ? jobId
      : Array.isArray(jobId) && jobId.length > 0
      ? jobId[0]
      : '';
  if (!normalizedJobId) {
    return HttpResponse.json({ message: 'Job ID required' }, { status: 400 });
  }
  const assessment = await db.assessments.get(normalizedJobId);
  if (!assessment) {
    return HttpResponse.json({ message: 'Assessment not found' }, { status: 404 });
  }
  return HttpResponse.json(assessment, { status: 200 });
}),

  // POST /assessments/:jobId
  http.post('/assessments/:jobId', async ({ params, request }) => {
  const { jobId } = params;
  const body = await request.json();

  // Ensure body is an object with a 'responses' property
  if (typeof body !== 'object' || body === null || !('responses' in body)) {
    return HttpResponse.json({ message: "'responses' property missing in request body" }, { status: 400 });
  }

  // Save in db or in-memory store (for testing)
  const normalizedJobId =
    typeof jobId === 'string'
      ? jobId
      : Array.isArray(jobId) && jobId.length > 0
      ? jobId[0]
      : '';
  const assessment = {
    jobId: normalizedJobId,
    sections: [], // Add sections property as required by Assessment interface
    responses: (body as { responses: any }).responses,
    createdAt: Date.now()
  };
  await db.assessments.add(assessment);

  return HttpResponse.json({ message: 'Assessment submitted', assessment }, { status: 201 });
}),

]


