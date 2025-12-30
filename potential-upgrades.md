# Potential Upgrades: Sales Proposal Architect

## Current State

- Pure client-side React app
- Data exists only in memory during session
- Images generated fresh each time via Gemini
- No persistence between sessions

## Proposed Enhancements

### 1. Backend API

The app is currently frontend-only. A server would:

- Handle file uploads
- Persist business data from CSV imports
- Manage the media library
- Proxy Gemini API calls (keep API key server-side)

### 2. Database (Railway Postgres)

**Tables:**

- `businesses` - parsed from CSV uploads
- `spending_records` - individual line items linked to businesses
- `media_library` - stored images with tags/descriptions for reuse
- `proposals` - save generated proposals for history/editing

### 3. Media Storage

**Options:**

| Provider | Pros | Cons |
|----------|------|------|
| Railway Volume | Simple, integrated | Limited storage, no CDN |
| Cloudflare R2 | S3-compatible, generous free tier, fast | Separate service |
| Cloudinary | Built-in transformations, CDN | Can get expensive |

### 4. Image Library Integration

Instead of generating images fresh each time, Gemini could:

- Search your library by description/tags
- Fall back to generation only when no match exists
- Save generated images to library for reuse
- Reduce API costs and improve consistency

## Key Decisions

| Decision | Options |
|----------|---------|
| Backend framework | Express, Hono, Next.js API routes |
| Media storage | R2, Cloudinary, Railway volume |
| Auth model | Single-tenant vs multi-user accounts |
| Image matching | Semantic search (embeddings) vs simple tag matching |

## Implementation Phases

### Phase 1: Backend + Database

- Set up Express/Hono API on Railway
- Add PostgreSQL database
- Create endpoints for business CRUD
- Migrate CSV parsing to server-side
- Persist uploaded business data

### Phase 2: Media Library

- Choose and configure storage provider
- Create media upload/management endpoints
- Build simple media browser UI
- Tag images on upload

### Phase 3: Smart Image Selection

- Implement image search by description
- Modify proposal generation to check library first
- Auto-save generated images to library
- Add image tagging from Gemini descriptions

### Phase 4: Proposal History

- Save generated proposals to database
- Add proposal list/history view
- Enable editing saved proposals
- Export options (PDF, share link)
