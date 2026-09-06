# ChatMat Feature Enhancement Design Spec

## Overview

This design covers comprehensive feature additions to ChatMat: a chat bubble favicon, TipTap rich text editor, note organization, export/sharing, real-time collaboration, and UI/UX improvements.

## 1. Favicon Change

### Current State
- `public/favicon.ico` - existing ICO format favicon
- Referenced in `src/app/layout.tsx` as `icons: { icon: "/favicon.ico" }`

### New Design
- **Shape**: Chat bubble / speech bubble
- **Format**: SVG for scalability, with ICO fallback
- **Colors**: Match existing theme (ink-50/ink-900 palette)
- **Location**: `public/favicon.svg` and `public/favicon.ico`

### Implementation
- Create SVG chat bubble icon
- Update metadata in `src/app/layout.tsx`
- Add `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`

---

## 2. TipTap Rich Text Editor

### Features
- **Core extensions**: Bold, italic, headings, bullet/ordered lists, blockquote, code blocks
- **Advanced**: Tables, task lists, links, images
- **Custom**: Mention (@user), slash commands for quick insertion
- **Styling**: Match Tailwind theme, dark mode support

### Integration Points
- New component: `src/components/editor/TipTapEditor.tsx`
- New component: `src/components/editor/EditorToolbar.tsx`
- Replace current note editing in `src/app/(protected)/notes/`

### Dependencies
- `@tiptap/react` - React integration
- `@tiptap/starter-kit` - Core extensions
- `@tiptap/extension-table` - Table support
- `@tiptap/extension-task-list` - Task lists
- `@tiptap/extension-placeholder` - Placeholder text

---

## 3. Note Organization

### Folder System
- **Data model**: Notes can belong to folders; folders can be nested
- **UI**: Sidebar folder tree with expand/collapse
- **CRUD**: Create, rename, delete folders with confirmation
- **Migration**: Existing notes go to "Uncategorized" folder

### Tags
- **Data model**: Many-to-many relationship (notes ↔ tags)
- **UI**: Tag picker in note editor, tag filter in sidebar
- **Autocomplete**: Suggest existing tags when typing
- **Colors**: Optional color coding for tags

### Search
- **Full-text search**: Search note titles and content
- **Filters**: By folder, tags, date range
- **UI**: Search bar in header, results highlighted
- **Debounced**: 300ms debounce for real-time search

### Sorting
- **Options**: Last modified, created date, alphabetical
- **Direction**: Ascending/descending toggle
- **Persist**: Remember user preference in localStorage

---

## 4. Export Formats

### Supported Formats
- **PDF**: Using `html2pdf.js` or `react-pdf`
- **Markdown**: Convert TipTap JSON to Markdown
- **HTML**: Export rendered note as standalone HTML
- **Plain Text**: Strip formatting

### Implementation
- Export button in note actions menu
- Modal for format selection
- Download triggered client-side
- Share link export as separate feature

---

## 5. Share via Link

### Features
- **Public links**: Generate unique URL for note
- **Access control**: View-only or edit permissions
- **Expiry**: Optional link expiration
- **Analytics**: Track views (optional)

### Data Model
- New `shared_notes` table/collection
- Fields: `noteId`, `shareToken`, `permission`, `expiresAt`, `createdAt`

### UI
- Share button in note header
- Modal with link, copy button, permission toggle
- Share status indicator on note

---

## 6. Real-time Collaboration

### Architecture
- **Firebase Realtime Database** or **Firestore** for sync
- **Presence**: Show who's viewing a note
- **Cursor tracking**: Show other users' cursors
- **Conflict resolution**: Operational Transform or Last-write-wins

### Features
- Multi-user editing with conflict handling
- User avatars in note header showing active editors
- Typing indicators
- Version history with author attribution

### Implementation
- New hook: `src/hooks/useCollaboration.ts`
- Firebase listeners for real-time updates
- Debounced save to prevent excessive writes

---

## 7. Dark Mode

### Implementation
- **Theme provider**: Use `next-themes` library
- **CSS variables**: Extend Tailwind config with theme colors
- **System preference**: Sync with OS setting by default
- **Toggle**: In settings page and header

### Color Palette
- Light: ink-50 background, ink-900 text
- Dark: ink-900 background, ink-50 text
- Accent colors: Consistent across themes

### Components to Update
- All components using hardcoded colors
- Editor toolbar and menus
- Modals and overlays

---

## 8. Navigation Improvements

### Sidebar
- **Collapsible**: Toggle sidebar visibility
- **Sections**: Notes, Settings, with icons
- **Active state**: Highlight current page
- **Responsive**: Overlay on mobile, fixed on desktop

### Breadcrumbs
- Show current location: `Notes > Folder > Note`
- Clickable segments for quick navigation
- Responsive: Truncate on mobile

### Quick Actions
- Command palette (Cmd+K) for quick navigation
- Recent notes list
- Create new note/folder shortcuts

---

## 9. Keyboard Shortcuts

### Default Shortcuts
- `Cmd/Ctrl + N`: New note
- `Cmd/Ctrl + S`: Save note
- `Cmd/Ctrl + K`: Command palette
- `Cmd/Ctrl + B`: Bold
- `Cmd/Ctrl + I`: Italic
- `Cmd/Ctrl + Shift + H`: Heading
- `Escape`: Close modal/menu

### Implementation
- Global keyboard event listener
- Shortcut conflict detection
- Customizable in settings (stretch goal)
- Help modal showing all shortcuts

---

## 10. Mobile Responsive

### Breakpoints
- Mobile: < 640px (single column, overlay sidebar)
- Tablet: 640-1024px (collapsible sidebar)
- Desktop: > 1024px (fixed sidebar)

### Mobile-Specific
- Bottom navigation bar
- Swipe gestures for navigation
- Touch-friendly tap targets (min 44px)
- Simplified toolbar in editor

### Testing
- Test on iOS Safari and Android Chrome
- Verify touch interactions
- Check performance on mobile devices

---

## Technical Dependencies

```json
{
  "dependencies": {
    "@tiptap/react": "^2.x",
    "@tiptap/starter-kit": "^2.x",
    "@tiptap/extension-table": "^2.x",
    "@tiptap/extension-task-list": "^2.x",
    "@tiptap/extension-placeholder": "^2.x",
    "next-themes": "^0.3.x",
    "html2pdf.js": "^0.10.x",
    "turndown": "^7.x"
  }
}
```

---

## File Structure Changes

```
src/
├── components/
│   ├── editor/
│   │   ├── TipTapEditor.tsx
│   │   └── EditorToolbar.tsx
│   ├── notes/
│   │   ├── NoteCard.tsx
│   │   ├── NoteList.tsx
│   │   ├── FolderTree.tsx
│   │   └── TagPicker.tsx
│   ├── sharing/
│   │   ├── ShareModal.tsx
│   │   └── ExportModal.tsx
│   ├── ui/
│   │   ├── CommandPalette.tsx
│   │   ├── KeyboardShortcuts.tsx
│   │   └── ThemeToggle.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       └── Breadcrumbs.tsx
├── hooks/
│   ├── useCollaboration.ts
│   ├── useKeyboardShortcuts.ts
│   └── useSearch.ts
└── lib/
    ├── firebase-collaboration.ts
    └── export-utils.ts
```

---

## Success Criteria

1. All features functional and tested
2. No regression in existing functionality
3. Mobile responsive across breakpoints
4. Dark mode works correctly
5. Keyboard shortcuts don't conflict
6. Collaboration works in real-time
7. Export produces valid files

---

## Open Questions

- Firebase plan limits for real-time collaboration?
- PDF export library choice (html2pdf vs react-pdf)?
- Maximum folder nesting depth?
- Link sharing expiration options?

