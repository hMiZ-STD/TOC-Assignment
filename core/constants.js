/**
 * @file constants.js
 * @module Constants
 * @description Shared constants — eliminates magic strings across the codebase.
 */

export const PANEL_KEYS = ["a", "b"];

export const BUILT_IN_STAGE_IDS = [
  "setup",
  "prediction",
  "walkA",
  "walkB",
  "split",
  "diagnosis",
  "fix",
  "practice",
];

export const PLAYBACK_INTERVAL_MS = 1200;
export const GLOSSARY_HOVER_DELAY_MS = 200;
export const PROGRESS_STORAGE_KEY = "toc-lab-progress";
