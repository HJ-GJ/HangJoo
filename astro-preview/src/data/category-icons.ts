/** Canonical outline icons for the four blog categories.
 * The sidebar is the source of truth; home cards deliberately reuse the same SVG path.
 * Keep the icon geometry shared so designs can never drift apart.
 */
export const categoryIconPaths = {
  "study": "M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13A2.5 2.5 0 0 1 6.5 3Z",
  "projects": "M3 7h7l2 2h9v11H3z M3 7V5h6l2 2",
  "info": "M9 18h6 M10 21h4 M9 14c-1.4-1.2-2-2.3-2-4a5 5 0 0 1 10 0c0 1.7-.6 2.8-2 4l-1 2h-4z",
  "reviews": "M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.4l-5.6 2.9 1.1-6.2L3 9.7l6.2-.9z"
} as const;
