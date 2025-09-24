// src/pages/JobsPage.tsx
import React, { useState } from 'react'
import { useJobs, createJob, updateJob, type Job } from '../api/jobs'
import JobModal from '../components/JobModal.tsx'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SortableJob } from '../components/SortableJob.tsx'


export default function JobsPage() {
    const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 5 } })

)
const handleDragEnd = async (event: any) => {
  const { active, over } = event
  if (!over || active.id === over.id) return

  const oldIndex = data!.data.findIndex((j) => j.id === active.id)
  const newIndex = data!.data.findIndex((j) => j.id === over.id)
  const newJobs = arrayMove([...data!.data], oldIndex, newIndex)

  // Optimistic update
  refetch()

  try {
    // Update order in DB
    for (let i = 0; i < newJobs.length; i++) {
      await handleSaveJob({ id: newJobs[i].id, order: i + 1 })
    }
  } catch (err) {
    console.error('Reorder failed', err)
    refetch() // rollback
  }
}

    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [page, setPage] = useState(1)
    const pageSize = 5

    const { data, isLoading, error, refetch } = useJobs({ search, status, page, pageSize })

    async function handleSaveJob(jobData: Partial<Job> & { id?: string }) {
        if (jobData.id) {
            await updateJob(jobData.id, jobData)
        } else {
            await createJob(jobData)
        }
        await refetch()
    }

    return (
        <div className="w-full min-h-screen p-6  space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Jobs Board</h1>
                <JobModal onSave={handleSaveJob} />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                        setPage(1)
                        setSearch(e.target.value)
                    }}
                    placeholder="Search jobs..."
                    className="border p-2 rounded w-64"
                />
                <select
                    value={status}
                    onChange={(e) => {
                        setPage(1)
                        setStatus(e.target.value)
                    }}
                    className="border p-2 rounded"
                >
                    <option value="">All</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                </select>
            </div>

            {/* Jobs list */}
            {isLoading && <div>Loading...</div>}
            {error && <div className="text-red-500">Error loading jobs</div>}
            {data && (
                <>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={data!.data.map(j => j.id)} strategy={verticalListSortingStrategy}>
                    <ul className="divide-y border rounded">
                        {data.data.map((job: Job) => (
                            <SortableJob key={job.id} job={job} handleSaveJob={handleSaveJob} />
                        ))}
                    </ul>
                    </SortableContext>
</DndContext>
                    {/* Pagination */}
                    <div className="flex gap-2 mt-4">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage((p) => p - 1)}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <span>Page {page}</span>
                        <button
                            disabled={page * pageSize >= data.total}
                            onClick={() => setPage((p) => p + 1)}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
