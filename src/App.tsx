// src/App.tsx
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import JobsPage from './pages/JobsPage'
import CandidatesPage from './pages/CandidatesPage'
import AssessmentsPage from './pages/AssessmentsPage'
import CandidateProfile from './pages/CandidateProfile'
import HomePage from './pages/HomePage'
import Navbar from './components/Navbar'

const queryClient = new QueryClient()

export default function App() {
  return (
    <>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
      <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/candidates/:id" element={<CandidateProfile />} />
          <Route path="/jobs/*" element={<JobsPage />} />
          <Route path="/candidates/*" element={<CandidatesPage />} />
          <Route path="/assessments/*" element={<AssessmentsPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
    </>
  )
}
