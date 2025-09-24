import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to TalentFlow</h1>
        <p className="text-lg md:text-xl max-w-xl">
          TalentFlow is a mini hiring platform that helps HR teams manage jobs, candidates, 
          and assessments efficiently. Streamline your hiring process and keep everything in one place.
        </p>
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => navigate('/jobs')}
            className="px-6 py-3 bg-white text-blue-600 font-semibold rounded shadow hover:bg-gray-100 transition"
          >
            Explore Jobs
          </button>
          <button
            onClick={() => navigate('/candidates')}
            className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded shadow hover:bg-gray-100 transition"
          >
            View Candidates
          </button>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 px-6 md:px-20 bg-gray-50 flex flex-col md:flex-row gap-12">
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-4">Manage Jobs</h2>
          <p className="text-gray-700">
            Create, edit, and organize your job listings with ease. Archive old positions, 
            reorder active jobs, and keep your job board up-to-date.
          </p>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-4">Track Candidates</h2>
          <p className="text-gray-700">
            View all applicants, monitor their progress through different stages, 
            and make informed hiring decisions with the candidate timeline and Kanban board.
          </p>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-4">Assessments</h2>
          <p className="text-gray-700">
            Create job-specific quizzes or forms, preview them live, and review candidate responses. 
            All data is stored locally for fast and offline-ready access.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center py-6">
        <p>© {new Date().getFullYear()} TalentFlow. All rights reserved.</p>
      </footer>
    </div>
  )
}
