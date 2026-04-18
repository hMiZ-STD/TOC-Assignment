/**
 * @file state.js
 * @module AppState
 * @description Single source of truth. Progress persists to localStorage.
 */

import { PANEL_KEYS, PROGRESS_STORAGE_KEY } from "./constants.js";

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

function loadPersistedProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed.visited) &&
      parsed.quizScore &&
      parsed.quizAttempted
    ) {
      return parsed;
    }
  } catch {
    // corrupted — ignore
  }
  return null;
}

function persistProgress() {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(state.progress));
  } catch {
    // sandboxed context — fail silently
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDerivationState() {
  return Object.fromEntries(
    PANEL_KEYS.map((key) => [
      key,
      { currentStep: 0, isPlaying: false, timerId: null },
    ]),
  );
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const savedProgress = loadPersistedProgress();

export const state = {
  currentCaseKey: "precedence",
  isCompareMode: true,
  theme: "light",
  editableGrammar: "",
  editableString: "",
  /** Controls animation speed. Multiplies PLAYBACK_INTERVAL_MS. */
  playbackSpeed: 1,
  derivation: buildDerivationState(),
  glossaryTooltip: {
    activeTerm: "",
    hoverTimerId: null,
    isVisible: false,
  },
  practice: {
    currentQuestionIndex: 0,
    selectedAnswer: "",
    score: 0,
    hasSubmitted: false,
    lastAnswerCorrect: false,
    isComplete: false,
  },
  progress: savedProgress ?? {
    visited: [],
    completed: [],
    quizScore: {},
    quizAttempted: {},
  },
  errors: {
    global: "",
    panelA: "",
    panelB: "",
    grammar: "",
  },
};

// ---------------------------------------------------------------------------
// Setters
// ---------------------------------------------------------------------------

export function setCurrentCaseKey(caseKey) {
  state.currentCaseKey = caseKey;
}
export function setCompareMode(value) {
  state.isCompareMode = Boolean(value);
}
export function setEditableGrammar(grammar) {
  state.editableGrammar = grammar;
}
export function setEditableString(value) {
  state.editableString = value;
}

export function setPlaybackSpeed(multiplier) {
  state.playbackSpeed = Math.max(0.25, Math.min(4, Number(multiplier) || 1));
}

export function setDerivationStep(panelKey, stepIndex) {
  state.derivation[panelKey].currentStep = stepIndex;
}
export function setDerivationPlaying(panelKey, value) {
  state.derivation[panelKey].isPlaying = Boolean(value);
}
export function setDerivationTimer(panelKey, timerId) {
  state.derivation[panelKey].timerId = timerId;
}

export function resetDerivationState() {
  PANEL_KEYS.forEach((key) => {
    state.derivation[key].currentStep = 0;
    state.derivation[key].isPlaying = false;
    state.derivation[key].timerId = null;
  });
}

export function setGlossaryTooltipTerm(term) {
  state.glossaryTooltip.activeTerm = term;
}
export function setGlossaryTooltipTimer(timerId) {
  state.glossaryTooltip.hoverTimerId = timerId;
}
export function setGlossaryTooltipVisible(value) {
  state.glossaryTooltip.isVisible = Boolean(value);
}

export function setPracticeQuestionIndex(index) {
  state.practice.currentQuestionIndex = index;
}
export function setPracticeSelectedAnswer(answer) {
  state.practice.selectedAnswer = answer;
}
export function setPracticeScore(score) {
  state.practice.score = score;
}
export function setPracticeSubmitted(value) {
  state.practice.hasSubmitted = Boolean(value);
}
export function setPracticeLastAnswerCorrect(value) {
  state.practice.lastAnswerCorrect = Boolean(value);
}
export function setPracticeComplete(value) {
  state.practice.isComplete = Boolean(value);
}

export function resetPracticeState() {
  state.practice.currentQuestionIndex = 0;
  state.practice.selectedAnswer = "";
  state.practice.score = 0;
  state.practice.hasSubmitted = false;
  state.practice.lastAnswerCorrect = false;
  state.practice.isComplete = false;
}

export function markCaseVisited(caseKey) {
  if (!state.progress.visited.includes(caseKey)) {
    state.progress.visited = [...state.progress.visited, caseKey];
    persistProgress();
  }
}

export function setQuizScore(caseKey, score) {
  state.progress.quizScore = { ...state.progress.quizScore, [caseKey]: score };
  persistProgress();
}

export function setQuizAttempted(caseKey, value) {
  state.progress.quizAttempted = {
    ...state.progress.quizAttempted,
    [caseKey]: Boolean(value),
  };
  persistProgress();
}

export function clearProgress() {
  state.progress.visited = [];
  state.progress.quizScore = {};
  state.progress.quizAttempted = {};
  try {
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function toggleTheme() {
  state.theme = state.theme === "light" ? "dark" : "light";
}

export function setError(key, message) {
  state.errors[key] = message;
}

export function clearErrors() {
  state.errors.global = "";
  state.errors.panelA = "";
  state.errors.panelB = "";
  state.errors.grammar = "";
}

export function markCaseCompleted(caseKey) {
  if (!state.progress.completed.includes(caseKey)) {
    state.progress.completed = [...state.progress.completed, caseKey];
    persistProgress();
  }
}
