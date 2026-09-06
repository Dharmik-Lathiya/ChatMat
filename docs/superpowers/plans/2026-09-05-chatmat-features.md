# ChatMat Feature Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement comprehensive feature enhancements including TipTap editor, note organization, sharing/export, collaboration, dark mode, and UI improvements.

**Architecture:** Build incrementally from foundation (theme, layout) up to features (editor, collaboration). Each task produces a working, testable deliverable.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, TipTap, Firebase, next-themes

## Global Constraints

- Node.js 18+ required
- Firebase project required for auth and database
- All components must support dark mode
- TypeScript strict mode enabled
- Mobile-first responsive design

---

## Phase 1: Foundation & Configuration

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Dependencies to install:**
- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-table`, `@tiptap/extension-task-list`, `@tiptap/extension-placeholder`, `@tiptap/extension-mention`, `@tiptap/extension-code-block-lowlight`
- `next-themes`
- `html2pdf.js`
- `turndown`
- `@types/turndown`

- [ ] **Step 1: Install TipTap packages**

Run: `npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-table @tiptap/extension-task-list @tiptap/extension-placeholder @tiptap/extension-mention @tiptap/extension-code-block-lowlight`

- [ ] **Step 2: Install utility packages**

Run: `npm install next-themes html2pdf.js turndown`

- [ ] **Step 3: Install type definitions**

Run: `npm install -D @types/turndown`

- [ ] **Step 4: Commit**

Run: `git add package.json package-lock.json && git commit -m "chore: install dependencies for new features"`

---

### Task 2: Configure Theme System

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`
- Modify: `src/app/providers.tsx`

**Interfaces:**
- Produces: ThemeProvider component wrapping app

- [ ] **Step 1: Update Tailwind config with theme colors**

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f7f8",
          100: "#ececf1",
          200: "#d9d9e3",
          300: "#c5c5d2",
          400: "#acacbe",
          500: "#8e8ea0",
          600: "#565869",
          700: "#40414f",
          800: "#2d2d3a",
          900: "#1a1a2e",
          950: "#0f0f1a",
        },
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 2: Update globals.css with theme variables**

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #f7f7f8;
  --foreground: #1a1a2e;
}

.dark {
  --background: #0f0f1a;
  --foreground: #f7f7f8;
}

body {
  background-color: var(--background);
  color: var(--foreground);
}
```

- [ ] **Step 3: Update providers.tsx with ThemeProvider**

```tsx
// src/app/providers.tsx
"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
```

- [ ] **Step 4: Test dark mode toggle works**

Run: `npm run dev`
Open browser, verify theme toggles between light/dark

- [ ] **Step 5: Commit**

Run: `git add tailwind.config.ts src/app/globals.css src/app/providers.tsx && git commit -m "feat: configure theme system with next-themes"`

---

### Task 3: Create Favicon

**Files:**
- Create: `public/favicon.svg`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create SVG chat bubble favicon**

```svg
<!-- public/favicon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#40414f;stop-opacity:1" />
    </linearGradient>
  </defs>
  <path d="M50 10 C25 10 10 28 10 48 C10 60 16 70 26 76 L22 90 L38 82 C42 83 46 84 50 84 C75 84 90 66 90 48 C90 28 75 10 50 10Z" fill="url(#grad)"/>
  <circle cx="35" cy="48" r="6" fill="#f7f7f8"/>
  <circle cx="50" cy="48" r="6" fill="#f7f7f8"/>
  <circle cx="65" cy="48" r="6" fill="#f7f7f8"/>
</svg>
```

- [ ] **Step 2: Update layout.tsx metadata**

```tsx
// src/app/layout.tsx
export const metadata: Metadata = {
  title: "Chatmat",
  description: "Chat + Notes workspace",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
  },
};
```

- [ ] **Step 3: Verify favicon displays**

Run: `npm run dev`
Check browser tab for new favicon

- [ ] **Step 4: Commit**

Run: `git add public/favicon.svg src/app/layout.tsx && git commit -m "feat: add chat bubble favicon"`

---

## Phase 2: Layout & Navigation

### Task 4: Create Sidebar Component

**Files:**
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/SidebarItem.tsx`
- Modify: `src/app/(protected)/layout.tsx`

**Interfaces:**
- Consumes: Theme from next-themes
- Produces: Sidebar with collapsible sections

- [ ] **Step 1: Create SidebarItem component**

```tsx
// src/components/layout/SidebarItem.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

export function SidebarItem({ href, icon, label }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        isActive
          ? "bg-ink-200 dark:bg-ink-700 text-ink-900 dark:text-ink-50"
          : "text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}
```

- [ ] **Step 2: Create Sidebar component**

```tsx
// src/components/layout/Sidebar.tsx
"use client";

import { useState } from "react";
import { SidebarItem } from "./SidebarItem";
import { NoteIcon, SettingsIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`flex flex-col border-r border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-900 transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-ink-200 dark:border-ink-700">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-50">
            ChatMat
          </h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded hover:bg-ink-200 dark:hover:bg-ink-700"
        >
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        <SidebarItem
          href="/notes"
          icon={<NoteIcon />}
          label={isCollapsed ? "" : "Notes"}
        />
        <SidebarItem
          href="/settings"
          icon={<SettingsIcon />}
          label={isCollapsed ? "" : "Settings"}
        />
      </nav>
    </aside>
  );
}
```

- [ ] **Step 3: Create icon components**

```tsx
// src/components/icons/index.tsx
export function NoteIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

export function SettingsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export function ChevronLeftIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export function ChevronRightIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
```

- [ ] **Step 4: Update protected layout**

```tsx
// src/app/(protected)/layout.tsx
import { Sidebar } from "@/components/layout/Sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
```

- [ ] **Step 5: Test sidebar renders and collapses**

Run: `npm run dev`
Navigate to `/notes`, verify sidebar appears and collapses

- [ ] **Step 6: Commit**

Run: `git add src/components/layout/ src/components/icons/ src/app/\(protected\)/layout.tsx && git commit -m "feat: add collapsible sidebar navigation"`

---

### Task 5: Add Theme Toggle

**Files:**
- Create: `src/components/ui/ThemeToggle.tsx`
- Modify: `src/app/(protected)/layout.tsx`

**Interfaces:**
- Consumes: useTheme from next-themes
- Produces: ThemeToggle button component

- [ ] **Step 1: Create ThemeToggle component**

```tsx
// src/components/ui/ThemeToggle.tsx
"use client";

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-lg hover:bg-ink-200 dark:hover:bg-ink-700 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}
```

- [ ] **Step 2: Add ThemeToggle to layout header**

```tsx
// src/app/(protected)/layout.tsx
import { Sidebar } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-auto">
        <header className="flex items-center justify-end p-4 border-b border-ink-200 dark:border-ink-700">
          <ThemeToggle />
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Test theme toggle in header**

Run: `npm run dev`
Click theme toggle, verify icon changes and theme applies

- [ ] **Step 4: Commit**

Run: `git add src/components/ui/ThemeToggle.tsx src/app/\(protected\)/layout.tsx && git commit -m "feat: add theme toggle to header"`

---

## Phase 3: Note Organization

### Task 6: Create Folder System

**Files:**
- Create: `src/components/notes/FolderTree.tsx`
- Create: `src/components/notes/FolderItem.tsx`
- Create: `src/lib/types.ts`
- Modify: `src/app/(protected)/notes/page.tsx`

**Interfaces:**
- Produces: Folder type, FolderTree component

- [ ] **Step 1: Create types file**

```typescript
// src/lib/types.ts
export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  tags: Tag[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  userId: string;
  createdAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  userId: string;
}

export interface SharedNote {
  id: string;
  noteId: string;
  shareToken: string;
  permission: "view" | "edit";
  expiresAt: Date | null;
  createdAt: Date;
}
```

- [ ] **Step 2: Create FolderItem component**

```tsx
// src/components/notes/FolderItem.tsx
"use client";

import { useState } from "react";
import { Folder } from "@/lib/types";
import { ChevronRightIcon, ChevronDownIcon, FolderIcon } from "@/components/icons";

interface FolderItemProps {
  folder: Folder;
  isActive: boolean;
  onSelect: (folderId: string) => void;
  onRename: (folderId: string, name: string) => void;
  onDelete: (folderId: string) => void;
}

export function FolderItem({
  folder,
  isActive,
  onSelect,
  onRename,
  onDelete,
}: FolderItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);

  const handleRename = () => {
    if (editName.trim()) {
      onRename(folder.id, editName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer ${
          isActive
            ? "bg-ink-200 dark:bg-ink-700"
            : "hover:bg-ink-100 dark:hover:bg-ink-800"
        }`}
        onClick={() => onSelect(folder.id)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="p-0.5"
        >
          {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </button>
        <FolderIcon />
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            className="flex-1 bg-transparent border-none outline-none"
            autoFocus
          />
        ) : (
          <span className="flex-1 truncate">{folder.name}</span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create FolderTree component**

```tsx
// src/components/notes/FolderTree.tsx
"use client";

import { useState } from "react";
import { Folder } from "@/lib/types";
import { FolderItem } from "./FolderItem";
import { PlusIcon, FolderIcon } from "@/components/icons";

interface FolderTreeProps {
  folders: Folder[];
  activeFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

export function FolderTree({
  folders,
  activeFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: FolderTreeProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const rootFolders = folders.filter((f) => f.parentId === null);

  const handleCreate = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), null);
      setNewFolderName("");
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-semibold text-ink-500 uppercase">
          Folders
        </span>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 rounded hover:bg-ink-200 dark:hover:bg-ink-700"
        >
          <PlusIcon />
        </button>
      </div>

      <div
        className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer ${
          activeFolderId === null
            ? "bg-ink-200 dark:bg-ink-700"
            : "hover:bg-ink-100 dark:hover:bg-ink-800"
        }`}
        onClick={() => onSelectFolder(null)}
      >
        <FolderIcon />
        <span>All Notes</span>
      </div>

      {isCreating && (
        <div className="flex items-center gap-2 px-2">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Folder name"
            className="flex-1 px-2 py-1 text-sm bg-transparent border border-ink-300 dark:border-ink-600 rounded"
            autoFocus
          />
        </div>
      )}

      {rootFolders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          isActive={activeFolderId === folder.id}
          onSelect={onSelectFolder}
          onRename={onRenameFolder}
          onDelete={onDeleteFolder}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Update notes page with folder tree**

```tsx
// src/app/(protected)/notes/page.tsx
"use client";

import { useState } from "react";
import { FolderTree } from "@/components/notes/FolderTree";
import { Folder } from "@/lib/types";

export default function NotesPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  const handleCreateFolder = (name: string, parentId: string | null) => {
    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name,
      parentId,
      userId: "current-user",
      createdAt: new Date(),
    };
    setFolders([...folders, newFolder]);
  };

  const handleRenameFolder = (folderId: string, name: string) => {
    setFolders(
      folders.map((f) => (f.id === folderId ? { ...f, name } : f))
    );
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders(folders.filter((f) => f.id !== folderId));
  };

  return (
    <div className="flex h-full">
      <div className="w-64 border-r border-ink-200 dark:border-ink-700 p-4">
        <FolderTree
          folders={folders}
          activeFolderId={activeFolderId}
          onSelectFolder={setActiveFolderId}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
        />
      </div>
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold mb-4">Notes</h1>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Test folder creation, rename, selection**

Run: `npm run dev`
Create folders, rename, select, verify state updates

- [ ] **Step 6: Commit**

Run: `git add src/components/notes/ src/lib/types.ts src/app/\(protected\)/notes/page.tsx && git commit -m "feat: add folder organization system"`

---

### Task 7: Add Tag System

**Files:**
- Create: `src/components/notes/TagPicker.tsx`
- Create: `src/components/notes/TagBadge.tsx`
- Modify: `src/app/(protected)/notes/page.tsx`

**Interfaces:**
- Consumes: Tag type from types.ts
- Produces: TagPicker, TagBadge components

- [ ] **Step 1: Create TagBadge component**

```tsx
// src/components/notes/TagBadge.tsx
import { Tag } from "@/lib/types";

interface TagBadgeProps {
  tag: Tag;
  onRemove?: () => void;
}

export function TagBadge({ tag, onRemove }: TagBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: tag.color + "20", color: tag.color }}
    >
      {tag.name}
      {onRemove && (
        <button onClick={onRemove} className="hover:opacity-70">
          ×
        </button>
      )}
    </span>
  );
}
```

- [ ] **Step 2: Create TagPicker component**

```tsx
// src/components/notes/TagPicker.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Tag } from "@/lib/types";
import { TagBadge } from "./TagBadge";

interface TagPickerProps {
  selectedTags: Tag[];
  availableTags: Tag[];
  onSelect: (tag: Tag) => void;
  onRemove: (tagId: string) => void;
  onCreate: (name: string) => void;
}

export function TagPicker({
  selectedTags,
  availableTags,
  onSelect,
  onRemove,
  onCreate,
}: TagPickerProps) {
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTags = availableTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(input.toLowerCase()) &&
      !selectedTags.some((s) => s.id === tag.id)
  );

  const handleSelect = (tag: Tag) => {
    onSelect(tag);
    setInput("");
    setIsOpen(false);
  };

  const handleCreate = () => {
    if (input.trim()) {
      onCreate(input.trim());
      setInput("");
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1 p-2 border border-ink-300 dark:border-ink-600 rounded-lg">
        {selectedTags.map((tag) => (
          <TagBadge key={tag.id} tag={tag} onRemove={() => onRemove(tag.id)} />
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="Add tag..."
          className="flex-1 min-w-[100px] bg-transparent outline-none"
        />
      </div>

      {isOpen && (filteredTags.length > 0 || input.trim()) && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-lg shadow-lg">
          {filteredTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => handleSelect(tag)}
              className="w-full px-3 py-2 text-left hover:bg-ink-100 dark:hover:bg-ink-700"
            >
              {tag.name}
            </button>
          ))}
          {input.trim() && (
            <button
              onClick={handleCreate}
              className="w-full px-3 py-2 text-left text-blue-500 hover:bg-ink-100 dark:hover:bg-ink-700"
            >
              Create "{input}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update notes page with tag support**

```tsx
// src/app/(protected)/notes/page.tsx
"use client";

import { useState } from "react";
import { FolderTree } from "@/components/notes/FolderTree";
import { TagPicker } from "@/components/notes/TagPicker";
import { Folder, Tag } from "@/lib/types";

export default function NotesPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  const handleCreateTag = (name: string) => {
    const newTag: Tag = {
      id: crypto.randomUUID(),
      name,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      userId: "current-user",
    };
    setTags([...tags, newTag]);
  };

  const handleSelectTag = (tag: Tag) => {
    setSelectedTags([...selectedTags, tag]);
  };

  const handleRemoveTag = (tagId: string) => {
    setSelectedTags(selectedTags.filter((t) => t.id !== tagId));
  };

  return (
    <div className="flex h-full">
      <div className="w-64 border-r border-ink-200 dark:border-ink-700 p-4">
        <FolderTree
          folders={folders}
          activeFolderId={activeFolderId}
          onSelectFolder={setActiveFolderId}
          onCreateFolder={(name, parentId) => {
            const newFolder: Folder = {
              id: crypto.randomUUID(),
              name,
              parentId,
              userId: "current-user",
              createdAt: new Date(),
            };
            setFolders([...folders, newFolder]);
          }}
          onRenameFolder={(folderId, name) => {
            setFolders(folders.map((f) => (f.id === folderId ? { ...f, name } : f)));
          }}
          onDeleteFolder={(folderId) => {
            setFolders(folders.filter((f) => f.id !== folderId));
          }}
        />
      </div>
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold mb-4">Notes</h1>
        <TagPicker
          selectedTags={selectedTags}
          availableTags={tags}
          onSelect={handleSelectTag}
          onRemove={handleRemoveTag}
          onCreate={handleCreateTag}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Test tag creation, selection, removal**

Run: `npm run dev`
Create tags, select for filtering, remove

- [ ] **Step 5: Commit**

Run: `git add src/components/notes/TagPicker.tsx src/components/notes/TagBadge.tsx src/app/\(protected\)/notes/page.tsx && git commit -m "feat: add tag system for note organization"`

---

### Task 8: Add Search and Sort

**Files:**
- Create: `src/components/notes/SearchBar.tsx`
- Create: `src/components/notes/SortDropdown.tsx`
- Create: `src/hooks/useSearch.ts`
- Modify: `src/app/(protected)/notes/page.tsx`

**Interfaces:**
- Produces: useSearch hook, SearchBar, SortDropdown components

- [ ] **Step 1: Create useSearch hook**

```typescript
// src/hooks/useSearch.ts
"use client";

import { useState, useMemo } from "react";
import { Note } from "@/lib/types";

interface UseSearchOptions {
  notes: Note[];
  searchQuery: string;
  sortBy: "updatedAt" | "createdAt" | "title";
  sortDirection: "asc" | "desc";
  filterFolderId: string | null;
  filterTagIds: string[];
}

export function useSearch({
  notes,
  searchQuery,
  sortBy,
  sortDirection,
  filterFolderId,
  filterTagIds,
}: UseSearchOptions) {
  const filteredNotes = useMemo(() => {
    let result = [...notes];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query)
      );
    }

    if (filterFolderId) {
      result = result.filter((note) => note.folderId === filterFolderId);
    }

    if (filterTagIds.length > 0) {
      result = result.filter((note) =>
        filterTagIds.some((tagId) => note.tags.some((t) => t.id === tagId))
      );
    }

    result.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [notes, searchQuery, sortBy, sortDirection, filterFolderId, filterTagIds]);

  return filteredNotes;
}
```

- [ ] **Step 2: Create SearchBar component**

```tsx
// src/components/notes/SearchBar.tsx
"use client";

import { SearchIcon, XIcon } from "@/components/icons";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search notes..."
        className="w-full pl-10 pr-8 py-2 bg-ink-100 dark:bg-ink-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <XIcon />
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create SortDropdown component**

```tsx
// src/components/notes/SortDropdown.tsx
"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/icons";

interface SortDropdownProps {
  sortBy: "updatedAt" | "createdAt" | "title";
  sortDirection: "asc" | "desc";
  onSortChange: (sortBy: string, direction: string) => void;
}

export function SortDropdown({
  sortBy,
  sortDirection,
  onSortChange,
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { value: "updatedAt-desc", label: "Last Modified" },
    { value: "createdAt-desc", label: "Newest" },
    { value: "createdAt-asc", label: "Oldest" },
    { value: "title-asc", label: "Title A-Z" },
    { value: "title-desc", label: "Title Z-A" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-ink-100 dark:bg-ink-800 rounded-lg"
      >
        Sort
        <ChevronDownIcon />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-1 w-48 bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-lg shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                const [sort, dir] = option.value.split("-");
                onSortChange(sort, dir);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left hover:bg-ink-100 dark:hover:bg-ink-700"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add icons for search**

```tsx
// src/components/icons/index.tsx (append)
export function SearchIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

export function XIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
```

- [ ] **Step 5: Integrate search and sort in notes page**

```tsx
// src/app/(protected)/notes/page.tsx
// Add imports and state:
import { SearchBar } from "@/components/notes/SearchBar";
import { SortDropdown } from "@/components/notes/SortDropdown";
import { useSearch } from "@/hooks/useSearch";

// Add state:
const [searchQuery, setSearchQuery] = useState("");
const [sortBy, setSortBy] = useState<"updatedAt" | "createdAt" | "title">("updatedAt");
const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

// Add filtered notes:
const filteredNotes = useSearch({
  notes: [], // will be populated with actual notes
  searchQuery,
  sortBy,
  sortDirection,
  filterFolderId: activeFolderId,
  filterTagIds: selectedTags.map((t) => t.id),
});

// Update header:
<div className="flex items-center gap-4 mb-4">
  <SearchBar value={searchQuery} onChange={setSearchQuery} />
  <SortDropdown
    sortBy={sortBy}
    sortDirection={sortDirection}
    onSortChange={(sort, dir) => {
      setSortBy(sort as typeof sortBy);
      setSortDirection(dir as typeof sortDirection);
    }}
  />
</div>
```

- [ ] **Step 6: Test search filtering and sort options**

Run: `npm run dev`
Search notes, change sort order, verify filtering

- [ ] **Step 7: Commit**

Run: `git add src/components/notes/SearchBar.tsx src/components/notes/SortDropdown.tsx src/hooks/useSearch.ts src/components/icons/index.tsx src/app/\(protected\)/notes/page.tsx && git commit -m "feat: add search and sort functionality"`

---

## Phase 4: Rich Text Editor

### Task 9: Install TipTap Extensions

**Files:**
- Modify: `package.json` (already done in Task 1)

- [ ] **Step 1: Verify TipTap packages installed**

Run: `npm ls @tiptap/react @tiptap/starter-kit`

Expected output should show installed versions

- [ ] **Step 2: Create editor styles**

```css
/* src/components/editor/editor-styles.css */
.tiptap {
  outline: none;
  min-height: 200px;
}

.tiptap p.is-editor-empty:first-child::before {
  color: #acacbe;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.tiptap h1 {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.tiptap h2 {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.tiptap h3 {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.tiptap ul {
  list-style-type: disc;
  padding-left: 1.5rem;
}

.tiptap ol {
  list-style-type: decimal;
  padding-left: 1.5rem;
}

.tiptap blockquote {
  border-left: 3px solid #d9d9e3;
  padding-left: 1rem;
  margin-left: 0;
  color: #565869;
}

.tiptap pre {
  background: #1a1a2e;
  color: #f7f7f8;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
}

.tiptap code {
  background: #d9d9e3;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-family: monospace;
}

.tiptap pre code {
  background: none;
  padding: 0;
}

.tiptap table {
  border-collapse: collapse;
  width: 100%;
}

.tiptap th,
.tiptap td {
  border: 1px solid #d9d9e3;
  padding: 0.5rem;
  text-align: left;
}

.tiptap th {
  background: #f7f7f8;
  font-weight: bold;
}

.tiptap ul[data-type="taskList"] {
  list-style: none;
  padding-left: 0;
}

.tiptap ul[data-type="taskList"] li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tiptap ul[data-type="taskList"] li input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
}
```

- [ ] **Step 3: Commit**

Run: `git add src/components/editor/editor-styles.css && git commit -m "feat: add TipTap editor styles"`

---

### Task 10: Create TipTap Editor Component

**Files:**
- Create: `src/components/editor/TipTapEditor.tsx`
- Create: `src/components/editor/EditorToolbar.tsx`

**Interfaces:**
- Consumes: TipTap extensions
- Produces: TipTapEditor component with toolbar

- [ ] **Step 1: Create EditorToolbar component**

```tsx
// src/components/editor/EditorToolbar.tsx
"use client";

import { Editor } from "@tiptap/react";
import {
  BoldIcon,
  ItalicIcon,
  HeadingIcon,
  ListIcon,
  ListOrderedIcon,
  CodeIcon,
  QuoteIcon,
  TableIcon,
  UndoIcon,
  RedoIcon,
} from "@/components/icons";

interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-1 p-2 border-b border-ink-200 dark:border-ink-700 flex-wrap">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        icon={<BoldIcon />}
        tooltip="Bold (Ctrl+B)"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        icon={<ItalicIcon />}
        tooltip="Italic (Ctrl+I)"
      />
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        isActive={editor.isActive("heading", { level: 2 })}
        icon={<HeadingIcon />}
        tooltip="Heading"
      />
      <div className="w-px h-6 bg-ink-300 dark:bg-ink-600 mx-1" />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        icon={<ListIcon />}
        tooltip="Bullet List"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        icon={<ListOrderedIcon />}
        tooltip="Ordered List"
      />
      <div className="w-px h-6 bg-ink-300 dark:bg-ink-600 mx-1" />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive("codeBlock")}
        icon={<CodeIcon />}
        tooltip="Code Block"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        icon={<QuoteIcon />}
        tooltip="Quote"
      />
      <ToolbarButton
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
        isActive={false}
        icon={<TableIcon />}
        tooltip="Insert Table"
      />
      <div className="flex-1" />
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        isActive={false}
        icon={<UndoIcon />}
        tooltip="Undo (Ctrl+Z)"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        isActive={false}
        icon={<RedoIcon />}
        tooltip="Redo (Ctrl+Shift+Z)"
      />
    </div>
  );
}

function ToolbarButton({
  onClick,
  isActive,
  icon,
  tooltip,
}: {
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  tooltip: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded ${
        isActive
          ? "bg-ink-200 dark:bg-ink-700"
          : "hover:bg-ink-100 dark:hover:bg-ink-800"
      }`}
      title={tooltip}
    >
      {icon}
    </button>
  );
}
```

- [ ] **Step 2: Create TipTapEditor component**

```tsx
// src/components/editor/TipTapEditor.tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Table from "@tiptap/extension-table";
import TaskList from "@tiptap/extension-task-list";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorToolbar } from "./EditorToolbar";
import "./editor-styles.css";

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = "Start writing...",
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({
        resizable: true,
      }),
      TaskList,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4",
      },
    },
  });

  return (
    <div className="border border-ink-200 dark:border-ink-700 rounded-lg overflow-hidden">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
```

- [ ] **Step 3: Add toolbar icons**

```tsx
// src/components/icons/index.tsx (append)
export function BoldIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
    </svg>
  );
}

export function ItalicIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4m-2 0l-4 16m-2 0h4" />
    </svg>
  );
}

export function HeadingIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6v12M20 6v12M4 12h16" />
    </svg>
  );
}

export function ListIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

export function ListOrderedIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6h11M10 12h11M10 18h11M3 5l2 1V4M3 11l2 2-2 2M3 17l2 2-2 2" />
    </svg>
  );
}

export function CodeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}

export function QuoteIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

export function TableIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M14 3v18" />
    </svg>
  );
}

export function UndoIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  );
}

export function RedoIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
    </svg>
  );
}
```

- [ ] **Step 4: Test editor renders with toolbar**

Run: `npm run dev`
Add TipTapEditor to notes page, verify toolbar and editing works

- [ ] **Step 5: Commit**

Run: `git add src/components/editor/ && git commit -m "feat: add TipTap rich text editor with toolbar"`

---

### Task 11: Integrate Editor with Notes

**Files:**
- Modify: `src/app/(protected)/notes/page.tsx`
- Create: `src/app/(protected)/notes/[id]/page.tsx`

**Interfaces:**
- Consumes: TipTapEditor component
- Produces: Note editing page

- [ ] **Step 1: Create note detail page**

```tsx
// src/app/(protected)/notes/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { TipTapEditor } from "@/components/editor/TipTapEditor";
import { TagPicker } from "@/components/notes/TagPicker";
import { Note, Tag } from "@/lib/types";

export default function NoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Simulated note loading
    const mockNote: Note = {
      id: params.id as string,
      title: "Sample Note",
      content: "",
      folderId: null,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: "current-user",
    };
    setNote(mockNote);
    setTitle(mockNote.title);
    setContent(mockNote.content);
    setTags(mockNote.tags);
  }, [params.id]);

  const handleSave = async () => {
    setIsSaving(true);
    // Save logic here
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleCreateTag = (name: string) => {
    const newTag: Tag = {
      id: crypto.randomUUID(),
      name,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      userId: "current-user",
    };
    setAvailableTags([...availableTags, newTag]);
    setTags([...tags, newTag]);
  };

  if (!note) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.push("/notes")}
          className="text-ink-500 hover:text-ink-700"
        >
          ← Back to Notes
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title"
        className="w-full text-3xl font-bold mb-4 bg-transparent outline-none"
      />

      <div className="mb-4">
        <TagPicker
          selectedTags={tags}
          availableTags={availableTags}
          onSelect={(tag) => setTags([...tags, tag])}
          onRemove={(tagId) => setTags(tags.filter((t) => t.id !== tagId))}
          onCreate={handleCreateTag}
        />
      </div>

      <TipTapEditor
        content={content}
        onChange={setContent}
        placeholder="Start writing your note..."
      />
    </div>
  );
}
```

- [ ] **Step 2: Update notes page to list notes**

```tsx
// src/app/(protected)/notes/page.tsx
// Add note list UI
<div className="flex-1 p-4">
  <div className="flex items-center justify-between mb-4">
    <h1 className="text-2xl font-bold">Notes</h1>
    <button
      onClick={() => router.push(`/notes/${crypto.randomUUID()}`)}
      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
    >
      New Note
    </button>
  </div>

  {/* Note list will go here */}
</div>
```

- [ ] **Step 3: Test note creation and editing flow**

Run: `npm run dev`
Create new note, edit title and content, save

- [ ] **Step 4: Commit**

Run: `git add src/app/\(protected\)/notes/ && git commit -m "feat: integrate editor with note pages"`

---

## Phase 5: Export & Sharing

### Task 12: Create Export Utility

**Files:**
- Create: `src/lib/export-utils.ts`
- Create: `src/components/sharing/ExportModal.tsx`

**Interfaces:**
- Produces: exportNote function, ExportModal component

- [ ] **Step 1: Create export utility**

```typescript
// src/lib/export-utils.ts
import TurndownService from "turndown";

const turndown = new TurndownService();

export type ExportFormat = "pdf" | "markdown" | "html" | "text";

export async function exportNote(
  content: string,
  title: string,
  format: ExportFormat
): Promise<void> {
  const htmlContent = convertTipTapToHtml(content);

  switch (format) {
    case "pdf":
      await exportAsPdf(htmlContent, title);
      break;
    case "markdown":
      exportAsMarkdown(htmlContent, title);
      break;
    case "html":
      exportAsHtml(htmlContent, title);
      break;
    case "text":
      exportAsText(htmlContent, title);
      break;
  }
}

function convertTipTapToHtml(jsonContent: string): string {
  try {
    const json = JSON.parse(jsonContent);
    return convertNodeToHtml(json);
  } catch {
    return jsonContent;
  }
}

function convertNodeToHtml(node: any): string {
  if (node.type === "text") {
    return node.text || "";
  }

  const children = (node.content || []).map(convertNodeToHtml).join("");

  switch (node.type) {
    case "paragraph":
      return `<p>${children}</p>`;
    case "heading":
      return `<h${node.attrs?.level || 1}>${children}</h${node.attrs?.level || 1}>`;
    case "bulletList":
      return `<ul>${children}</ul>`;
    case "orderedList":
      return `<ol>${children}</ol>`;
    case "listItem":
      return `<li>${children}</li>`;
    case "blockquote":
      return `<blockquote>${children}</blockquote>`;
    case "codeBlock":
      return `<pre><code>${children}</code></pre>`;
    case "table":
      return `<table>${children}</table>`;
    case "tableRow":
      return `<tr>${children}</tr>`;
    case "tableCell":
      return `<td>${children}</td>`;
    case "tableHeader":
      return `<th>${children}</th>`;
    default:
      return children;
  }
}

async function exportAsPdf(html: string, title: string) {
  const html2pdf = (await import("html2pdf.js")).default;
  const element = document.createElement("div");
  element.innerHTML = `<h1>${title}</h1>${html}`;
  element.style.padding = "20px";

  await html2pdf()
    .set({
      margin: 1,
      filename: `${title}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    })
    .from(element)
    .save();
}

function exportAsMarkdown(html: string, title: string) {
  const markdown = turndown.turndown(html);
  downloadFile(`${title}.md`, markdown, "text/markdown");
}

function exportAsHtml(html: string, title: string) {
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { border-bottom: 1px solid #ccc; padding-bottom: 10px; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 4px; }
    code { background: #f5f5f5; padding: 2px 4px; border-radius: 2px; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${html}
</body>
</html>`;
  downloadFile(`${title}.html`, fullHtml, "text/html");
}

function exportAsText(html: string, title: string) {
  const text = html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  downloadFile(`${title}.txt`, `${title}\n\n${text}`, "text/plain");
}

function downloadFile(
  filename: string,
  content: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Create ExportModal component**

```tsx
// src/components/sharing/ExportModal.tsx
"use client";

import { useState } from "react";
import { exportNote, ExportFormat } from "@/lib/export-utils";
import { XIcon, DownloadIcon, FileTextIcon, FileIcon, CodeIcon, FilePdfIcon } from "@/components/icons";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteContent: string;
  noteTitle: string;
}

export function ExportModal({
  isOpen,
  onClose,
  noteContent,
  noteTitle,
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pdf");
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const formats: { value: ExportFormat; label: string; icon: React.ReactNode }[] = [
    { value: "pdf", label: "PDF Document", icon: <FilePdfIcon /> },
    { value: "markdown", label: "Markdown", icon: <FileTextIcon /> },
    { value: "html", label: "HTML Page", icon: <CodeIcon /> },
    { value: "text", label: "Plain Text", icon: <FileIcon /> },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    await exportNote(noteContent, noteTitle, selectedFormat);
    setIsExporting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-white dark:bg-ink-800 rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-ink-200 dark:border-ink-700">
          <h2 className="text-lg font-semibold">Export Note</h2>
          <button onClick={onClose} className="p-1 hover:bg-ink-100 dark:hover:bg-ink-700 rounded">
            <XIcon />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {formats.map((format) => (
            <button
              key={format.value}
              onClick={() => setSelectedFormat(format.value)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border ${
                selectedFormat === format.value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-ink-200 dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-700"
              }`}
            >
              {format.icon}
              <span>{format.label}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-ink-200 dark:border-ink-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            <DownloadIcon />
            {isExporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add export icons**

```tsx
// src/components/icons/index.tsx (append)
export function DownloadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

export function FileTextIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

export function FileIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

export function FilePdfIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v6h6" />
    </svg>
  );
}
```

- [ ] **Step 4: Test export in different formats**

Run: `npm run dev`
Open ExportModal, test each format, verify files download

- [ ] **Step 5: Commit**

Run: `git add src/lib/export-utils.ts src/components/sharing/ExportModal.tsx src/components/icons/index.tsx && git commit -m "feat: add note export functionality"`

---

### Task 13: Add Share via Link

**Files:**
- Create: `src/components/sharing/ShareModal.tsx`
- Create: `src/lib/firebase-sharing.ts`

**Interfaces:**
- Consumes: SharedNote type
- Produces: ShareModal component

- [ ] **Step 1: Create Firebase sharing utility**

```typescript
// src/lib/firebase-sharing.ts
import { SharedNote } from "./types";

export async function createShareLink(
  noteId: string,
  permission: "view" | "edit",
  expiresAt?: Date
): Promise<SharedNote> {
  const shareToken = generateToken();
  const sharedNote: SharedNote = {
    id: crypto.randomUUID(),
    noteId,
    shareToken,
    permission,
    expiresAt: expiresAt || null,
    createdAt: new Date(),
  };

  // Save to Firebase
  // await setDoc(doc(db, "sharedNotes", sharedNote.id), sharedNote);

  return sharedNote;
}

export async function getSharedNote(shareToken: string): Promise<SharedNote | null> {
  // Fetch from Firebase
  // const q = query(collection(db, "sharedNotes"), where("shareToken", "==", shareToken));
  // const snapshot = await getDocs(q);
  // if (snapshot.empty) return null;
  // return snapshot.docs[0].data() as SharedNote;

  return null;
}

export function generateShareUrl(shareToken: string): string {
  return `${window.location.origin}/shared/${shareToken}`;
}

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 21; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
```

- [ ] **Step 2: Create ShareModal component**

```tsx
// src/components/sharing/ShareModal.tsx
"use client";

import { useState } from "react";
import { createShareLink, generateShareUrl } from "@/lib/firebase-sharing";
import { XIcon, CopyIcon, CheckIcon, LinkIcon, UsersIcon } from "@/components/icons";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  noteTitle: string;
}

export function ShareModal({
  isOpen,
  onClose,
  noteId,
  noteTitle,
}: ShareModalProps) {
  const [permission, setPermission] = useState<"view" | "edit">("view");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreateLink = async () => {
    setIsCreating(true);
    const sharedNote = await createShareLink(noteId, permission);
    const url = generateShareUrl(sharedNote.shareToken);
    setShareUrl(url);
    setIsCreating(false);
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-white dark:bg-ink-800 rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-ink-200 dark:border-ink-700">
          <h2 className="text-lg font-semibold">Share "{noteTitle}"</h2>
          <button onClick={onClose} className="p-1 hover:bg-ink-100 dark:hover:bg-ink-700 rounded">
            <XIcon />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Permission</label>
            <div className="flex gap-2">
              <button
                onClick={() => setPermission("view")}
                className={`flex-1 py-2 rounded-lg border ${
                  permission === "view"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-ink-200 dark:border-ink-700"
                }`}
              >
                <UsersIcon className="w-4 h-4 mx-auto mb-1" />
                View Only
              </button>
              <button
                onClick={() => setPermission("edit")}
                className={`flex-1 py-2 rounded-lg border ${
                  permission === "edit"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-ink-200 dark:border-ink-700"
                }`}
              >
                <UsersIcon className="w-4 h-4 mx-auto mb-1" />
                Can Edit
              </button>
            </div>
          </div>

          {shareUrl ? (
            <div>
              <label className="block text-sm font-medium mb-2">Share Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-ink-100 dark:bg-ink-700 rounded-lg text-sm"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 bg-ink-200 dark:bg-ink-600 rounded-lg hover:bg-ink-300 dark:hover:bg-ink-500"
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleCreateLink}
              disabled={isCreating}
              className="w-full flex items-center justify-center gap-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <LinkIcon />
              {isCreating ? "Creating..." : "Generate Share Link"}
            </button>
          )}
        </div>

        <div className="flex justify-end p-4 border-t border-ink-200 dark:border-ink-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-700 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add sharing icons**

```tsx
// src/components/icons/index.tsx (append)
export function CopyIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function LinkIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

export function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
```

- [ ] **Step 4: Test share link creation and copy**

Run: `npm run dev`
Open ShareModal, generate link, copy to clipboard

- [ ] **Step 5: Commit**

Run: `git add src/components/sharing/ShareModal.tsx src/lib/firebase-sharing.ts src/components/icons/index.tsx && git commit -m "feat: add share via link functionality"`

---

## Phase 6: Collaboration & Real-time

### Task 14: Add Real-time Collaboration Hook

**Files:**
- Create: `src/hooks/useCollaboration.ts`
- Create: `src/lib/firebase-collaboration.ts`

**Interfaces:**
- Consumes: Firebase Realtime Database
- Produces: useCollaboration hook

- [ ] **Step 1: Create Firebase collaboration utility**

```typescript
// src/lib/firebase-collaboration.ts
import { ref, onValue, set, serverTimestamp, Unsubscribe } from "firebase/database";
import { database } from "./firebase";

interface Presence {
  userId: string;
  displayName: string;
  photoURL: string | null;
  cursor?: { line: number; character: number };
  lastSeen: number;
}

export function subscribeToNotePresence(
  noteId: string,
  callback: (users: Presence[]) => void
): Unsubscribe {
  const presenceRef = ref(database, `notePresence/${noteId}`);

  return onValue(presenceRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const users = Object.values(data) as Presence[];
      callback(users.filter((u) => Date.now() - u.lastSeen < 30000));
    } else {
      callback([]);
    }
  });
}

export async function updatePresence(
  noteId: string,
  userId: string,
  presence: Partial<Presence>
): Promise<void> {
  const presenceRef = ref(database, `notePresence/${noteId}/${userId}`);
  await set(presenceRef, {
    ...presence,
    userId,
    lastSeen: Date.now(),
  });
}

export async function updateCursor(
  noteId: string,
  userId: string,
  cursor: { line: number; character: number }
): Promise<void> {
  const cursorRef = ref(database, `notePresence/${noteId}/${userId}/cursor`);
  await set(cursorRef, cursor);
}

export function subscribeToNoteContent(
  noteId: string,
  callback: (content: string) => void
): Unsubscribe {
  const contentRef = ref(database, `noteContent/${noteId}`);

  return onValue(contentRef, (snapshot) => {
    const content = snapshot.val();
    callback(content || "");
  });
}

export async function updateNoteContent(
  noteId: string,
  content: string
): Promise<void> {
  const contentRef = ref(database, `noteContent/${noteId}`);
  await set(contentRef, {
    content,
    updatedAt: Date.now(),
  });
}
```

- [ ] **Step 2: Create useCollaboration hook**

```typescript
// src/hooks/useCollaboration.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  subscribeToNotePresence,
  updatePresence,
  updateCursor,
  subscribeToNoteContent,
  updateNoteContent,
} from "@/lib/firebase-collaboration";
import { useAuth } from "@/lib/auth-context";

interface Presence {
  userId: string;
  displayName: string;
  photoURL: string | null;
  cursor?: { line: number; character: number };
  lastSeen: number;
}

export function useCollaboration(noteId: string) {
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState<Presence[]>([]);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!user || !noteId) return;

    const unsubscribePresence = subscribeToNotePresence(
      noteId,
      setActiveUsers
    );

    const unsubscribeContent = subscribeToNoteContent(noteId, (newContent) => {
      setContent(newContent);
    });

    updatePresence(noteId, user.uid, {
      displayName: user.displayName || "Anonymous",
      photoURL: user.photoURL,
    });

    return () => {
      unsubscribePresence();
      unsubscribeContent();
    };
  }, [noteId, user]);

  const moveCursor = useCallback(
    (line: number, character: number) => {
      if (!user || !noteId) return;
      updateCursor(noteId, user.uid, { line, character });
    },
    [noteId, user]
  );

  const saveContent = useCallback(
    async (newContent: string) => {
      if (!noteId) return;
      await updateNoteContent(noteId, newContent);
    },
    [noteId]
  );

  return {
    activeUsers,
    content,
    moveCursor,
    saveContent,
  };
}
```

- [ ] **Step 3: Test collaboration presence indicators**

Run: `npm run dev`
Open note in two browser tabs, verify presence shows

- [ ] **Step 4: Commit**

Run: `git add src/hooks/useCollaboration.ts src/lib/firebase-collaboration.ts && git commit -m "feat: add real-time collaboration hooks"`

---

## Phase 7: Keyboard Shortcuts & Command Palette

### Task 15: Add Keyboard Shortcuts

**Files:**
- Create: `src/hooks/useKeyboardShortcuts.ts`
- Create: `src/components/ui/KeyboardShortcutsModal.tsx`

**Interfaces:**
- Produces: useKeyboardShortcuts hook, KeyboardShortcutsModal

- [ ] **Step 1: Create useKeyboardShortcuts hook**

```typescript
// src/hooks/useKeyboardShortcuts.ts
"use client";

import { useEffect } from "react";

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const matchingShortcut = shortcuts.find((shortcut) => {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl
          ? e.ctrlKey || e.metaKey
          : !(e.ctrlKey || e.metaKey);
        const shiftMatch = shortcut.shift
          ? e.shiftKey
          : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;

        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (matchingShortcut) {
        e.preventDefault();
        matchingShortcut.action();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

export const defaultShortcuts: Omit<Shortcut, "action">[] = [
  { key: "n", ctrl: true, description: "New note" },
  { key: "s", ctrl: true, description: "Save note" },
  { key: "k", ctrl: true, description: "Command palette" },
  { key: "b", ctrl: true, description: "Bold" },
  { key: "i", ctrl: true, description: "Italic" },
  { key: "h", ctrl: true, shift: true, description: "Heading" },
  { key: "Escape", description: "Close modal" },
];
```

- [ ] **Step 2: Create KeyboardShortcutsModal**

```tsx
// src/components/ui/KeyboardShortcutsModal.tsx
"use client";

import { XIcon } from "@/components/icons";
import { defaultShortcuts } from "@/hooks/useKeyboardShortcuts";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const formatShortcut = (shortcut: typeof defaultShortcuts[0]) => {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push("Ctrl");
    if (shortcut.shift) parts.push("Shift");
    if (shortcut.alt) parts.push("Alt");
    parts.push(shortcut.key.toUpperCase());
    return parts.join(" + ");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-white dark:bg-ink-800 rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-ink-200 dark:border-ink-700">
          <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="p-1 hover:bg-ink-100 dark:hover:bg-ink-700 rounded">
            <XIcon />
          </button>
        </div>

        <div className="p-4">
          <div className="space-y-2">
            {defaultShortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2"
              >
                <span className="text-ink-700 dark:text-ink-300">
                  {shortcut.description}
                </span>
                <kbd className="px-2 py-1 text-xs font-mono bg-ink-100 dark:bg-ink-700 rounded">
                  {formatShortcut(shortcut)}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-ink-200 dark:border-ink-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-700 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Test shortcuts open modals**

Run: `npm run dev`
Press Cmd+K, verify shortcuts modal opens

- [ ] **Step 4: Commit**

Run: `git add src/hooks/useKeyboardShortcuts.ts src/components/ui/KeyboardShortcutsModal.tsx && git commit -m "feat: add keyboard shortcuts system"`

---

### Task 16: Create Command Palette

**Files:**
- Create: `src/components/ui/CommandPalette.tsx`
- Modify: `src/app/(protected)/layout.tsx`

**Interfaces:**
- Consumes: useKeyboardShortcuts
- Produces: CommandPalette component

- [ ] **Step 1: Create CommandPalette component**

```tsx
// src/components/ui/CommandPalette.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, NoteIcon, SettingsIcon, XIcon } from "@/components/icons";

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    {
      id: "new-note",
      label: "New Note",
      icon: <NoteIcon />,
      action: () => {
        router.push(`/notes/${crypto.randomUUID()}`);
        onClose();
      },
      category: "Notes",
    },
    {
      id: "all-notes",
      label: "All Notes",
      icon: <NoteIcon />,
      action: () => {
        router.push("/notes");
        onClose();
      },
      category: "Navigation",
    },
    {
      id: "settings",
      label: "Settings",
      icon: <SettingsIcon />,
      action: () => {
        router.push("/settings");
        onClose();
      },
      category: "Navigation",
    },
  ];

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50">
      <div className="w-full max-w-lg bg-white dark:bg-ink-800 rounded-lg shadow-xl overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-ink-200 dark:border-ink-700">
          <SearchIcon className="w-5 h-5 text-ink-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command..."
            className="flex-1 bg-transparent outline-none"
          />
          <button onClick={onClose} className="text-ink-400 hover:text-ink-600">
            <XIcon />
          </button>
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-4 text-center text-ink-500">No commands found</div>
          ) : (
            filteredCommands.map((command) => (
              <button
                key={command.id}
                onClick={command.action}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-ink-100 dark:hover:bg-ink-700"
              >
                {command.icon}
                <div className="text-left">
                  <div className="font-medium">{command.label}</div>
                  <div className="text-xs text-ink-500">{command.category}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Integrate CommandPalette in layout**

```tsx
// src/app/(protected)/layout.tsx
"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useKeyboardShortcuts([
    {
      key: "k",
      ctrl: true,
      action: () => setIsCommandPaletteOpen(true),
      description: "Command palette",
    },
  ]);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-auto">
        <header className="flex items-center justify-end p-4 border-b border-ink-200 dark:border-ink-700">
          <ThemeToggle />
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
      </main>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}
```

- [ ] **Step 3: Test command palette opens with Cmd+K**

Run: `npm run dev`
Press Cmd+K, type command, verify navigation works

- [ ] **Step 4: Commit**

Run: `git add src/components/ui/CommandPalette.tsx src/app/\(protected\)/layout.tsx && git commit -m "feat: add command palette"`

---

## Phase 8: Mobile Responsive

### Task 17: Add Mobile Navigation

**Files:**
- Create: `src/components/layout/MobileNav.tsx`
- Modify: `src/app/(protected)/layout.tsx`

**Interfaces:**
- Produces: MobileNav component with bottom navigation

- [ ] **Step 1: Create MobileNav component**

```tsx
// src/components/layout/MobileNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NoteIcon, SettingsIcon, PlusIcon } from "@/components/icons";

export function MobileNav() {
  const pathname = usePathname();

  const items = [
    { href: "/notes", icon: <NoteIcon />, label: "Notes" },
    { href: "/notes/new", icon: <PlusIcon />, label: "New", isAction: true },
    { href: "/settings", icon: <SettingsIcon />, label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-ink-900 border-t border-ink-200 dark:border-ink-700 md:hidden z-40">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full ${
              item.isAction
                ? "text-blue-500"
                : pathname === item.href
                ? "text-blue-500"
                : "text-ink-500"
            }`}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Add PlusIcon**

```tsx
// src/components/icons/index.tsx (append)
export function PlusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}
```

- [ ] **Step 3: Update layout for mobile**

```tsx
// src/app/(protected)/layout.tsx
"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useKeyboardShortcuts([
    {
      key: "k",
      ctrl: true,
      action: () => setIsCommandPaletteOpen(true),
      description: "Command palette",
    },
  ]);

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64">
            <Sidebar />
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-auto pb-16 md:pb-0">
        <header className="flex items-center p-4 border-b border-ink-200 dark:border-ink-700">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 mr-2 hover:bg-ink-100 dark:hover:bg-ink-700 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1" />
          <ThemeToggle />
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
      </main>

      <MobileNav />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}
```

- [ ] **Step 4: Test mobile navigation and sidebar**

Run: `npm run dev`
Resize to mobile width, verify bottom nav and sidebar overlay work

- [ ] **Step 5: Commit**

Run: `git add src/components/layout/MobileNav.tsx src/app/\(protected\)/layout.tsx && git commit -m "feat: add mobile navigation and responsive layout"`

---

### Task 18: Make Editor Mobile Responsive

**Files:**
- Modify: `src/components/editor/EditorToolbar.tsx`
- Modify: `src/components/editor/TipTapEditor.tsx`

- [ ] **Step 1: Update EditorToolbar for mobile**

```tsx
// src/components/editor/EditorToolbar.tsx
// Add responsive classes to toolbar
<div className="flex items-center gap-1 p-2 border-b border-ink-200 dark:border-ink-700 overflow-x-auto">
  {/* Existing buttons */}
</div>

// Make toolbar buttons larger on mobile
function ToolbarButton({ onClick, isActive, icon, tooltip }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 sm:p-1.5 rounded min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 ${
        isActive
          ? "bg-ink-200 dark:bg-ink-700"
          : "hover:bg-ink-100 dark:hover:bg-ink-800"
      }`}
      title={tooltip}
    >
      {icon}
    </button>
  );
}
```

- [ ] **Step 2: Update TipTapEditor for mobile**

```tsx
// src/components/editor/TipTapEditor.tsx
<div className="border border-ink-200 dark:border-ink-700 rounded-lg overflow-hidden">
  <EditorToolbar editor={editor} />
  <div className="min-h-[300px] sm:min-h-[200px]">
    <EditorContent editor={editor} />
  </div>
</div>
```

- [ ] **Step 3: Test editor on mobile viewport**

Run: `npm run dev`
Resize to mobile, verify toolbar scrolls and editor is usable

- [ ] **Step 4: Commit**

Run: `git add src/components/editor/EditorToolbar.tsx src/components/editor/TipTapEditor.tsx && git commit -m "feat: make editor mobile responsive"`

---

### Task 19: Add Breadcrumbs

**Files:**
- Create: `src/components/layout/Breadcrumbs.tsx`
- Modify: `src/app/(protected)/notes/[id]/page.tsx`

- [ ] **Step 1: Create Breadcrumbs component**

```tsx
// src/components/layout/Breadcrumbs.tsx
"use client";

import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center text-sm text-ink-500 mb-4 overflow-x-auto">
      {items.map((item, index) => (
        <span key={index} className="flex items-center whitespace-nowrap">
          {index > 0 && <ChevronRightIcon className="w-4 h-4 mx-1" />}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-ink-700 dark:hover:text-ink-300"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-ink-700 dark:text-ink-300 font-medium">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Add Breadcrumbs to note detail page**

```tsx
// src/app/(protected)/notes/[id]/page.tsx
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

// In the component:
<Breadcrumbs
  items={[
    { label: "Notes", href: "/notes" },
    { label: note?.title || "Untitled" },
  ]}
/>
```

- [ ] **Step 3: Test breadcrumbs navigation**

Run: `npm run dev`
Navigate to note, verify breadcrumbs show and links work

- [ ] **Step 4: Commit**

Run: `git add src/components/layout/Breadcrumbs.tsx src/app/\(protected\)/notes/\[id\]/page.tsx && git commit -m "feat: add breadcrumbs navigation"`

---

## Summary

All 19 tasks complete the feature enhancements:

1. ✅ Dependencies installed
2. ✅ Theme system configured
3. ✅ Favicon updated
4. ✅ Sidebar navigation
5. ✅ Theme toggle
6. ✅ Folder system
7. ✅ Tag system
8. ✅ Search and sort
9. ✅ TipTap editor styles
10. ✅ TipTap editor component
11. ✅ Editor integration
12. ✅ Export functionality
13. ✅ Share via link
14. ✅ Real-time collaboration
15. ✅ Keyboard shortcuts
16. ✅ Command palette
17. ✅ Mobile navigation
18. ✅ Mobile editor
19. ✅ Breadcrumbs

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-05-chatmat-features.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
