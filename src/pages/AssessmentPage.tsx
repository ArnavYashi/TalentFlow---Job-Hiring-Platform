import { db } from '../db'
// src/pages/AssessmentPage.tsx
import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

interface Question {
    id: string
    type: 'single' | 'multi' | 'shortText' | 'longText' | 'numeric' | 'file'
    question: string
    options?: string[]
    required?: boolean
    min?: number
    max?: number
    maxLength?: number
}

interface Section {
    id: string
    title: string
    questions: Question[]
}

export default function AssessmentPage() {
    const { jobId } = useParams<{ jobId: string }>()
    const [activeTab, setActiveTab] = useState<'build' | 'take'>('build')
    const [sections, setSections] = useState<Section[]>([])
    const [responses, setResponses] = useState<{ [qId: string]: any }>({})
    const [errors, setErrors] = useState<{ [qId: string]: string }>({})

    const { data: jobData, isLoading: loadingJob } = useQuery({
        queryKey: ['job', jobId],
        queryFn: async () => {
            const res = await fetch(`/jobs/${jobId}`)
            if (!res.ok) throw new Error('Failed to fetch job')
            return res.json() as Promise<{ id: string, title: string, tags: string[] }>
        },
        enabled: !!jobId,
    })


    // Load saved assessment from Dexie
    useEffect(() => {
        async function loadAssessment() {
            if (!jobId) return
            const saved = await db.assessments.get(jobId)
            if (saved && saved.sections) setSections(saved.sections)
        }
        loadAssessment()
    }, [jobId])

    const saveAssessment = async () => {
        if (!jobId) {
            alert('Job ID is missing. Cannot save assessment.')
            return
        }
        await db.assessments.put({ jobId, sections })
        alert('Assessment saved!')
    }

    const handleSubmit = async () => {
        const newErrors: { [qId: string]: string } = {}

        // Validate all questions
        sections.forEach(section => {
            section.questions.forEach(q => {
                const value = responses[q.id]

                // Required field validation
                if (q.required) {
                    if (q.type === 'multi') {
                        if (!value || !Array.isArray(value) || value.length === 0) {
                            newErrors[q.id] = 'Please select at least one option.'
                        }
                    } else if (!value) {
                        newErrors[q.id] = 'This field is required.'
                    }
                }

                // Numeric validation
                if (q.type === 'numeric' && value !== undefined && value !== '') {
                    const num = Number(value)
                    if (q.min !== undefined && num < q.min) newErrors[q.id] = `Minimum value is ${q.min}.`
                    if (q.max !== undefined && num > q.max) newErrors[q.id] = `Maximum value is ${q.max}.`
                }

                // Text maxLength validation
                if ((q.type === 'shortText' || q.type === 'longText') && q.maxLength) {
                    if (value && value.length > q.maxLength) {
                        newErrors[q.id] = `Maximum length is ${q.maxLength} characters.`
                    }
                }
            })
        })

        setErrors(newErrors)

        if (Object.keys(newErrors).length === 0) {
            try {
                // Save responses to Dexie
                if (!jobId) return;
                await db.responses.put({
                    id: jobId,
                    jobId,
                    responses
                })
                alert('Assessment submitted successfully!')
                setResponses({})
            } catch (err) {
                console.error(err)
                alert('Error submitting assessment. Please try again.')
            }
        } else {
            alert('Please fix validation errors before submitting.')
        }
    }


    return (
        <div className="p-6 space-y-6">
            <div className="text-white text-2xl mb-4">
                Assessment for : 
                <span className="font-medium"> {jobData?.title}</span>
                <br></br>
                {Array.isArray(jobData?.tags) && jobData.tags.length > 0 && (
                    <span className="ml-2 text-sm text-white-500">
                        Tags: {jobData.tags.join(', ')}
                    </span>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mt-4">
                <button
                    className={`px-4 py-2 rounded ${activeTab === 'build' ? 'bg-indigo-600 text-white' : 'bg-black-200'}`}
                    onClick={() => setActiveTab('build')}
                >
                    Build Assessment
                </button>
                <button
                    className={`px-4 py-2 rounded ${activeTab === 'take' ? 'bg-green-600 text-white' : 'bg-black-200'}`}
                    onClick={() => setActiveTab('take')}
                >
                    Take Assessment
                </button>
            </div>

            {activeTab === 'build' && (
                <div className="space-y-4 mt-4">
                    {/* Existing Build UI */}
                    {sections.map((section, sIdx) => (
                        <div key={section.id} className="border p-4 rounded ">
                            <input
                                type="text"
                                value={section.title}
                                onChange={(e) => {
                                    const updated = [...sections]
                                    updated[sIdx].title = e.target.value
                                    setSections(updated)
                                }}
                                placeholder={`Section ${sIdx + 1} Title`}
                                className="border p-2 w-full rounded mb-2"
                            />

                            {section.questions.map((q, qIdx) => (
                                <div key={q.id} className="border p-2 rounded  mb-2">
                                    <input
                                        type="text"
                                        value={q.question}
                                        onChange={(e) => {
                                            const updated = [...sections]
                                            updated[sIdx].questions[qIdx].question = e.target.value
                                            setSections(updated)
                                        }}
                                        placeholder="Question text"
                                        className="border p-1 w-full rounded mb-1"
                                    />
                                    <select
                                        value={q.type}
                                        onChange={(e) => {
                                            const updated = [...sections]
                                            updated[sIdx].questions[qIdx].type = e.target.value as Question['type']
                                            if (['single', 'multi'].includes(e.target.value)) updated[sIdx].questions[qIdx].options = ['']
                                            else updated[sIdx].questions[qIdx].options = undefined
                                            setSections(updated)
                                        }}
                                        className="border p-1 rounded mb-2"
                                        style={{marginRight: '10px'}}
                                    >
                                        <option value="single">Single Choice</option>
                                        <option value="multi">Multiple Choice</option>
                                        <option value="shortText">Short Text</option>
                                        <option value="longText">Long Text</option>
                                        <option value="numeric">Numeric</option>
                                        <option value="file">File Upload</option>
                                    </select>
                                    <button
      className="px-2 py-1 bg-red-600 text-white rounded mt-1"
      type="button"
      onClick={() => {
        const updated = [...sections]
        updated[sIdx].questions.splice(qIdx, 1)
        setSections(updated)
      }}
    >
      Delete
    </button>
                                    {/* Options */}
                                    {['single', 'multi'].includes(q.type) && q.options && (
                                        <div className="ml-4 space-y-1">
                                            {q.options.map((opt, oIdx) => (
                                                <input
                                                    key={oIdx}
                                                    type="text"
                                                    value={opt}
                                                    onChange={(e) => {
                                                        const updated = [...sections]
                                                        updated[sIdx].questions[qIdx].options![oIdx] = e.target.value
                                                        setSections(updated)
                                                    }}
                                                    placeholder={`Option ${oIdx + 1}`}
                                                    className="border p-1 w-full rounded"
                                                />
                                            ))}
                                            <button
                                                className="px-2 py-1 bg-green-600 text-white rounded mt-1"
                                                style={{marginRight: '10px'}}
                                                type="button"
                                                onClick={() => {
                                                    const updated = [...sections]
                                                    updated[sIdx].questions[qIdx].options!.push('')
                                                    setSections(updated)
                                                }}
                                            >
                                                Add Option
                                            </button>
                                            
                                             
                                        </div>
                                    )}

                                </div>
                            ))}

                            <button
                                className="px-2 py-1 bg-blue-600 text-white rounded"
                                onClick={() => {
                                    const updated = [...sections]
                                    updated[sIdx].questions.push({ id: Date.now().toString(), type: 'shortText', question: '' })
                                    setSections(updated)
                                }}
                            >
                                Add Question
                            </button>
                           
                        </div>
                    ))}

                    <button
                        className="px-3 py-2 bg-indigo-600 text-white rounded mt-4"
                        style={{marginRight: '0px'}}
                        onClick={() => setSections([...sections, { id: Date.now().toString(), title: '', questions: [] }])}
                    >
                        Add Section
                    </button>
                    
                    <button
                        className="px-3 py-2 bg-green-600 text-white rounded mt-4"
                        onClick={saveAssessment}
                    >
                        Save Assessment
                    </button>
                </div>
            )}

            {activeTab === 'take' && (
                <div className="space-y-4 mt-4">
                    {sections.length === 0 ? (
                        <div className="text-gray-500">No assessment available for this job.</div>
                    ) : (
                        sections.map((section) => (
                            <div key={section.id} className="border p-4 rounded">
                                <h3 className="font-medium mb-2">{section.title}</h3>
                                {section.questions.map((q) => (
                                    <div key={q.id} className="mb-2">
                                        <div className="mb-1 font-sm">{q.question}{q.required && '*'}</div>
                                        {q.type === 'shortText' && (
                                            <>
                                                <input
                                                    type="text"
                                                    value={responses[q.id] || ''}
                                                    onChange={(e) => setResponses({ ...responses, [q.id]: e.target.value })}
                                                    className="border p-1 rounded w-full"
                                                />
                                                {errors[q.id] && <div className="text-red-500 text-xs">{errors[q.id]}</div>}
                                            </>
                                        )}
                                        {q.type === 'longText' && (
                                            <>
                                                <textarea
                                                    value={responses[q.id] || ''}
                                                    onChange={(e) => setResponses({ ...responses, [q.id]: e.target.value })}
                                                    className="border p-1 rounded w-full"
                                                />
                                                {errors[q.id] && <div className="text-red-500 text-xs">{errors[q.id]}</div>}
                                            </>
                                        )}
                                        {q.type === 'numeric' && (
                                            <>
                                                <input
                                                    type="number"
                                                    value={responses[q.id] || ''}
                                                    onChange={(e) => setResponses({ ...responses, [q.id]: e.target.value })}
                                                    className="border p-1 rounded w-full"
                                                    min={q.min}
                                                    max={q.max}
                                                />
                                                {errors[q.id] && <div className="text-red-500 text-xs">{errors[q.id]}</div>}
                                            </>
                                        )}
                                        {['single', 'multi'].includes(q.type) && q.options && (
                                            <div className="space-y-1 ml-2">
                                                {q.options.map((opt, idx) => (
                                                    <label key={idx} className="block">
                                                        <input
                                                            type={q.type === 'single' ? 'radio' : 'checkbox'}
                                                            name={q.id}
                                                            value={opt}
                                                            checked={
                                                                q.type === 'single'
                                                                    ? responses[q.id] === opt
                                                                    : (responses[q.id] || []).includes(opt)
                                                            }
                                                            onChange={(e) => {
                                                                const value = e.target.value
                                                                if (q.type === 'single') setResponses({ ...responses, [q.id]: value })
                                                                else {
                                                                    const arr = responses[q.id] || []
                                                                    if (e.target.checked) setResponses({ ...responses, [q.id]: [...arr, value] })
                                                                    else setResponses({ ...responses, [q.id]: arr.filter((v: string) => v !== value) })
                                                                }
                                                            }}
                                                        />{' '}
                                                        {opt}
                                                    </label>
                                                ))}
                                                {errors[q.id] && <div className="text-red-500 text-xs">{errors[q.id]}</div>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))
                    )}

                    {sections.length > 0 && (
                        <button
                            className="px-3 py-2 bg-green-600 text-white rounded mt-4"
                            onClick={handleSubmit}
                        >
                            Submit Assessment
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
