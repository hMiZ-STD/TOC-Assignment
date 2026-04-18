/**
 * @file theme.js
 * @module Theme
 * @description Applies the selected theme to the document root.
 */

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}
