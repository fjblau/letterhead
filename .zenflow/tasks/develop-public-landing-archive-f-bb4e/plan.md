# Auto

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

## Implementation Plan

### [x] Step 1: Design Vintage Theme, Public Header, Footer, and Landing Page
- Build general vintage-themed public components (Header, Footer, navigation, typography, parchment colors).
- Implement `/` landing page with hero, responsive intro text, and grid of 12 most recently added/published letterheads.

### [x] Step 2: Implement `/api/facets` API Endpoint
- Create `/api/facets` endpoint fetching faceted categories and counts (Company, Era, Country, Document Type, Tags) of published letterheads.

### [x] Step 3: Implement `/api/archive` API Endpoint with Search, Filter & Sort
- Create `/api/archive` endpoint that handles full-text search, filters (by Company, Era, Country, Document Type, Tags), and sorting.
- Implement full-text search in Postgres.

### [x] Step 4: Build Main Archive Gallery Page (`/archive`)
- Build `/archive` gallery layout with faceted sidebar.
- Implement card component with styled paper frame, thumbnail image, company name, location/dating, document type tag, and indicators of associated ephemera.
- Synchronize all search, filters, and sort options with URL query parameters.

### [x] Step 5: Build Pre-filtered Views (`/archive/company/[company]` and `/archive/era/[era]`) and `/about` Page
- Create `/archive/company/[company]` and `/archive/era/[era]` dynamically pre-filtering by company/era.
- Create `/about` page detailing the collection, curator, and technical background.
- Verify everything with build, lint, and typecheck commands.
