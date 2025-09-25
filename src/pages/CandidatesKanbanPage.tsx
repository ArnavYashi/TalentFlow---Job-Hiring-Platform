// src/pages/CandidatesKanbanPage.tsx
import React from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter, type DragEndEvent, type DragOverEvent, type DragStartEvent } from '@dnd-kit/core'
import { useSortable, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import { arrayMove } from '@dnd-kit/sortable'
import { useQueryClient } from '@tanstack/react-query'
import CandidateCard from '../components/CandidateCard'
import { useCandidates, useUpdateCandidateStage } from '../api/candidates'
import { useDroppable } from '@dnd-kit/core'


const STAGES = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'] as const
type Stage = (typeof STAGES)[number]

export default function CandidatesKanbanPage() {
    const { data, isLoading, error } = useCandidates({ pageSize: 1000 }) // load all for the board
    const updateStage = useUpdateCandidateStage()
    const queryClient = useQueryClient()

    // Build initial containers map: { applied: [ids], screen: [...] }
    const buildContainers = React.useCallback((items: any[] = []) => {
        const map = Object.fromEntries(STAGES.map(s => [s, [] as string[]])) as Record<Stage, string[]>
        items.forEach((c) => {
            const s = (c.stage || 'applied') as Stage
            if (!map[s]) map[s] = []
            map[s].push(c.id)
        })
        return map
    }, [])

    const [containers, setContainers] = React.useState<Record<Stage, string[]>>(() => buildContainers(data?.data ?? []))

    // sync when source data changes (but do not overwrite while dragging)
    React.useEffect(() => {
        if (data?.data) {
            setContainers(prev => {
                // If user isn't currently dragging we can sync
                return buildContainers(data.data)
            })
        }
    }, [data, buildContainers])

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

    // Track the original container when drag starts to avoid relying on mutated state
    const originContainerRef = React.useRef<Stage | undefined>(undefined)

    const handleDragStart = (event: DragStartEvent) => {
        const activeId = String(event.active.id)
        originContainerRef.current = findContainer(activeId)
    }

    // helper: find which container a given id belongs to (card id or container id)
    const findContainer = (id: string | undefined): Stage | undefined => {
        if (!id) return undefined
        // if id matches a stage directly, return it
        if ((STAGES as readonly string[]).includes(id)) return id as Stage
        // otherwise find which container list includes the id
        for (const s of STAGES) {
            if (containers[s].includes(id)) return s
        }
        return undefined
    }

    // when dragging over, update containers state live so UI reflects move
    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over) return
        const activeId = String(active.id)
        const overId = String(over.id)

        const activeContainer = findContainer(activeId)
        const overContainer = findContainer(overId) ?? (STAGES.includes(overId as Stage) ? (overId as Stage) : undefined)

        if (!activeContainer || !overContainer) return
        if (activeContainer === overContainer) return // same column -> SortableContext will handle order during onDragEnd

        setContainers(prev => {
            const newMap = { ...prev }
            // remove from active
            newMap[activeContainer] = newMap[activeContainer].filter(id => id !== activeId)

            // compute index to insert into overContainer
            const overList = newMap[overContainer]
            const overIndex = overList.indexOf(overId)
            if (overIndex === -1) {
                // if hovering over column empty space, push to end
                newMap[overContainer] = [...overList, activeId]
            } else {
                // insert before the item we're hovering over
                const newList = [...overList]
                newList.splice(overIndex, 0, activeId)
                newMap[overContainer] = newList
            }
            return newMap
        })
    }

    const handleDragEnd = async (event: DragEndEvent) => {
    console.log('[DragEnd] event fired', event);
        const { active, over } = event
        if (!over) {
            console.log('[DragEnd] Early return: over is null');
            return;
        }
        const activeId = String(active.id)
        const overId = String(over.id)

        // Use the origin container captured at drag start, since containers state may have been optimistically updated
        const from = originContainerRef.current ?? findContainer(activeId)
        const to =
            findContainer(overId) ??
            (STAGES.includes(overId as Stage) ? (overId as Stage) : undefined)
        if (!from || !to) {
            console.log('[DragEnd] Early return: from or to is null', { from, to });
            return;
        }

        // If same container => reorder within the same stage
        if (from === to) {
            console.log('[DragEnd] Early return: from === to', { from, to });
            setContainers(prev => {
                const newList = arrayMove(
                    prev[from],
                    prev[from].indexOf(activeId),
                    prev[from].indexOf(overId)
                )
                return { ...prev, [from]: newList }
            })
            originContainerRef.current = undefined
            return;
        }

        // moved between containers
        // containers already updated in handleDragOver optimistically
        try {
            console.log('[DragEnd] Calling updateStage.mutateAsync', { id: activeId, stage: to });
            // 🔥 Persist stage change to backend
            await updateStage.mutateAsync({ id: activeId, stage: to })

            // optionally refetch candidates to keep source of truth in sync
            queryClient.invalidateQueries({ queryKey: ['candidates'] })
        } catch (err) {
            console.error('Failed to persist stage change', err)
            // rollback
            queryClient.invalidateQueries({ queryKey: ['candidates'] })
        }
        originContainerRef.current = undefined
    }




    if (isLoading) return <div className="p-6">Loading Kanban...</div>
    if (error) return <div className="p-6 text-red-500">Error loading candidates</div>



    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Candidates Kanban</h1>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-6 gap-4">
                    {STAGES.map((stage) => (
                        <Column
                            key={stage}
                            stage={stage}
                            items={containers[stage]}
                            allCandidates={data?.data ?? []}
                        />
                    ))}
                </div>
            </DndContext>
        </div>
    )
}

/* Column component registers a droppable for the stage and wraps SortableContext */
function Column({ stage, items, allCandidates }: { stage: Stage; items: string[]; allCandidates: any[] }) {
    const { setNodeRef } = useDroppable({ id: stage })

    // map ids -> candidate objects (preserve original order)
    const candidates = items.map(id => allCandidates.find((c: any) => c.id === id)).filter(Boolean)

    return (
        <div ref={setNodeRef} id={stage} className=" p-3 rounded shadow min-h-[500px]">
            <h2 className="text-lg font-semibold mb-3 capitalize">{stage}</h2>
            <SortableContext items={items} strategy={rectSortingStrategy}>
                <div className="space-y-2">
                    {candidates.map((candidate: any) => (
                        <CandidateCard key={candidate.id} candidate={candidate} />
                    ))}
                </div>
            </SortableContext>
        </div>
    )
}
