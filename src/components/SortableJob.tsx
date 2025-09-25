
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import JobModal from './JobModal'
import type { Job } from '../api/jobs'
import { Link, useNavigate } from 'react-router-dom'


interface SortableJobProps {
  job: Job
  handleSaveJob: (data: Partial<Job> & { id?: string }) => Promise<void>
}

export  function SortableJob({ job, handleSaveJob }: SortableJobProps) {
    const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: job.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: isDragging ? '#0a0a0bff' : '', // light blue while dragging
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 flex justify-between items-center border-b rounded-md shadow-sm "
    >
      <div>
        <div className="font-medium">{job.title}</div>
        <div className="text-sm text-gray-500">{job.status}{job.location ? ` • ${job.location}` : ''}</div>
        <div className="text-xs text-gray-400">Slug: {job.slug}</div>
      </div>
      <div className="flex gap-2 items-center">
        <div className="text-sm text-gray-600">Tags: {(job.tags || []).join(', ')}</div>
        <button style={{backgroundColor: 'darkgreen'}}  onClick={() => navigate(`/jobs/${job.id}/assessment`)}>
  Assessment
</button>
    
        <JobModal job={job} onSave={handleSaveJob} />
        <button
          onClick={async () => {
            const newStatus = job.status === 'active' ? 'archived' : 'active'
            try {
              await handleSaveJob({ id: job.id, status: newStatus })
            } catch (err) {
              console.error('Failed to update status', err)
            }
          }}
          className={`px-3 py-1 rounded text-white ${
            job.status === 'active'
              ? 'bg-gray-500 hover:bg-gray-600'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {job.status === 'active' ? 'Archive' : 'Unarchive'}
        </button>
      </div>
    </li>
  )
}

