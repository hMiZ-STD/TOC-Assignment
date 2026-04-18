/**
 * @file lesson-controller.js
 * @module LessonController
 * @description Manages guided-lesson stage progression. Now fully wired into app.js.
 */

const BUILT_IN_STAGE_IDS = [
  "setup",
  "prediction",
  "walkA",
  "walkB",
  "split",
  "diagnosis",
  "fix",
  "practice",
];

const TOTAL_STAGES = BUILT_IN_STAGE_IDS.length; // 8

function createBaseState() {
  return {
    caseId: null,
    currentStage: 0,
    isCustomGrammar: false,
    predictionState: { answered: false, selected: null, wasCorrect: false },
    comparisonExpanded: false,
    fixRevealed: false,
  };
}

export const LessonController = {
  state: createBaseState(),

  goToStage(stageIndex) {
    this.state.currentStage = Math.min(
      Math.max(stageIndex, 0),
      TOTAL_STAGES - 1,
    );
    this.state.comparisonExpanded = this.state.currentStage === 4;
    this.state.fixRevealed = this.state.currentStage >= 6;
    return this.state.currentStage;
  },

  nextStage() {
    return this.goToStage(this.state.currentStage + 1);
  },
  prevStage() {
    return this.goToStage(this.state.currentStage - 1);
  },
  isFirstStage() {
    return this.state.currentStage === 0;
  },
  isLastStage() {
    return this.state.currentStage === TOTAL_STAGES - 1;
  },

  /** Returns the stage id string (e.g. "walkA") for the current stage. */
  currentStageId() {
    return BUILT_IN_STAGE_IDS[this.state.currentStage] ?? null;
  },

  /** 0–1 fraction for a progress bar. */
  progress() {
    return this.state.currentStage / (TOTAL_STAGES - 1);
  },

  submitPrediction(option, correctOption) {
    this.state.predictionState.answered = true;
    this.state.predictionState.selected = option;
    this.state.predictionState.wasCorrect = option === correctOption;
    return this.state.predictionState.wasCorrect;
  },

  resetForCase(caseId, options = {}) {
    this.state = createBaseState();
    this.state.caseId = caseId;
    this.state.isCustomGrammar = Boolean(options.isCustomGrammar);
    return this.state;
  },
};
