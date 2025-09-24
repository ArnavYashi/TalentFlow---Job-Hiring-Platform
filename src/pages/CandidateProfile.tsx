import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'


interface Candidate {
  id: string
  name: string
  email: string
  stage: string
  createdAt: number
  updatedAt?: number
}

interface TimelineItem {
  stage: string
  date: number
}

export default function CandidateProfile() {
  const { id } = useParams<{ id: string }>()

  // Fetch candidate details
  const { data: candidateData, isLoading: loadingCandidate, error: errorCandidate } = useQuery({
    queryKey: ['candidate', id],
    queryFn: async () => {
      const res = await fetch(`/candidates/${id}`)
      if (!res.ok) throw new Error('Failed to fetch candidate')
      return res.json() as Promise<Candidate>
    },
    enabled: !!id
  })

  // Fetch timeline
  const { data: timelineData, isLoading: loadingTimeline, error: errorTimeline } = useQuery({
    queryKey: ['candidateTimeline', id],
    queryFn: async () => {
      const res = await fetch(`/candidates/${id}/timeline`)
      if (!res.ok) throw new Error('Failed to fetch timeline')
      return res.json() as Promise<{ timeline: TimelineItem[] }>
    },
    enabled: !!id
  })

  if (loadingCandidate || loadingTimeline) return <div>Loading...</div>
  if (errorCandidate || errorTimeline) return <div className="text-red-500">Error loading candidate</div>
  if (!candidateData || !timelineData) return <div>No data found</div>

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">{candidateData.name}</h1>
      <div className="text-sm text-gray-500">{candidateData.email}</div>
      <div className="text-sm text-gray-600">Current Stage: {candidateData.stage}</div>

      <h2 className="text-xl font-semibold mt-6">Timeline</h2>
      <ul className="border rounded divide-y">
        {timelineData.timeline.map((item, index) => (
          <li key={index} className="p-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100">
            <div>{item.stage}</div>
            <div className="text-xs text-gray-400">{new Date(item.date).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
