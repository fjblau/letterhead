# Auto

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

## Agent Instructions
Follow this implementation plan to build the typewriter letterhead admin features.

### [x] Step 1: Develop admin login page and authentication
- Create `/admin/login` page with tailwind styling, validation, and login form integration
- Build error handling and redirection flows

### [x] Step 2: Develop dashboard page showing curation metrics
- Create `/admin/dashboard` showing total letterheads (published vs. drafts)
- Calculate total files and aggregate storage usage in Vercel Blob
- Implement quick actions and recent activities listing

### [x] Step 3: Develop API routes for metadata, bulk actions, and ephemera
- Build `PATCH /api/admin/ephemera/reorder` to update sort_order for attachments
- Build `DELETE /api/admin/ephemera/delete` to delete ephemera attachment and its files in Blob
- Build `PUT` or `PATCH` to update letterhead details
- Build bulk actions endpoints: bulk tag, publish, unpublish, delete, and thumbnail regeneration

### [x] Step 4: Develop admin items page with listing, search, and bulk actions
- Create `/admin/items` listing all letterheads
- Integrate search, status filters (Draft/Published), and checkbox-based bulk actions

### [x] Step 5: Develop admin new item page with multi-step PDF upload and form
- Create `/admin/items/new` multi-step form
- Handle dropping a PDF, calling PDF processing pipeline, pre-filling page count, auto-generating slug, and presenting metadata form

### [x] Step 6: Develop admin edit item page with React Hook Form, Zod validation, and Ephemera management
- Create `/admin/items/[id]/edit` form with React Hook Form + Zod validation
- Add ephemera upload section (images, PDFs, audio)
- Add listing of existing ephemera with inline inputs for role, caption, description, and drag-to-reorder support
- Implement single item delete trigger with cascading DB + Blob cleanup

### [x] Step 7: Verification, linting, and build validation
- Run typecheck and linting commands
- Run build to make sure everything compiles without any errors
