import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Candidate {
  id: string
  name: string
  email: string
  stage: string
  createdAt: number
  updatedAt?: number
}

// 🔹 Fetch candidates
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

// 🔹 Update candidate stage (used in Kanban drag-and-drop)
export const useUpdateCandidateStage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      console.log('[MutationFn] PATCH /candidates/' + id, { stage });
      const res = await fetch(`/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      })
      if (!res.ok) throw new Error('Failed to update stage')
      return res.json() as Promise<Candidate>
    },
    // 🔹 Optimistically update UI
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: ['candidates'] })

      const prev = queryClient.getQueryData<any>(['candidates'])

      queryClient.setQueryData(['candidates'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((c: Candidate) =>
            c.id === id ? { ...c, stage } : c
          ),
        }
      })

      return { prev }
    },
    // // 🔹 Rollback if error
    // onError: (_err, _vars, ctx) => {
    //   if (ctx?.prev) {
    //     queryClient.setQueryData(['candidates'], ctx.prev)
    //   }
    // },
    // // 🔹 Refetch after success
    // onSettled: () => {
    //   queryClient.invalidateQueries({ queryKey: ['candidates'] })
    // },
  })
}
