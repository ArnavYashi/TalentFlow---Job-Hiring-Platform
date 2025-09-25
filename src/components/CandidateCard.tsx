// src/components/CandidateCard.tsx
import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'


export default function CandidateCard({ candidate }: { candidate: any /* Candidate */ }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: candidate.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : 'auto',
    boxShadow: isDragging ? '0 6px 20px rgba(0,0,0,0.15)' : undefined,
  }

  const created = candidate.createdAt ? new Date(candidate.createdAt) : null
  const updated = candidate.updatedAt ? new Date(candidate.updatedAt) : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-3 rounded shadow border  transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium truncate">{candidate.name}</div>
          <div className="text-sm text-gray-600 truncate">{candidate.email}</div>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-700 capitalize">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {candidate.stage}
            </span>
            {created && <span title={created.toLocaleString()}>Created {created.toLocaleDateString()}</span>}
            {updated && <span title={updated.toLocaleString()}>• Updated {updated.toLocaleDateString()}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div
            className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500 cursor-grab"
            {...attributes}
            {...listeners}
            aria-label="Drag handle"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 4H8V6H10V4ZM16 4H14V6H16V4ZM10 10H8V12H10V10ZM16 10H14V12H16V10ZM10 16H8V18H10V16ZM16 16H14V18H16V16Z" fill="currentColor"/>
            </svg>
            Drag
          </div>
        </div>
      </div>
    </div>
  )
}
