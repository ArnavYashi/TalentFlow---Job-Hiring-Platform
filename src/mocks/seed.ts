// src/mocks/seed.ts
import { db } from '../db'
import { faker } from '@faker-js/faker'
import { v4 as uuid } from 'uuid'

export async function seedIfEmpty() {
  const jobsCount = await db.jobs.count()
  if (jobsCount > 0) return

  // 25 jobs
  const jobs = Array.from({length:25}).map((_,i) => {
    const id = uuid()
    return {
      id,
      title: `${faker.company.buzzAdjective()} ${faker.person.jobTitle()} ${i+1}`,
      slug: faker.helpers.slugify(faker.company.name() + '-' + i),
      status: Math.random() < 0.8 ? 'active' as any : 'archived' as any,
      tags: faker.helpers.arrayElements(['frontend','backend','devops','product','design','QA'], Math.ceil(Math.random()*3)),
      order: i,
      createdAt: Date.now()
    }
  })
  await db.jobs.bulkAdd(jobs)

  // 1000 candidates
  const stages = ['applied','screen','tech','offer','hired','rejected']
  const candidates = Array.from({length:1000}).map((_,i) => {
    const job = faker.helpers.arrayElement(jobs)
    return {
      id: uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      jobId: Math.random() < 0.9 ? job.id : null,
      stage: faker.helpers.arrayElement(stages) as any,
      createdAt: Date.now()
    }
  })
  await db.candidates.bulkAdd(candidates)

  // 3 assessments (pick 3 jobs)
  const chosen = faker.helpers.arrayElements(jobs, 3)
  const assessments = chosen.map(job => ({
    jobId: job.id,
    sections: Array.from({ length: 3 }).map((__, sidx) => ({
      id: `sec-${sidx}`,
      title: `Section ${sidx+1}`,
      questions: Array.from({ length: 4 }).map((___, qidx) => ({
        id: `q-${sidx}-${qidx}`,
        type: faker.helpers.arrayElement(['single', 'multi', 'short', 'long', 'numeric']),
        label: `Q${sidx+1}.${qidx+1} sample question`,
        required: Math.random() < 0.6
      }))
    })),
    updatedAt: Date.now()
  }))
  await db.assessments.bulkAdd(assessments)
}
