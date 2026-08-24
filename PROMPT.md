# Chatmat — Continuation Prompt

Copy everything below this line into a new AI session to continue the work.

---

You are continuing development of **Chatmat**, a simple, fast Chat + Notes web app, located at:

```
C:\Users\admin\Documents\My Web Sites\ChatMat   (git repo, branch main)
```

## Hard rules
- Do NOT copy the design/branding of munderdiffl.in (it was only inspiration for "simple chat/workspace").
- Do NOT add MongoDB, PostgreSQL, Redis or any other database. Firebase Auth + Cloud Firestore + Firebase Storage only.
- Do NOT turn this into a multi-agent/AI system. Keep it simple: Chat + Notes (+ Dashboard + Settings).
- Keep Firebase logic inside `src/services/*` — React components must not contain raw Firestore calls.
- Do not over-engineer. No state libraries. Minimal new dependencies (none are expected).
- Preserve what exists; do not rewrite working files unless fixing a bug.

## Stack (already installed, node_modules present)
- Next.js 14 (App Router) + TypeScript + React 18 + Tailwind CSS 3.4
- firebase@10.x — project `chatmat-752f4` (config already in `.env.local`, keys prefixed `NEXT_PUBLIC_FIREBASE_*`)
- Legacy static HTML app moved to `legacy/` — ignore it.

## Firestore data model (already implemented in services)
```
users/{uid}                     { displayName, email, photoURL, displayNameLower, emailLower, createdAt, updatedAt }
users/{uid}/notes/{noteId}      { title, content, pinned, archived, createdAt, updatedAt }
conversations/{id}              { type:"direct"|"group", name?, participantIds:[], lastMessage:{text,senderId,at}, readAt:{[uid]:ms}, createdAt, updatedAt }
conversations/{id}/messages/{messageId} { senderId, text, file?{url,name,size,type}, deleted, edited, editedAt?, createdAt: serverTimestamp() }
```
Key decisions already made:
- Direct conversation doc IDs are deterministic: `dm_<uidA>_<uidB>` sorted → no duplicates (`directConversationId()` in `services/chat.ts`).
- Unread = `lastMessage.at > readAt[myUid]`; `markConversationRead()` updates the map when a chat is open.
- Message pagination = realtime listener with `orderBy(createdAt asc)` + `limitToLast(visibleCount)`, starting at 30; scrolling up increments `visibleCount` by 30 (Firestore fetches only the delta).
- User search uses prefix query on `displayNameLower` (or exact `emailLower` if term contains "@").
- Notes list is one realtime listener ordered by `updatedAt desc`; search/pin/archive handled client-side.

## Files ALREADY DONE (do not rewrite)
- Root configs: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `.eslintrc.json`, `.gitignore`, `.env.local`
- Firebase deploy configs: `firebase.json`, `firestore.rules`, `storage.rules`, `firestore.indexes.json` (one composite index: conversations participantIds array-contains + updatedAt DESC). Rules enforce: notes private to owner; conversations readable/writable only by participants; message create requires senderId==auth.uid, text ≤4000 chars; only sender can edit/delete own message; membership (participantIds) cannot be changed after creation; storage avatars ≤5MB images by owner; attachments ≤10MB by participants.
- `src/types/index.ts` — UserProfile, Conversation, LastMessage, MessageFile, Message, Note
- `src/lib/firebase/client.ts` (init app/auth/db/storage from env), `src/lib/firebase/errors.ts` (`friendlyError(error)` → human-readable messages)
- `src/services/auth.ts` — register(name,email,pw), login, loginWithGoogle (popup), logout, resetPassword
- `src/services/users.ts` — ensureUserDoc(user), getUserProfile, searchUsers(term, excludeUid), updateUserProfile(uid,{displayName,photoURL})
- `src/services/chat.ts` — subscribeConversations(uid,onChange,onError), getConversation, openDirectConversation(me,other), createGroupConversation(name,memberUids), renameGroup, markConversationRead(conversationId,uid,lastAtMs), subscribeMessages(conversationId,visibleCount,...), sendMessage({conversationId,senderId,text,file?}), editMessage, deleteMessage, messageTime(ts)
- `src/services/notes.ts` — subscribeNotes, createNote(uid), updateNote(uid,id,patch), deleteNote, countNotes(uid)
- `src/services/storage.ts` — uploadAvatar(userId,file), uploadConversationFile(conversationId,file) → {url,name,size,type}
- `src/hooks/useAuth.tsx` — `<AuthProvider>` + `useAuth()` giving { user, profile, loading, refreshProfile }
- `src/components/ui/index.tsx` — Button(variant/loading), Input, Textarea, Field, Spinner, PageLoader, EmptyState, Modal(open/onClose/title), Alert(tone); `Toaster.tsx` — ToastProvider + useToast(); `Avatar.tsx` — initials fallback avatar

## YOUR TASK — build the remaining UI/routes

1. **App shell & providers**
   - `src/app/layout.tsx`: Inter via `next/font/google` (CSS var `--font-sans`), render `<Providers>`; metadata title "Chatmat".
   - `src/app/providers.tsx` ("use client"): AuthProvider + ToastProvider.
   - `src/app/page.tsx` ("use client"): while auth loading show spinner; redirect signed-in → `/dashboard`, else → `/login` (useEffect + router.replace).
   - `src/app/(protected)/layout.tsx` ("use client"): guard — redirect to `/login` when !user && !loading; wrap children in `AppShell`.
   - `src/components/layout/AppShell.tsx`: desktop left sidebar (logo "Chatmat", nav links Dashboard/Chat/Notes, divider, Settings, Logout button at bottom, active link highlighted via `usePathname`); mobile: top bar with logo + bottom tab bar (Home, Chat, Notes, Settings). Main content area scrolls independently. Use inline SVG icons only.

2. **Auth pages** (`src/app/login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx`)
   - Centered card on soft gradient background; brand green accents (#0cb58b family = tailwind `brand-*`).
   - Login: email+password, Google button, links to register/forgot. Register: name+email+password. Forgot: email → success message ("check your inbox"). All call services, catch errors via `friendlyError`, show in `Alert`. On success router.replace("/dashboard").

3. **Chat** — routes `/chat` and `/chat/[id]` inside `(protected)`
   - Layout pattern: `/chat` shows conversation list pane + "select a conversation" empty pane on desktop (grid md:grid-cols-[320px_1fr]); on mobile list full-width. `/chat/[id]` renders ChatWindow; on mobile hide the list (full screen) with back button to /chat; on desktop keep both panes (ChatWindow replaces empty pane — implement by rendering list in a shared layout under `(protected)/chat/layout.tsx` OR simply have [id] page render its own two-pane grid; pick whichever is simpler and consistent).
   - `features/chat/ConversationList.tsx`: subscribes via subscribeConversations(myUid); each row = Avatar + title (other user's displayName for direct — resolve participant profiles once via getUserProfile and cache; group shows its name) + lastMessage preview + relative time; unread dot when unread; "+ New" button opens NewChatModal.
   - `features/chat/NewChatModal.tsx`: search input → searchUsers(term, myUid) debounced ~300ms; results toggle-select; if exactly 1 selected → button "Start chat" calls openDirectConversation; if ≥2 selected require group name field → createGroupConversation([me,...selected]) then navigate to `/chat/{id}`.
   - `features/chat/ChatWindow.tsx`: loads conversation via getConversation(id) (404 → friendly not-found empty state; non-participant will hit permission-denied → same handling); header: back arrow (mobile), Avatar(s)/group icon, title, for groups a rename action (Modal + renameGroup); message area subscribes messages (visibleCount state, default 30); auto-scroll to bottom on new message IF already near bottom; scroll-up near top (<80px) && hasMore (messages.length === visibleCount) → visibleCount+=30 preserving approximate scroll offset; marks read via markConversationRead when open and messages change (use latest messageTime(createdAt)).
   - Message rows: own right-aligned brand-green bubble, others left with small avatar + name (groups); timestamps (HH:mm, day separators optional); edited tag "(edited)"; deleted → italic "Message deleted"; image file → rounded img; other files → download link chip with size.
   - Own-message hover/tap menu: Edit (inline textarea, Enter save/Esc cancel → editMessage), Delete (confirm → deleteMessage; rules make it hard-delete which is fine since UI tombstones only apply to `deleted:true` docs — choose: implement delete as updateDoc {deleted:true,text:""} instead so tombstone shows; adjust service accordingly if you take this route, keeping rules satisfied since update is allowed for sender).
   - `features/chat/Composer.tsx`: textarea autos-grow, Enter=send Shift+Enter=newline; attach button → uploadConversationFile then sendMessage with file; disable send while uploading (show filename + remove X); optimistic-enough via Firestore local snapshot latency compensation; errors → useToast().
   - Empty states for no conversations / no messages.

4. **Notes** — `/notes` inside `(protected)`
   - Two-pane like chat: list (search box, "+ New Note", sections Pinned then Others; archived toggle filter chip) | editor. Mobile: tap note → editor full screen with back.
   - `features/notes/NotesView.tsx` (+ NoteList/NoteEditor split as you see fit): subscribeNotes(myUid); client-side filter by title/content includes search term; pin/unpin + archive/unarchive via updateNote; delete via confirm modal.
   - Editor: title Input + content Textarea, autosave debounced 600ms via updateNote (skip first render until loaded; show subtle "Saved"/"Saving…" indicator); New Note creates via createNote then selects it.
   - Relative time labels ("Updated 5m ago").

5. **Dashboard** — `/dashboard`
   - Greeting with profile.displayName; stat cards: Conversations count (getCountFromServer on the array-contains query — needs the composite index, already defined) and Notes count (countNotes); Recent conversations (top 4 via subscribeConversations slice) linking into chats; Recent notes (top 4 from subscribeNotes, non-archived); Quick actions: New chat, New note buttons.

6. **Settings** — `/settings`
   - Profile section: avatar (Avatar lg + upload button → uploadAvatar → updateUserProfile(photoURL) + auth.currentUser.updateProfile; refreshProfile()), display name Input + Save (updateUserProfile + updateProfile; validation ≥2 chars), read-only email.
   - Account section: Logout button → logout() → router.replace("/login").

7. **Design system** (Tailwind): bg `bg-ink-50` page, white cards `rounded-xl border border-ink-200 shadow-card`; primary `brand-500/600`; inputs/buttons/modals/empty-states/loaders all from `components/ui`; text ink-900/600/400 hierarchy; fully responsive; professional & minimal.

8. **Known cleanup**: `src/services/users.ts` imports `or` but doesn't use it — remove. Check all imports compile.

## Verify before finishing
1. `npm run build` must pass clean (fix any TS/ESLint errors).
2. `npm run lint` passes.
3. Manual test matrix (needs two browser profiles / two accounts):
   - Register A+B, login, logout, forgot-password email flow, visiting /dashboard logged-out redirects to /login.
   - A searches B → start chat → B receives message in real time without refresh; A edits/deletes → reflects for B; unread dot appears for closed conversation and clears when opened; scroll up loads older messages (create >30 via script or repeated sends).
   - Create group with 3 users, rename it.
   - Notes: create/edit/autosave/search/pin/archive/delete — private per account.
   - Security: in Firestore console attempt cross-user reads is blocked by rules; confirm one user cannot open another's note URL (permission-denied path handled gracefully).
4. If Firestore rules/indexes aren't deployed yet, remind the user: `npm i -g firebase-tools; firebase deploy --only firestore:rules,firestore:indexes,storage` (project chatmat-752f4).

Priority order if time-constrained: build passing > auth > chat > notes > dashboard/settings polish.
