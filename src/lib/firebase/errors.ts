interface FirebaseLikeError {
  code?: string;
  message?: string;
}

const authErrors: Record<string, string> = {
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account found with that email.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/email-already-in-use": "An account with that email already exists.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/too-many-requests":
    "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed":
    "Network error. Check your connection and try again.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/cancelled-popup-request": "Sign-in was cancelled.",
  "auth/popup-blocked":
    "Your browser blocked the sign-in popup. Allow popups and try again.",
  "auth/operation-not-allowed":
    "This sign-in method isn't enabled yet for the Firebase project.",
  "auth/requires-recent-login":
    "Please sign in again to complete this action.",
};

const firestoreErrors: Record<string, string> = {
  "permission-denied": "You don't have permission to do that.",
  unavailable: "Service is temporarily unavailable. Try again shortly.",
  "failed-precondition": "This action needs a database index that hasn't been created yet.",
  aborted: "The operation was interrupted. Please try again.",
  "entity-too-large": "That's too large to save.",
};

function codeOf(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    return String((error as FirebaseLikeError).code ?? "");
  }
  return "";
}

export function friendlyError(error: unknown): string {
  const code = codeOf(error);
  return (
    authErrors[code] ??
    firestoreErrors[code] ??
    "Something went wrong. Please try again."
  );
}
