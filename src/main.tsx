import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

async function prepare() {
  const enableMocks = import.meta.env.VITE_ENABLE_MSW === 'true'

  if (import.meta.env.DEV || enableMocks) {
    const { worker } = await import('./mocks/browser')
    await worker.start({
      serviceWorker: { url: '/mockServiceWorker.js' },
      onUnhandledRequest: 'bypass', // avoid noisy warnings for routes you don’t mock
      quiet: true,
    })
    const { seedIfEmpty, backfillJobLocationsIfMissing } = await import('./mocks/seed')
    await seedIfEmpty()
    await backfillJobLocationsIfMissing()
  }
}

prepare().then(() => {
  createRoot(document.getElementById('root')!).render(<App />)
})