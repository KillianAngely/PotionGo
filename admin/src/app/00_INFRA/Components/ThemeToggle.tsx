"use client"

import { useTheme } from "../Context/ThemeContext"

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={className}
      aria-label={theme === "dark" ? "Passer en thème clair" : "Passer en thème sombre"}
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
          <path
            d="M12 3a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1zm0 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm7-5a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1zM4 11a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1zm11.95-5.95a1 1 0 0 1 1.41 0l1.42 1.42a1 1 0 1 1-1.42 1.41l-1.41-1.41a1 1 0 0 1 0-1.42zM5.22 16.78a1 1 0 0 1 1.41 0l1.41 1.41a1 1 0 0 1-1.41 1.42l-1.41-1.42a1 1 0 0 1 0-1.41zm12.73 1.41a1 1 0 0 1 0 1.42l-1.41 1.41a1 1 0 1 1-1.42-1.41l1.42-1.42a1 1 0 0 1 1.41 0zM5.22 7.22a1 1 0 0 1 0 1.42L3.8 10.05a1 1 0 1 1-1.41-1.41l1.42-1.42a1 1 0 0 1 1.41 0z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
          <path d="M21 14.5A7.5 7.5 0 0 1 9.5 3a9 9 0 1 0 11.5 11.5z" fill="currentColor" />
        </svg>
      )}
    </button>
  )
}
