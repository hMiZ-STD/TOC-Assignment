/**
 * @file lesson-controller.js
 * @module LessonController
 * @description Manages guided-lesson stage progression. Now fully wired into app.js.
 */

import { BUILT_IN_STAGE_IDS } from "./constants.js";

const TOTAL_STAGES = BUILT_IN_STAGE_IDS.length; // 8

function createBaseState() {
  return {
    caseId: null,
    currentStage: 0,
    isCustomGrammar: false,
  };
}

export const LessonController = {
  state: createBaseState(),

  goToStage(stageIndex) {
    this.state.currentStage = Math.min(
      Math.max(stageIndex, 0),
      TOTAL_STAGES - 1,
    );
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

  /** 0–1 fraction for a progress bar. */
  progress() {
    return this.state.currentStage / (TOTAL_STAGES - 1);
  },

  resetForCase(caseId, options = {}) {
    this.state = createBaseState();
    this.state.caseId = caseId;
    this.state.isCustomGrammar = Boolean(options.isCustomGrammar);
    return this.state;
  },
};
