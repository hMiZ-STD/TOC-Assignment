/**
 * @file utils.js
 * @module Utils
 * @description Shared UI utility helpers for visible error handling and safe DOM access.
 */

export function showError(container, message) {
  container.textContent = message;
  container.classList.remove("is-hidden");
}

export function clearError(container) {
  container.textContent = "";
  container.classList.add("is-hidden");
}
