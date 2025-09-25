// src/main.tsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

async function prepare() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    await worker.start()
    const { seedIfEmpty, backfillJobLocationsIfMissing } = await import('./mocks/seed')
    await seedIfEmpty()
    await backfillJobLocationsIfMissing()
  }
}

prepare().then(() => {
  createRoot(document.getElementById('root')!).render(<App />)
})
