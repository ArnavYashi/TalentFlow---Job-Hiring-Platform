## TalentFlow – Hiring Platform (Documentation)

### Overview
TalentFlow is a lightweight hiring platform built with React + TypeScript and Vite. It showcases a jobs board with filtering and reordering, a Kanban-style candidates board with drag-and-drop between stages, mock APIs powered by MSW, and a local persistent store using Dexie (IndexedDB).

### Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **State/Data**: TanStack Query (react-query)
- **Drag & Drop**: dnd-kit (core/sortable)
- **Mock API**: MSW (Mock Service Worker)
- **Local DB**: Dexie (IndexedDB)
- **Routing**: React Router DOM

### Getting Started
1) Install dependencies
```bash
npm install
```

2) Run the dev server
```bash
npm run dev
```

3) Build for production
```bash
npm run build
```

4) Preview the production build
```bash
npm run preview
```

### Project Structure (key files)
- `src/main.tsx`: App entry. Starts MSW in dev and runs DB seed/backfill, then renders `App`.
- `src/App.tsx`: App shell and routes.
- `src/pages/JobsPage.tsx`: Jobs list page with search, status, location filters and drag-to-reorder.
- `src/pages/CandidatesKanbanPage.tsx`: Kanban board for candidates with drag across stages.
- `src/components/SortableJob.tsx`: Sortable list item for a job.
- `src/components/CandidateCard.tsx`: Candidate card used inside Kanban columns.
- `src/api/jobs.ts`: Jobs API hooks and helpers (fetch, create, update).
- `src/api/candidates.ts`: Candidates API hooks and mutation to update stage.
- `src/mocks/handlers.ts`: MSW request handlers (jobs, candidates, assessments).
- `src/mocks/seed.ts`: DB seeding for jobs/candidates and backfill for job locations.
- `src/db/index.ts`: Dexie DB schema and types.

### Data Models (simplified)
- `Job` (Dexie): `{ id, title, slug, status, tags, order, createdAt, updatedAt?, location? }`
- `Candidate` (Dexie): `{ id, name, email, jobId?, stage, createdAt, updatedAt?, notes? }`

### Mock API and Persistence
- MSW intercepts requests in development from `src/mocks/handlers.ts`.
- Data is persisted in the browser via Dexie/IndexedDB (`src/db/index.ts`).
- On startup (dev), `src/main.tsx` runs:
  - `worker.start()` (MSW)
  - `seedIfEmpty()` to add initial jobs/candidates/assessments
  - `backfillJobLocationsIfMissing()` to set `location` on any existing jobs that don’t have it

### Jobs Page
- File: `src/pages/JobsPage.tsx`
- Features:
  - Search by text (matches title and tags)
  - Filter by `status` (active/archived)
  - Filter by `location` (case-insensitive substring)
  - Drag-and-drop to reorder jobs; order is persisted via `updateJob`
- API hook: `useJobs({ search, status, location, page, pageSize })` builds a query string and fetches `/jobs`.
- Mock handler: `GET /jobs` filters by `search`, `status`, and `location`, then sorts by `order` and paginates.
- Display: Each item uses `SortableJob` and shows title, status, optional location, slug, and actions (archive/unarchive, modal edit, assessment link).

### Candidates Kanban
- File: `src/pages/CandidatesKanbanPage.tsx`
- Columns (stages): `applied`, `screen`, `tech`, `offer`, `hired`, `rejected`.
- Drag-and-drop:
  - `handleDragStart` captures the origin column in a ref.
  - `handleDragOver` optimistically updates UI when hovering over a different column.
  - `handleDragEnd` uses the captured origin and the target to persist stage changes with `useUpdateCandidateStage`.
- Candidate UI: `CandidateCard` shows name, email, stage chip, created/updated dates, and a dedicated drag handle. Buttons were intentionally removed on request.

### Components
- `SortableJob` (`src/components/SortableJob.tsx`):
  - Integrates with dnd-kit `useSortable` to drag a job within the list.
  - Applies transform/transition styles during drag and highlights the item.
  - Exposes actions to edit (modal) and toggle active/archive.

- `CandidateCard` (`src/components/CandidateCard.tsx`):
  - Integrates with dnd-kit `useSortable`.
  - Displays key candidate info and stage status chip.
  - Drag handle area preserves clickability for future buttons.

### API Hooks
- `useJobs` (`src/api/jobs.ts`):
  - React Query hook which caches results by `['jobs', search, status, location, page, pageSize]`.
  - Uses `fetch('/jobs?…')` via MSW; returns `{ data, total }`.
  - Helpers: `createJob`, `updateJob`.

- `useCandidates` (`src/api/candidates.ts`):
  - React Query hook which caches by `['candidates', search, stage, page]`.
  - Uses `fetch('/candidates?…')` via MSW; returns `{ data, total }`.
  - Mutation: `useUpdateCandidateStage` for PATCH `/candidates/:id`.

### Styling
- Tailwind CSS is configured via `tailwind.config.js` and `postcss.config.cjs`.
- Global styles live in `src/index.css` and `src/App.css`.

### Development Tips
- If filters return no data after updating handlers or seed logic, your IndexedDB may contain stale records. Clear site data in your browser devtools (Application → Storage → Clear site data) and refresh.
- Use a hard refresh (Ctrl+Shift+R) to ensure MSW and seeding changes apply.
- MSW runs only in development (`import.meta.env.DEV`). For production, swap the mock layer with a real backend.

### Known Limitations / Next Steps
- Jobs and candidates are persisted only locally (IndexedDB) in dev.
- Candidate profile page and notes UI are stubs/not wired.
- No authentication/authorization.
- Accessibility can be further improved for drag-and-drop (keyboard, ARIA live regions).

### Scripts (from `package.json`)
- `dev`: start Vite dev server with MSW + seeding
- `build`: TypeScript build + Vite production build
- `preview`: preview production build
- `lint`: run ESLint on `.ts/.tsx`

### License
Licensed under the MIT License. See `LICENSE.unknown` for full text.



