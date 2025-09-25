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
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3  rounded shadow border hover:bg-white-50 cursor-grab"
    >
      <div className="font-medium">{candidate.name}</div>
      <div className="text-sm text-gray-500">{candidate.email}</div>
    </div>
  )
}
