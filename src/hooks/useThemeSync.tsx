"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { updateUserTheme } from "@/services/users";

/**
 * Syncs the theme preference with the user's Firestore profile.
 * - On login, applies the stored theme from the profile.
 * - On toggle, persists the new theme to Firestore.
 */
export function useThemeSync() {
  const { user, profile } = useAuth();
  const { theme, setTheme, toggle } = useTheme();
  const applying = useRef(false);

  useEffect(() => {
    if (profile?.theme && profile.theme !== theme && !applying.current) {
      applying.current = true;
      setTheme(profile.theme);
      applying.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.theme]);

  const toggleAndSave = useCallback(async () => {
    toggle();
    if (!user) return;
    const next = theme === "light" ? "dark" : "light";
    try {
      await updateUserTheme(user.uid, next);
    } catch {
      // Non-critical; theme is still applied locally (localStorage).
    }
  }, [user, theme, toggle]);

  return { theme, toggleAndSave };
}