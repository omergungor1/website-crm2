# MEDIA STUDIO — FULL-STACK FEATURE DEVELOPMENT MASTER PROMPT

- ekleyeceğin tarayıcı eklentisini de bu proje içine eklemelisin. Uygun bir klasör altına ekleyebilirsin. Admin panel içine eklenti klasörünü indiren bir indirme butonu da ekleyebilirsin. zipli veya klasör şekline unpacked tarayıcı eklentisini indirebileyim. 

## ROLE AND MISSION

You are a Principal Full-Stack Software Architect, Senior Next.js Engineer, Supabase/PostgreSQL Specialist, AI Prompt Engineer, Chrome Extension Engineer, and Senior Product Designer.

Your mission is to implement a production-ready feature called **Media Studio** inside an existing multi-project SaaS administration platform.

Media Studio is a centralized, project-aware, AI-powered social media prompt planning and management system.

The application already contains:
- A Next.js project
- Existing project management
- Project names and descriptions
- Optional project logos
- Project detail pages and sidebar navigation
- An existing OpenAI/ChatGPT API integration
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Existing authentication, design system and application architecture

Do not recreate these systems.

**Primary rule: Inspect and understand the existing repository before writing code.**

Use existing architecture, conventions, dependencies, components, authentication, authorization, database relationships, and API patterns wherever possible.

Do not assume that the application uses a particular Next.js router, styling framework, ORM, state management library, or OpenAI SDK until the repository has been inspected.

## 1. PRODUCT VISION

Media Studio allows users to:

1. Select one of their existing projects.
2. Create content ideas for that project.
3. Choose a content format such as Post, Story, Carousel, Video, Advertisement, or Free Mode.
4. Configure content-specific options.
5. Enter a natural-language creative request.
6. Optionally upload reference images.
7. Generate detailed professional prompts using the existing OpenAI API integration.
8. Automatically incorporate the project's brand identity, description, logo references, colors, and other brand settings.
9. Review and edit the generated prompts.
10. Manage each prompt through a status workflow.
11. Access their pending prompts from a browser extension.
12. Copy image prompts into ChatGPT and video prompts into Google Flow or Gemini.
13. Update prompt statuses directly from the extension.
14. Keep completed prompts in a separate completed section.
15. Synchronize all changes between the admin panel and browser extension.

Media Studio is primarily a **prompt generation, planning, organization, and production tracking system**.

It must not depend on direct image or video generation APIs from the target platforms.

Actual media generation is performed by the user in ChatGPT, Google Flow, or Gemini.

The system must remain usable even when the target platforms change their interfaces.

## 2. REPOSITORY ANALYSIS — MANDATORY FIRST PHASE

Before implementation:

- Inspect package.json and the application directory structure.
- Identify the Next.js version and router.
- Identify the existing Supabase client and authentication implementation.
- Identify how project records are stored.
- Identify the project ownership and access-control model.
- Identify where project settings are implemented.
- Identify the existing project sidebar.
- Identify existing OpenAI integration services.
- Identify the existing UI component library.
- Identify styling, theme, responsive design and icon conventions.
- Identify storage buckets and upload conventions.
- Identify existing database migrations and naming conventions.
- Identify existing tests and development scripts.
- Identify whether the repository already contains a browser extension.

Produce a concise implementation plan based on actual findings.

Do not invent database column names or assume that project IDs are UUIDs.

Use the existing project's real primary key type and ownership relationships.

Avoid destructive database changes.

Do not modify unrelated features.

## 3. PROJECT SIDEBAR INTEGRATION

Inside each project's detail page, add a new navigation item:

**Media Studio**

Position it immediately below:

**Ana Sayfa**

Use the existing sidebar navigation component.

Requirements:
- Follow the existing route conventions.
- Use the existing icon library.
- Highlight the active route.
- Preserve project context during navigation.
- Maintain responsive behavior.
- Support direct URL access.
- Use existing authorization and project access checks.

Suggested conceptual route:

/projects/[projectId]/media-studio

Adapt the actual path to the existing repository.

The feature must only display content belonging to the selected project.

## 4. MEDIA STUDIO MAIN PAGE

Create a professional SaaS dashboard with the following areas.

### Header

Display:
- Media Studio title
- Current project name
- Optional project logo
- Short project description
- New Content button
- Search and filtering controls

### Dashboard statistics

Show:
- Total content ideas
- Pending prompts
- In-progress prompts
- Completed prompts
- Archived prompts

Do not confuse content ideas with individual prompts.

A carousel with six slides is one content idea but may contain six image prompts.

### Primary navigation

Create these sections:

1. İçerik Oluştur
2. Bekleyenler
3. Devam Edenler
4. Tamamlananlar
5. Arşiv

Use tabs or the existing application's preferred navigation pattern.

### Content list

Each content idea card should show:
- Content title
- Content type
- Project name
- Target platform
- Creation date
- Number of prompts
- Completed prompt count
- Overall progress
- Status
- Optional thumbnail
- Quick actions

Quick actions:
- Open
- Copy
- Edit
- Duplicate
- Archive
- Delete, with confirmation

Support search, filtering, sorting and pagination.

## 5. CONTENT CREATION EXPERIENCE

Use a clean, simple interface inspired by the supplied reference screenshot.

The interface should be approachable, with rounded segmented selection buttons, clear input fields, minimal visual noise and progressive disclosure.

### Content type selector

Available modes:

- Serbest
- Instagram Post
- Story
- Carousel
- Video
- Reklam

The selected mode controls which options appear.

Do not show every configuration option simultaneously.

### Common input fields

All modes should support:

- Content title, optional
- Creative brief / "Hakkında"
- Target platform
- Target audience, optional
- Communication tone
- Language
- Call to action, optional
- Reference images, optional
- Additional instructions, optional
- Brand kit application toggle
- Logo usage preference

Creative brief example:

"Ürünümüzü tanıtan modern ve dikkat çekici bir Instagram story hazırla. Ürünün üç temel avantajını anlat. Merak uyandıran bir başlık kullan. Son ekranda kullanıcıyı web sitemize yönlendir."

The brief must be interpreted together with the project's existing data.

### Free Mode

Allow an unrestricted creative brief.

Let the user choose:
- Image prompt
- Video prompt
- Both image and video prompts

### Instagram Post

Options:
- Square 1:1
- Portrait 4:5
- Landscape 1.91:1
- Visual style
- Text overlay preference
- Logo placement
- CTA preference
- Single image or multiple variations

### Story

Options:
- 9:16 vertical
- Single story or story series
- Story count
- Hook style
- Text overlay
- CTA
- Logo usage
- Visual style

Each story in a series should receive its own prompt.

### Carousel

Options:
- Automatic slide count
- Manual slide count: 3 through 10
- Aspect ratio: 1:1 or 4:5
- Educational / promotional / storytelling / comparison style
- Cover slide
- CTA slide
- Text density
- Visual consistency level
- Logo placement
- Optional reference images

A carousel with N slides must produce exactly N separate image prompts.

Before generating the final prompts, the AI should create a structured carousel plan.

The plan should define:
- Slide number
- Slide purpose
- Headline
- Supporting copy
- Key message
- Visual concept
- Composition direction
- Brand application

Allow the user to review and edit the slide plan.

After approval, generate the detailed prompt for every slide.

All slides must share a coherent design system.

Each prompt must also be independently usable because the user may generate slides in separate ChatGPT conversations.

### Video

Options:
- Target: Google Flow, Gemini, or both
- Duration preference
- Aspect ratio
- Visual style
- Camera movement
- Scene count
- Dialogue preference
- Voice-over preference
- Background music direction
- Sound effects
- Subtitle preference
- Logo and branding
- CTA
- Character consistency
- Product visibility

Do not hardcode model capabilities.

Maintain a configurable target capability registry.

If the requested duration or format is unsupported or unknown, provide an appropriate warning or scene-splitting plan.

### Advertisement

Options:
- Image or video
- Target platform
- Campaign objective
- Audience
- Product or service
- Key benefits
- Offer
- CTA
- Creative angle
- Visual style
- Number of variants
- Brand kit application

Campaign objectives:
- Brand awareness
- Traffic
- Conversion
- App installs
- Lead generation
- Engagement

Generate persuasive, brand-consistent creative directions without fabricating product claims, testimonials, guarantees or performance results.

## 6. PROJECT BRAND KIT

Inside:

Proje → Ayarlar

Add a new section:

**Marka Kiti**

Use the existing project settings structure.

### Brand identity fields

- Brand display name
- Primary brand color
- Secondary brand color
- Accent color
- Background color
- Text color
- Additional palette colors
- Brand tone
- Brand personality
- Preferred visual style
- Preferred typography
- Optional font family references
- Logo usage rules
- Brand slogan
- Brand keywords
- Prohibited words or styles
- Additional brand guidelines

### Color management

Provide:
- Visual color picker
- HEX input
- Color swatches
- Add/remove color actions
- Live palette preview
- Accessible contrast warnings
- Reset and save controls

Validate HEX color values.

### Logo integration

Reuse the existing project logo where possible.

Allow the brand kit to reference the existing logo rather than unnecessarily duplicating it.

If multiple logo variants are needed, store them in Supabase Storage using the application's existing conventions.

### Brand kit behavior

When generating prompts, automatically include the brand kit when enabled.

For example:

Primary color: #365CFF
Secondary color: #101828
Accent color: #8EE3CF

Brand style:
Modern, premium, minimalist, technology-focused.

The generated prompt must explain how these colors should be applied to the composition.

Do not merely append color codes to the end of the prompt.

Explain their roles in backgrounds, typography, accent graphics, lighting and interface-inspired elements.

The brand kit should be optional.

If no brand kit exists, use the project description and user request without inventing official brand colors.

### Brand kit snapshots

Store a snapshot of the brand settings used when generating each content idea.

Future brand kit changes must not silently modify historical prompts.

Provide an explicit regeneration action when users want to apply the updated brand kit.

## 7. AI PROMPT GENERATION ENGINE

Use the application's existing OpenAI API integration.

Never expose the OpenAI API key to the browser or extension.

AI generation must run through the application's secure server-side architecture.

### Prompt generation inputs

Build a structured generation context containing:

- Project name
- Project description
- Project logo reference, when relevant
- Brand kit
- Content type
- Creative brief
- Target audience
- Tone
- Language
- Target AI platform
- Format-specific settings
- Uploaded reference image descriptions
- Additional user instructions

Use validated, structured input.

### AI generation strategy

Use a two-stage process for complex content.

Stage 1: Creative planning

Generate:
- Content concept
- Core message
- Audience positioning
- Creative direction
- Visual system
- Slide or scene breakdown
- CTA
- Consistency instructions

Stage 2: Detailed prompt generation

Generate production-ready prompts for each required output.

For simple posts and stories, the planning stage may be internal if review is not required.

For carousels and multi-scene videos, provide an editable planning step.

### Image prompt requirements

Each image prompt should include:

- Creative objective
- Subject
- Product context
- Environment
- Composition
- Framing
- Aspect ratio
- Lighting
- Color palette
- Brand identity
- Typography direction
- Exact text to include, when applicable
- Logo usage instructions
- Visual hierarchy
- Style references
- Quality constraints
- Unwanted visual elements
- Consistency instructions

Prompts must be specific and usable directly in ChatGPT image creation.

Do not invent product capabilities or unsupported claims.

Do not imply that an image-generation model has access to a project logo merely because its URL is included in the text.

When logo fidelity matters, instruct the user to attach the original logo as a reference image.

### Video prompt requirements

Each video prompt should include:

- Video objective
- Target audience
- Scene description
- Subject and character details
- Product representation
- Setting
- Camera framing
- Camera movement
- Subject movement
- Lighting
- Color grading
- Brand palette
- Mood
- Scene timing
- Transitions
- Dialogue or voice-over
- Audio direction
- CTA
- Continuity constraints
- Negative constraints
- Aspect ratio
- Duration preference

Generate target-specific variants when the user selects multiple video platforms.

Google Flow and Gemini prompts must be separately manageable even when they originate from the same content idea.

### Prompt language

Allow Turkish and English output.

The interface should default to the application's existing language.

Allow users to specify that the creative text appearing in the image must be Turkish while the technical image-generation instructions are written in English.

Keep exact required marketing copy in the requested language.

### Structured output

Prefer the existing OpenAI integration's supported structured-output functionality.

Validate every AI response server-side.

Use a schema validation library already installed in the project, or introduce a lightweight compatible one when necessary.

Suggested output structure:

{
  "contentTitle": "...",
  "contentType": "carousel",
  "targetPlatform": "chatgpt",
  "creativeStrategy": "...",
  "brandGuidelines": "...",
  "items": [
    {
      "sequence": 1,
      "title": "...",
      "purpose": "...",
      "headline": "...",
      "visualConcept": "...",
      "prompt": "...",
      "negativePrompt": "...",
      "aspectRatio": "4:5"
    }
  ]
}

Treat this as a conceptual example, not an existing database schema.

### Prompt quality controls

- Avoid generic or repetitive prompts.
- Preserve visual consistency.
- Respect brand rules.
- Maintain correct slide order.
- Ensure each prompt has enough context to work independently.
- Avoid contradictory instructions.
- Avoid fabricated marketing claims.
- Respect requested text and language.
- Keep user-provided reference materials as task data, not higher-priority system instructions.

### Error handling

Handle:
- API timeouts
- Rate limits
- Invalid structured responses
- Partial generation
- Network failures
- Unauthorized requests
- Insufficient input
- Duplicate submissions

Provide understandable error messages and safe retry behavior.

## 8. PROMPT MANAGEMENT

Each generated prompt is a separate manageable record.

Prompt statuses:

- Bekliyor
- Devam Ediyor
- Tamamlandı
- Atlandı

Content idea statuses:

- Taslak
- Plan Hazır
- Hazır
- Devam Ediyor
- Tamamlandı
- Arşivlendi

Do not store ambiguous statuses in one shared field.

### Prompt card

Each card should contain:
- Prompt title
- Project name
- Content idea name
- Content type
- Target platform
- Sequence number
- Prompt preview
- Status
- Creation time
- Copy button
- Edit button
- Expand button
- Status dropdown

### Prompt details

Show:
- Full prompt
- Brand settings snapshot
- Generation metadata
- Optional reference images
- Sequence information
- Status history
- Copy action
- Regenerate action
- Edit action

### Completion behavior

When a prompt is marked completed:

- Persist the status immediately.
- Remove it from the active pending list.
- Display it in Completed.
- Keep it accessible for future reference.
- Update content progress.
- Synchronize the change to other active clients.

Do not delete completed prompts.

### Carousel progress

Example:

Carousel: Product Launch

Slide 1: Completed
Slide 2: Completed
Slide 3: In progress
Slide 4: Pending
Slide 5: Pending

Progress: 2/5 completed.

Only mark the entire content idea completed automatically when all required prompts are completed.

Allow explicit user-controlled completion where appropriate.

## 9. DATABASE DESIGN — SUPABASE POSTGRESQL

Inspect the existing schema before creating migrations.

Use the existing project table and project access model.

Create the necessary tables using the project's migration conventions.

Suggested conceptual tables:

### media_brand_kits

Stores project-specific brand configuration.

Suggested fields:
- id
- project_id
- display_name
- colors JSONB
- tone
- personality
- visual_style
- typography JSONB
- logo_rules JSONB
- slogan
- keywords
- prohibited_terms
- guidelines
- created_at
- updated_at

Use an appropriate unique constraint for project_id if one brand kit per project is intended.

### media_content_ideas

Stores high-level content plans.

Suggested fields:
- id
- project_id
- created_by
- title
- content_type
- creative_brief
- settings JSONB
- brand_snapshot JSONB
- plan JSONB
- status
- created_at
- updated_at
- archived_at

### media_prompts

Stores individually manageable prompts.

Suggested fields:
- id
- content_idea_id
- project_id
- sequence_number
- title
- target_platform
- media_type
- prompt_text
- negative_prompt
- metadata JSONB
- status
- completed_at
- created_at
- updated_at

### media_prompt_assets

Stores reference assets associated with content ideas or prompts.

Suggested fields:
- id
- project_id
- content_idea_id
- prompt_id
- storage_path
- asset_type
- original_filename
- mime_type
- created_at

### media_prompt_events

Stores important prompt workflow events.

Suggested fields:
- id
- prompt_id
- actor_id
- event_type
- previous_status
- new_status
- created_at

### Database constraints

Implement:
- Foreign keys
- Appropriate cascading or restrictive delete rules
- Status constraints
- Unique ordering constraints where appropriate
- Project-based indexes
- Status-based indexes
- Timestamp indexes
- Appropriate JSONB usage
- updated_at behavior
- Transaction-safe operations

Avoid storing large binary assets in PostgreSQL.

Use Supabase Storage for uploaded files.

### Authorization and RLS

Enable Row Level Security on all new tables.

Use the application's existing project membership or ownership authorization model.

Do not assume that project ownership is always stored as projects.user_id.

Policies must ensure:
- Users can only access projects they are authorized to access.
- Brand kits are restricted to authorized project users.
- Content ideas cannot be read across unauthorized projects.
- Prompt records cannot be read or modified across unauthorized projects.
- Asset records respect project access.
- Event records respect project access.

Enforce project access on server-side API endpoints as well.

Do not rely solely on UI filtering.

Do not use service-role credentials in the browser extension.

## 10. SUPABASE STORAGE

Reuse existing storage conventions when suitable.

Otherwise create a private bucket for Media Studio assets.

Supported assets:
- Reference images
- Additional brand logos
- Optional creative references
- Optional user-uploaded preview images

Requirements:
- File size limits
- MIME type validation
- Safe file naming
- Project-specific paths
- Storage authorization policies
- Signed URL access where needed
- Safe deletion behavior
- Upload progress
- Preview support

The browser extension should only access authorized assets.

## 11. BROWSER EXTENSION — CHROME MANIFEST V3

Create a separate extension workspace or package following the repository's existing monorepo conventions.

The extension is a companion application for Media Studio.

It must run on supported pages of:
- ChatGPT
- Google Flow
- Gemini

Use configurable, narrowly scoped host permissions for supported official domains.

Do not request unrestricted access to every website.

### Extension architecture

Use:
- Manifest V3
- Background service worker
- Content scripts
- Isolated injected panel
- Chrome storage APIs
- Secure authentication handling
- Existing Supabase backend
- Project-scoped prompt queries

Use Shadow DOM or equivalent style isolation where appropriate to prevent host page CSS conflicts.

Do not inject executable code into the host page's main JavaScript context unless absolutely necessary and justified.

### Authentication

When the user is not authenticated, display a compact login panel.

The extension must use the same Supabase Auth project and existing user accounts as the main application.

Do not create a second account system.

Support the existing authentication methods wherever technically compatible with the extension.

If email/password authentication is already enabled, provide:
- Email field
- Password field
- Login button
- Logout action
- Session status
- Loading state
- Error messages

If OAuth is used, implement a compatible extension authentication flow rather than copying browser cookies.

Handle:
- Session persistence
- Token refresh
- Expired sessions
- Logout
- Invalid credentials
- Permission errors

Store authentication state securely within the extension's permitted storage model.

Never store passwords.

Never expose Supabase service-role credentials or OpenAI secrets.

### Extension panel

Create a polished floating panel that can be:
- Opened
- Closed
- Minimized
- Maximized
- Moved by dragging
- Resized within reasonable limits

The panel should not obstruct the target website unnecessarily.

Use a compact default size.

### Position persistence

Persist:
- X position
- Y position
- Width
- Height
- Minimized state
- Maximized state
- Selected project
- Selected filters

Use Chrome extension storage.

When the page refreshes, restore the previous panel state.

Validate restored coordinates against the current viewport.

If the previous position is off-screen, reposition the panel into a visible area.

### Extension layout

Header:
- Media Studio
- Connection status
- Current project
- Minimize
- Maximize
- Close

Project selector:
- List authorized projects
- Search projects
- Remember last selection

Prompt filters:
- Pending
- In progress
- Completed
- All

Prompt cards:
- Title
- Content type
- Platform
- Sequence
- Preview
- Copy icon
- Status selector
- Expand details

### Platform-aware behavior

On ChatGPT:

Default to image prompts.

Show:
- Image prompts
- Post prompts
- Story prompts
- Carousel image prompts
- Image advertisement prompts

On Google Flow:

Default to video prompts targeted to Google Flow.

On Gemini:

Default to video prompts targeted to Gemini.

Do not permanently restrict access to other prompt categories; allow sensible filtering.

Use clear platform labels.

### Prompt copying

Each prompt must have a copy icon.

Clicking the icon copies the complete prompt to the clipboard.

Show a brief confirmation.

Do not automatically mark a prompt completed when it is copied.

Optionally allow the user to move it to In Progress.

### Manual production workflow

The extension should make it easy to:

1. Select a project.
2. Select a pending prompt.
3. Read the prompt.
4. Copy it.
5. Paste it into the host platform.
6. Generate the media using the host platform.
7. Mark the prompt completed.

Do not automatically submit prompts or click host generation controls.

Do not scrape private conversations or generated content.

Do not claim that generated media has been saved or uploaded unless that action actually occurred.

### Sync behavior

Prompt changes in the extension must update Supabase.

Changes in the admin panel should appear in the extension.

Use Supabase Realtime where suitable, with authorization-aware subscriptions.

Provide a polling or manual refresh fallback.

Handle stale data and network disconnections gracefully.

## 12. EXTENSION SECURITY

Apply least privilege.

Requirements:
- Strict host permissions
- No service-role key
- No OpenAI API key
- No password persistence
- Secure session handling
- Authorization-aware data access
- CSP-compliant code
- No remote executable scripts
- No unsafe dynamic evaluation
- Safe DOM rendering
- No direct insertion of untrusted HTML
- Protection against prompt content injection into the extension UI

The extension must never trust project_id values supplied by the browser alone.

Authorization must be enforced by Supabase RLS and/or the authenticated backend.

## 13. UI AND UX REQUIREMENTS

Match the existing admin panel's design system.

Design direction:
- Modern SaaS
- Minimalist
- Clean spacing
- Rounded cards
- Segmented controls
- Clear hierarchy
- Professional typography
- Subtle borders
- Consistent iconography
- Responsive layout
- Light/dark theme compatibility where supported

Avoid unnecessary visual complexity.

The Media Studio interface should feel native to the existing application.

### Important interaction principles

- Show only relevant fields.
- Use helpful defaults.
- Keep primary actions visible.
- Preserve unsaved form input when reasonable.
- Clearly indicate loading.
- Clearly distinguish planning from prompt generation.
- Allow users to edit AI-generated plans.
- Display meaningful progress.
- Use confirmation dialogs for destructive actions.
- Support keyboard navigation.
- Include accessible labels and focus states.

### Empty states

Create useful empty states for:
- No content ideas
- No pending prompts
- No completed prompts
- No brand kit
- No accessible projects
- No internet connection

## 14. API AND SERVER ARCHITECTURE

Use the existing application's API architecture.

Suggested conceptual operations:

- Get Media Studio dashboard
- List content ideas
- Create content idea
- Update content idea
- Generate content plan
- Approve content plan
- Generate prompts
- List prompts
- Update prompt
- Update prompt status
- Regenerate prompt
- Archive content idea
- Get brand kit
- Update brand kit
- Upload reference asset

Do not create duplicate endpoints if equivalent server actions or services already exist.

Use shared validation schemas.

Keep OpenAI calls server-side.

Apply authorization checks before every project-specific operation.

Support safe retries and idempotency for prompt generation.

Avoid duplicate prompts when the user double-clicks Generate.

## 15. PERFORMANCE AND RELIABILITY

Requirements:
- Efficient project-scoped queries
- Paginated prompt lists
- Optimistic status updates with rollback
- Debounced search
- Lazy-loaded detail views
- Minimal extension bundle size
- Efficient extension rendering
- Retryable network operations
- Useful error boundaries
- No unnecessary full-page refreshes
- No expensive global subscriptions
- No repeated OpenAI calls caused by React rerenders

Handle long AI generation operations appropriately.

Use existing background job infrastructure if available.

Otherwise implement a reliable server-compatible execution strategy and clearly document its limitations.

## 16. TESTING

Create tests compatible with the existing test framework.

Cover:

### Database and security
- Unauthorized project access
- RLS isolation
- Cross-project prompt access
- Invalid status transitions
- Foreign key behavior
- Storage authorization

### AI generation
- Correct project context
- Correct brand kit injection
- Missing brand kit
- Carousel item count
- Correct slide ordering
- Separate video platform prompts
- Invalid model response
- Retry behavior

### UI
- Mode selection
- Conditional fields
- Form validation
- Content creation
- Status updates
- Completed prompt filtering
- Project navigation

### Extension
- Login
- Logout
- Session restoration
- Project selection
- Platform-aware filtering
- Copy action
- Status synchronization
- Position persistence
- Minimize/maximize
- Viewport boundary handling

## 17. IMPLEMENTATION PHASES

Implement in the following order.

### Phase 1 — Architecture and database

- Inspect repository
- Map existing project and authentication relationships
- Design migrations
- Implement RLS
- Implement brand kit data model
- Implement content idea and prompt models

### Phase 2 — Brand Kit

- Add settings section
- Implement color picker
- Implement brand identity fields
- Integrate existing logo
- Persist brand settings

### Phase 3 — Media Studio UI

- Add sidebar item
- Create dashboard
- Create content forms
- Implement content lists
- Implement status workflow
- Implement content detail view

### Phase 4 — AI Prompt Engine

- Reuse OpenAI integration
- Implement context builder
- Implement planning stage
- Implement prompt generation
- Implement carousel generation
- Implement video prompt generation
- Implement structured output validation
- Implement regeneration and error handling

### Phase 5 — Chrome Extension

- Create Manifest V3 package
- Implement login
- Implement injected panel
- Implement drag, resize and minimize
- Implement storage persistence
- Implement platform-aware filtering
- Implement copy and status actions
- Implement synchronization

### Phase 6 — QA and hardening

- Run migrations in the appropriate environment
- Validate RLS
- Run type checking
- Run linting
- Run tests
- Test responsive design
- Test extension across supported websites
- Fix regressions
- Document installation and configuration

## 18. ACCEPTANCE CRITERIA

The feature is complete when:

1. A project sidebar contains Media Studio below Ana Sayfa.
2. A project can have an optional brand kit.
3. Users can configure brand colors through a visual interface.
4. Users can create Post, Story, Carousel, Video, Advertisement and Free Mode content ideas.
5. AI generation uses the existing OpenAI integration.
6. Generated prompts include project context and enabled brand settings.
7. A carousel with six slides produces six separately manageable prompts.
8. Video prompts can target Google Flow and Gemini independently.
9. Users can review, copy, edit and update prompts.
10. Completed prompts disappear from pending lists.
11. Completed prompts remain accessible in the Completed section.
12. A Chrome extension can authenticate using existing Supabase accounts.
13. The extension injects a usable panel on supported ChatGPT, Flow and Gemini pages.
14. The panel supports dragging, minimizing and maximizing.
15. The panel restores its saved state after page refresh.
16. The extension shows authorized project prompts.
17. Prompt copying works reliably.
18. Prompt status changes synchronize with the admin panel.
19. RLS prevents unauthorized project access.
20. Existing project functionality remains intact.

## 19. REQUIRED DELIVERY

Deliver actual working code, not only an architectural explanation.

Provide:
- Database migrations
- RLS policies
- Backend services
- API routes or server actions
- Brand Kit interface
- Media Studio pages
- AI prompt generation services
- Chrome extension source code
- Manifest V3 configuration
- Authentication integration
- Tests
- Environment variable documentation
- Installation instructions
- Extension loading instructions
- Migration instructions

Do not hardcode secrets.

Do not invent existing schema fields.

Do not rewrite unrelated architecture.

Do not silently change existing authentication behavior.

If repository details are missing, inspect the codebase before making implementation decisions.

## 20. FINAL ENGINEERING RULE

Build Media Studio as a maintainable, extensible feature of the existing SaaS platform.

The system must support future expansion to other prompt destinations without requiring a redesign of the core database.

Prioritize:
1. Existing application compatibility
2. Data security
3. Prompt quality
4. User experience
5. Reliability
6. Maintainability
7. Performance

Start by analyzing the existing repository and identifying the precise integration points. Then implement the feature in logical phases, validating each phase before proceeding.
