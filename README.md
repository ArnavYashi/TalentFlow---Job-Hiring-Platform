# TalentFlow – Hiring Platform

A lightweight hiring platform demonstrating a jobs board (search/filter/reorder) and a Kanban-style candidates board with drag-and-drop, powered by React + TypeScript + Vite, TanStack Query, dnd-kit, MSW, and Dexie (IndexedDB).

## Features
- Jobs list with search, status and location filters
- Drag-and-drop to reorder jobs, persists order
- Candidates Kanban with stages: applied, screen, tech, offer, hired, rejected
- Drag-and-drop candidates across stages with optimistic UI and server persistence
- Mock API via MSW with local persistence in IndexedDB (Dexie)

## Quick Start
```bash
npm install
npm run dev
```

Build and preview:
```bash
npm run build
npm run preview
```

## Scripts
- `dev`: start Vite dev server (starts MSW, seeds DB if empty)
- `build`: TypeScript build + Vite production build
- `preview`: preview the production build
- `lint`: run ESLint on .ts/.tsx files

## Development Notes
- In development, MSW starts automatically and the app seeds initial jobs/candidates. It also backfills missing job `location` fields.
- If filters show no data after changes, clear site data in your browser (DevTools → Application → Storage → Clear site data) and hard refresh.

## Documentation
See `documentation.md` for detailed project structure, data flow, and implementation notes.

## License
MIT. See `LICENSE.unknown`.
