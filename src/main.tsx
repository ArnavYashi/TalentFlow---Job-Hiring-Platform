// src/main.tsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

async function prepare() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
    const { seedIfEmpty } = await import('./mocks/seed')
    await seedIfEmpty()
  }
}

prepare().then(() => {
  createRoot(document.getElementById('root')!).render(<App />)
})
