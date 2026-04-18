/**
 * @file lesson-controller.js
 * @module LessonController
 * @description Manages guided-lesson progression separately from derivation playback.
 */

const BASE_STATE = {
  caseId: null,
  currentStage: 0,
  autoPlay: false,
  isCustomGrammar: false,
  predictionState: {
    answered: false,
    selected: null,
    wasCorrect: false,
  },
  derivationCursor: {
    interpretation: "A",
    step: 0,
    autoPlaying: false,
  },
  comparisonExpanded: false,
  fixRevealed: false,
  practiceState: {
    active: false,
    answers: [],
    score: null,
  },
};

function createBaseState() {
  return {
    ...BASE_STATE,
    predictionState: { ...BASE_STATE.predictionState },
    derivationCursor: { ...BASE_STATE.derivationCursor },
    practiceState: {
      ...BASE_STATE.practiceState,
      answers: [...BASE_STATE.practiceState.answers],
    },
  };
}

export const LessonController = {
  state: createBaseState(),

  goToStage(stageIndex, totalStages = 8) {
    const safeMax = Math.max(0, totalStages - 1);
    this.state.currentStage = Math.min(Math.max(stageIndex, 0), safeMax);
    this.state.derivationCursor.interpretation = this.state.currentStage === 3 ? "B" : "A";
    this.state.comparisonExpanded = this.state.currentStage === 4;
    this.state.fixRevealed = this.state.currentStage >= 6;
    this.state.practiceState.active = this.state.currentStage === 7;
    return this.state.currentStage;
  },

  nextStage(totalStages = 8) {
    return this.goToStage(this.state.currentStage + 1, totalStages);
  },

  prevStage(totalStages = 8) {
    return this.goToStage(this.state.currentStage - 1, totalStages);
  },

  submitPrediction(option, correctOption) {
    this.state.predictionState.answered = true;
    this.state.predictionState.selected = option;
    this.state.predictionState.wasCorrect = option === correctOption;
    return this.state.predictionState.wasCorrect;
  },

  resetForCase(caseId, options = {}) {
    const nextState = createBaseState();
    nextState.caseId = caseId;
    nextState.isCustomGrammar = Boolean(options.isCustomGrammar);
    this.state = nextState;
    return this.state;
  },
};
