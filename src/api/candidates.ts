import { useQuery } from '@tanstack/react-query'

interface Candidate {
  id: string
  name: string
  email: string
  stage: string
  createdAt: number
  updatedAt?: number
}

export const useCandidates = ({
  search = '',
  stage = '',
  page = 1,
  pageSize = 50,
}: {
  search?: string
  stage?: string
  page?: number
  pageSize?: number
}) => {
  return useQuery({
    queryKey: ['candidates', search, stage, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        search,
        stage,
        page: page.toString(),
        pageSize: pageSize.toString(),
      })
      const res = await fetch(`/candidates?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch candidates')
      return res.json() as Promise<{ data: Candidate[]; total: number }>
    },
    placeholderData: { data: [], total: 0 }, // shows empty list while loading
  })
}