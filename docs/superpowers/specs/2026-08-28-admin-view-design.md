# Admin View Feature Design

## Overview
Add admin functionality to allow a designated admin user to view all chat conversations in read-only mode. The admin is identified by the `role: 'admin'` field on their user document — the designated admin account is the Google auth user `dharmiklathiya.it@gmail.com`.

## Requirements
- Admin user can view ALL conversations (both direct and group)
- Admin has read-only access - cannot send messages, edit, or delete
- Admin link appears in sidebar only for admin users
- Admin can click on any conversation to view its messages

## Data Model Changes

### UserProfile Type
Add `role` field to `src/types/index.ts`:
```typescript
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  displayNameLower?: string;
  emailLower?: string;
  role?: 'admin' | 'user';  // NEW
  createdAt?: number;
  updatedAt?: number;
}
```

## Firestore Rules Changes

### Conversation Read Access for Admin
Modify `firestore.rules` to allow admin read access:
```javascript
function isAdmin() {
  return isSignedIn()
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

// In conversations match block:
allow get, list: if isParticipant() || isAdmin();
```

### Message Read Access for Admin
```javascript
// In messages match block:
allow read: if isMessageParticipant() || isAdmin();
```

## Service Layer Changes

### New Admin Service
Create `src/services/admin.ts`:
```typescript
export function subscribeAllConversations(
  onChange: (conversations: Conversation[]) => void,
  onError: (error: unknown) => void
): () => void {
  // Query all conversations ordered by updatedAt desc
  const q = query(
    collection(db, 'conversations'),
    orderBy('updatedAt', 'desc'),
    limit(100)
  );
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as Conversation[];
    onChange(list);
  }, onError);
}

export function subscribeAllMessages(
  conversationId: string,
  visibleCount: number,
  onChange: (messages: Message[]) => void,
  onError: (error: unknown) => void
): () => void {
  // Same as regular subscribeMessages but admin can read any conversation
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc'),
    limitToLast(visibleCount)
  );
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as Message[]);
  }, onError);
}
```

## UI Components

### Admin Link in Sidebar
Modify `src/components/layout/AppShell.tsx`:
- Add "Admin" nav link with shield icon
- Only show when `profile?.role === 'admin'`
- Link to `/admin`

### Admin Page
Create `src/app/(protected)/admin/page.tsx`:
- Protected route (redirect if not admin)
- Two-pane layout similar to chat
- Left: conversation list (all conversations)
- Right: chat view (read-only)

### Admin Conversation List
Create `src/features/admin/AdminConversationList.tsx`:
- Uses `subscribeAllConversations()`
- Shows all conversations with participant names
- Click to view conversation

### Admin Chat View
Create `src/features/admin/AdminChatView.tsx`:
- Read-only message display
- No Composer component
- Shows messages with sender info
- No edit/delete options

## Implementation Steps

1. Update UserProfile type with role field
2. Modify Firestore rules for admin access
3. Create admin service functions
4. Add admin link to sidebar
5. Create admin page and components
6. Test with the admin user (dharmiklathiya.it@gmail.com, role set to 'admin')

## Security Considerations
- Admin role must be set in Firestore manually (no self-promotion)
- Firestore rules enforce admin-only read access
- Admin cannot modify any data
- Regular users cannot see admin link or access /admin route
