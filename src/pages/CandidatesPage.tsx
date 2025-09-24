import React, { useState, useRef } from 'react'
import { useCandidates } from '../api/candidates' // create this hook similar to useJobs
import { useVirtualizer } from '@tanstack/react-virtual'
import { useNavigate } from 'react-router-dom'


export default function CandidatesPage() {
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [stage, setStage] = useState('')
    const [page, setPage] = useState(1)
    const pageSize = 50 // load in chunks, virtualization handles scrolling

    const { data, isLoading, error } = useCandidates({ search, stage, page, pageSize })
    const parentRef = useRef<HTMLDivElement>(null)
    const rowVirtualizer = useVirtualizer({
        count: data?.data.length ?? 0,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 60, // height of each row in px
        overscan: 5,            // render a few extra rows outside view for smooth scroll
    })
    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold">Candidates</h1>

            {/* Filters */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                        setPage(1)
                        setSearch(e.target.value)
                    }}
                    placeholder="Search by name/email..."
                    className="border p-2 rounded w-64"
                />
                <select
                    value={stage}
                    onChange={(e) => {
                        setPage(1)
                        setStage(e.target.value)
                    }}
                    className="border p-2 rounded"
                >
                    <option value="">All Stages</option>
                    <option value="applied">Applied</option>
                    <option value="screen">Screen</option>
                    <option value="tech">Tech</option>
                    <option value="offer">Offer</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {/* Virtualized list */}
            <div
                ref={parentRef}
                className="h-[600px] overflow-auto border rounded"
            >
                <div
                    style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const candidate = data?.data[virtualRow.index]
                        if (!candidate) return null

                        return (
                            <div
                                key={candidate.id}
                                ref={rowVirtualizer.measureElement} // essential for virtualization
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                                className="p-3 border-b flex justify-between items-center"
                            >
                                <div>
                                    {/* Clickable name */}
                                    <div
                                        className="font-medium text-blue-600 cursor-pointer hover:underline"
                                        onClick={() => navigate(`/candidates/${candidate.id}`)}
                                    >
                                        {candidate.name}
                                    </div>
                                    <div className="text-sm text-white-500">{candidate.email}</div>
                                </div>
                                <div className="text-sm text-white-600">{candidate.stage}</div>
                            </div>
                        )
                    })}

                </div>
            </div>
        </div>
    )
}
