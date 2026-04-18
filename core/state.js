/**
 * @file state.js
 * @module AppState
 * @description Single source of truth for the current application state.
 */

export const state = {
  currentCaseKey: "precedence",
  isCompareMode: true,
  theme: "light",
  editableGrammar: "",
  editableString: "",
  derivation: {
    a: {
      currentStep: 0,
      isPlaying: false,
      timerId: null,
    },
    b: {
      currentStep: 0,
      isPlaying: false,
      timerId: null,
    },
  },
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
  progress: {
    visited: [],
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
  state.derivation.a.currentStep = 0;
  state.derivation.a.isPlaying = false;
  state.derivation.a.timerId = null;
  state.derivation.b.currentStep = 0;
  state.derivation.b.isPlaying = false;
  state.derivation.b.timerId = null;
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
  }
}

export function setQuizScore(caseKey, score) {
  state.progress.quizScore = {
    ...state.progress.quizScore,
    [caseKey]: score,
  };
}

export function setQuizAttempted(caseKey, value) {
  state.progress.quizAttempted = {
    ...state.progress.quizAttempted,
    [caseKey]: Boolean(value),
  };
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
