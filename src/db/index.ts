// src/db/index.ts
import Dexie, { type Table } from 'dexie'

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
}

export interface Candidate {
  id: string
  name: string
  email: string
  jobId?: string | null
  stage: 'applied'|'screen'|'tech'|'offer'|'hired'|'rejected'
  createdAt: number
  updatedAt?: number
  notes?: string[]
}

export interface Assessment {
  jobId: string
  sections: any[]
  updatedAt?: number
}

export class TalentDB extends Dexie {
  jobs!: Table<Job, string>
  candidates!: Table<Candidate, string>
  assessments!: Table<Assessment, string>
  responses!: Table<any, string>
  timelines!: Table<any, string>

  constructor() {
    super('talentflow-db')
    console.log('[Dexie] Initializing DB talentflow-db')
    this.version(1).stores({
      jobs: 'id,slug,title,order,status',
      candidates: 'id,name,email,jobId,stage',
      assessments: 'jobId',
      responses: 'id,jobId,candidateId',
      timelines: 'candidateId'
    })
  }
}

export const db = new TalentDB()
