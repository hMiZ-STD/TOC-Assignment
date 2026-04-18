/**
 * @file app.js
 * @module App
 * @description Boots the TOC Lab ambiguity experience.
 *              Now wires the lesson stage controller, playback speed, and
 *              progress persistence. Panel keys come from constants (no magic strings).
 */

import {
  configureMermaid,
  renderMermaidDiagram,
} from "./core/mermaid-wrapper.js";
import { LessonController } from "./core/lesson-controller.js";
import { PANEL_KEYS, PLAYBACK_INTERVAL_MS } from "./core/constants.js";
import {
  clearErrors,
  clearProgress,
  markCaseVisited,
  setCompareMode,
  setCurrentCaseKey,
  setDerivationPlaying,
  setDerivationStep,
  setDerivationTimer,
  setEditableGrammar,
  setEditableString,
  setError,
  setGlossaryTooltipTerm,
  setGlossaryTooltipTimer,
  setGlossaryTooltipVisible,
  setPlaybackSpeed,
  setPracticeComplete,
  setPracticeLastAnswerCorrect,
  setPracticeQuestionIndex,
  setPracticeScore,
  setPracticeSelectedAnswer,
  setPracticeSubmitted,
  setQuizAttempted,
  setQuizScore,
  resetDerivationState,
  resetPracticeState,
  state,
  markCaseCompleted,
} from "./core/state.js";
import { createAmbiguityUI } from "./modules/ambiguity/ambiguity.ui.js";
import {
  getCaseStudy,
  getDerivationSteps,
  getDiagramSteps,
  getPracticeQuestions,
  isValidCaseStudy,
  listCaseKeys,
  resolveCaseStudy,
  validateGrammarInput,
  getLessonStages,
} from "./modules/ambiguity/ambiguity.logic.js";
import {
  getQuizQuestion,
  isCorrectQuizAnswer,
} from "./modules/ambiguity/ambiguity.quiz.js";

let diagramCounter = 0;

// ---------------------------------------------------------------------------
// Diagram helpers
// ---------------------------------------------------------------------------

function parseDiagramGraph(diagram) {
  const nodes = new Map();
  const edges = [];
  const statements = String(diagram ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("flowchart"));

  statements.forEach((line) => {
    const nodeMatch = line.match(/^([A-Za-z0-9_]+)\["([\s\S]*?)"\]$/);
    if (nodeMatch) {
      const [, id, label] = nodeMatch;
      nodes.set(id, { id, label, children: [] });
      return;
    }
    const edgeMatch = line.match(/^([A-Za-z0-9_]+)\s+-->\s+([A-Za-z0-9_]+)$/);
    if (edgeMatch) edges.push({ from: edgeMatch[1], to: edgeMatch[2] });
  });

  edges.forEach(({ from, to }) => {
    if (nodes.has(from) && nodes.has(to)) nodes.get(from).children.push(to);
  });

  return { nodes, edges };
}

function findDivergenceStep(caseStudy) {
  const stepsA = getDerivationSteps(caseStudy, "a");
  const stepsB = getDerivationSteps(caseStudy, "b");
  const minLength = Math.min(stepsA.length, stepsB.length);
  for (let i = 0; i < minLength; i++) {
    if (stepsA[i] !== stepsB[i]) return i;
  }
  return null;
}

function analyzeDiagramTransition(previousDiagram, currentDiagram) {
  const currentGraph = parseDiagramGraph(currentDiagram);
  const previousGraph = previousDiagram
    ? parseDiagramGraph(previousDiagram)
    : { nodes: new Map() };

  const addedNodeIds = [...currentGraph.nodes.keys()].filter(
    (nodeId) => !previousGraph.nodes.has(nodeId),
  );

  const expandedNode =
    [...currentGraph.nodes.values()].find((node) => {
      const prev = previousGraph.nodes.get(node.id);
      return prev && prev.children.length === 0 && node.children.length > 0;
    }) ??
    [...currentGraph.nodes.values()].find((node) => {
      const prev = previousGraph.nodes.get(node.id);
      return prev && node.children.length > prev.children.length;
    }) ??
    null;

  const nonTerminalLabels = new Set(
    [...currentGraph.nodes.values()]
      .filter((node) => node.children.length > 0)
      .map((node) => node.label),
  );

  const tokenByNodeId = {};
  currentGraph.nodes.forEach((node) => {
    if (expandedNode?.id === node.id) {
      tokenByNodeId[node.id] = "expanding";
      return;
    }
    if (node.children.length > 0) {
      tokenByNodeId[node.id] = "resolved";
      return;
    }
    tokenByNodeId[node.id] = nonTerminalLabels.has(node.label)
      ? "unresolved"
      : "terminal";
  });

  return {
    currentGraph,
    expandedNodeId: expandedNode?.id ?? null,
    newNodeIds: addedNodeIds,
    tokenByNodeId,
    appliedRule: expandedNode
      ? `${expandedNode.label} -> ${expandedNode.children
          .map((childId) => currentGraph.nodes.get(childId)?.label ?? "")
          .join(" ")} applied`
      : "",
  };
}

function findSvgNode(svg, sourceNodeId) {
  return (
    [...svg.querySelectorAll("g.node")].find((node) => {
      const domId = node.id || "";
      return (
        domId === sourceNodeId ||
        domId.endsWith(sourceNodeId) ||
        domId.includes(sourceNodeId)
      );
    }) ?? null
  );
}

function getRuleCalloutPosition(stageElement, targetNode) {
  if (!targetNode) return null;
  const stageRect = stageElement.getBoundingClientRect();
  const nodeRect = targetNode.getBoundingClientRect();
  const left = Math.min(
    Math.max(nodeRect.right - stageRect.left + stageElement.scrollLeft + 8, 12),
    Math.max(stageElement.clientWidth - 220, 12),
  );
  const top = Math.max(
    nodeRect.top - stageRect.top + stageElement.scrollTop - 10,
    12,
  );
  return { left, top };
}

function decorateRenderedDiagram(ui, panelKey, analysis) {
  const stageElement = ui.getDiagramStage(panelKey);
  const svg = stageElement.querySelector("svg");
  ui.clearRuleCallout(panelKey);
  if (!svg) return;

  const svgNodes = [...svg.querySelectorAll("g.node")];
  svg.classList.toggle("has-spotlight", Boolean(analysis.expandedNodeId));

  svgNodes.forEach((svgNode) => {
    svgNode.classList.remove(
      "is-dimmed",
      "is-expanding",
      "is-new-child",
      "is-token-unresolved",
      "is-token-expanding",
      "is-token-resolved",
      "is-token-terminal",
    );
  });

  Object.entries(analysis.tokenByNodeId).forEach(
    ([sourceNodeId, tokenType]) => {
      const svgNode = findSvgNode(svg, sourceNodeId);
      if (!svgNode) return;
      svgNode.classList.add(`is-token-${tokenType}`);
      if (
        analysis.expandedNodeId &&
        sourceNodeId !== analysis.expandedNodeId &&
        !analysis.newNodeIds.includes(sourceNodeId)
      ) {
        svgNode.classList.add("is-dimmed");
      }
    },
  );

  if (analysis.expandedNodeId) {
    const expandedSvgNode = findSvgNode(svg, analysis.expandedNodeId);
    if (expandedSvgNode) {
      expandedSvgNode.classList.remove("is-dimmed");
      expandedSvgNode.classList.add("is-expanding");
      ui.renderRuleCallout(
        panelKey,
        analysis.appliedRule,
        getRuleCalloutPosition(stageElement, expandedSvgNode),
      );
    }
  }

  analysis.newNodeIds.forEach((sourceNodeId) => {
    const svgNode = findSvgNode(svg, sourceNodeId);
    if (!svgNode) return;
    svgNode.classList.remove("is-dimmed");
    svgNode.classList.add("is-new-child");
  });
}

// ---------------------------------------------------------------------------
// Case / derivation helpers
// ---------------------------------------------------------------------------

function getActiveCaseStudy() {
  return resolveCaseStudy(
    state.currentCaseKey,
    state.editableGrammar,
    state.editableString,
  );
}

function buildDiagramId(panelKey) {
  diagramCounter++;
  return `diagram-${panelKey}-${diagramCounter}`;
}

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------

function clearGlossaryTimer() {
  const timerId = state.glossaryTooltip.hoverTimerId;
  if (timerId !== null) {
    clearTimeout(timerId);
    setGlossaryTooltipTimer(null);
  }
}

function hideGlossaryTooltip(ui) {
  clearGlossaryTimer();
  setGlossaryTooltipTerm("");
  setGlossaryTooltipVisible(false);
  ui.hideGlossaryTooltip();
}

// ---------------------------------------------------------------------------
// Practice mode
// ---------------------------------------------------------------------------

function renderPracticeMode(ui, caseStudy) {
  const questions = getPracticeQuestions(caseStudy);
  const totalQuestions = questions.length;

  if (!totalQuestions) {
    ui.renderPracticeScore(0, 0);
    return;
  }
  if (state.practice.isComplete) {
    ui.renderPracticeScore(state.practice.score, totalQuestions);
    return;
  }
  const currentQuestion = getQuizQuestion(
    caseStudy,
    state.practice.currentQuestionIndex,
  );
  if (!currentQuestion) {
    ui.renderPracticeScore(state.practice.score, totalQuestions);
    return;
  }
  if (state.practice.hasSubmitted) {
    ui.renderPracticeFeedback(
      currentQuestion,
      state.practice.lastAnswerCorrect,
      state.practice.selectedAnswer,
      state.practice.currentQuestionIndex === totalQuestions - 1,
    );
    return;
  }
  ui.renderPracticeQuestion(
    currentQuestion,
    state.practice.currentQuestionIndex,
    totalQuestions,
    state.practice.selectedAnswer,
  );
}

// ---------------------------------------------------------------------------
// Derivation playback
// ---------------------------------------------------------------------------

function stopDerivationPlayback(panelKey, ui) {
  const timerId = state.derivation[panelKey].timerId;
  if (timerId !== null) clearTimeout(timerId);
  setDerivationTimer(panelKey, null);
  setDerivationPlaying(panelKey, false);

  const caseStudy = getActiveCaseStudy();
  if (!caseStudy) return;

  const steps = getDerivationSteps(caseStudy, panelKey);
  if (!steps.length) return;

  ui.renderDerivation(
    panelKey,
    state.derivation[panelKey].currentStep,
    steps.length,
    steps[state.derivation[panelKey].currentStep],
    false,
  );
}

function stopAllPlayback(ui) {
  PANEL_KEYS.forEach((key) => stopDerivationPlayback(key, ui));
}

async function renderDerivationPanels(ui, caseStudy, specificPanelKey = null) {
  const panels = specificPanelKey ? [specificPanelKey] : PANEL_KEYS;
  const caseSignature = `${state.currentCaseKey}::${state.editableGrammar}::${state.editableString}`;

  const routines = panels.map(async (panelKey) => {
    const steps = getDerivationSteps(caseStudy, panelKey);
    const diagramSteps = getDiagramSteps(caseStudy, panelKey);
    const currentStep = state.derivation[panelKey].currentStep;
    const previousDiagram =
      currentStep > 0 ? diagramSteps[currentStep - 1] : null;
    const analysis = analyzeDiagramTransition(
      previousDiagram,
      diagramSteps[currentStep],
    );

    ui.renderDerivation(
      panelKey,
      currentStep,
      steps.length,
      steps[currentStep],
      state.derivation[panelKey].isPlaying,
    );

    try {
      const svg = await renderMermaidDiagram(
        buildDiagramId(panelKey),
        diagramSteps[currentStep],
      );
      const stillValid =
        `${state.currentCaseKey}::${state.editableGrammar}::${state.editableString}` ===
        caseSignature;
      if (stillValid) {
        ui.renderPanelDiagram(panelKey, svg);
        decorateRenderedDiagram(ui, panelKey, analysis);
      }
    } catch {
      const stillValid =
        `${state.currentCaseKey}::${state.editableGrammar}::${state.editableString}` ===
        caseSignature;
      if (stillValid) {
        ui.renderPanelError(
          panelKey,
          "Diagram rendering failed for this step.",
        );
        ui.renderPanelDiagram(
          panelKey,
          '<p class="empty-state">Unable to render diagram.</p>',
        );
        ui.clearRuleCallout(panelKey);
      }
    }
  });

  return Promise.all(routines).then((results) => {
    const divergenceStep = findDivergenceStep(caseStudy);
    PANEL_KEYS.forEach((key) => {
      ui.renderDivergenceMarker(
        key,
        divergenceStep,
        state.derivation[key].currentStep,
      );
    });
    return results;
  });
}

function startDerivationPlayback(panelKey, ui) {
  const caseStudy = getActiveCaseStudy();
  if (!caseStudy) return;

  const steps = getDerivationSteps(caseStudy, panelKey);
  if (state.derivation[panelKey].currentStep >= steps.length - 1) {
    setDerivationStep(panelKey, 0);
  }

  setDerivationPlaying(panelKey, true);
  renderDerivationPanels(ui, caseStudy, panelKey);

  const interval = Math.round(PLAYBACK_INTERVAL_MS / state.playbackSpeed);

  const advance = async () => {
    const currentCaseStudy = getActiveCaseStudy();
    const currentSteps = getDerivationSteps(currentCaseStudy, panelKey);
    const nextStep = state.derivation[panelKey].currentStep + 1;

    if (nextStep >= currentSteps.length) {
      stopDerivationPlayback(panelKey, ui);
      return;
    }

    setDerivationStep(panelKey, nextStep);
    await renderDerivationPanels(ui, currentCaseStudy, panelKey);

    if (nextStep >= currentSteps.length - 1) {
      stopDerivationPlayback(panelKey, ui);
      return;
    }

    const timerId = setTimeout(advance, interval);
    setDerivationTimer(panelKey, timerId);
  };

  const timerId = setTimeout(advance, interval);
  setDerivationTimer(panelKey, timerId);
}

// ---------------------------------------------------------------------------
// Lesson stage helpers
// ---------------------------------------------------------------------------

function renderLessonStage(ui, caseStudy) {
  const stages = getLessonStages(caseStudy);
  if (!stages.length) return;

  const stageIndex = LessonController.state.currentStage;
  const stage = stages[stageIndex];
  if (!stage) return;

  // Mark complete when practice stage is reached
  if (stage.id === "practice") {
    markCaseCompleted(state.currentCaseKey);
    ui.renderProgress(state.progress);
  }

  ui.renderLessonStage(
    stage,
    stageIndex,
    stages.length,
    LessonController.isFirstStage(),
    LessonController.isLastStage(),
    LessonController.progress(),
  );
}

// ---------------------------------------------------------------------------
// Render full case
// ---------------------------------------------------------------------------

async function renderCase(ui) {
  clearErrors();
  hideGlossaryTooltip(ui);
  ui.renderGlobalError("");
  ui.renderGrammarError("");
  PANEL_KEYS.forEach((key) => ui.renderPanelError(key, ""));
  ui.showLoadingState();

  const caseStudy = getActiveCaseStudy();

  if (!isValidCaseStudy(caseStudy)) {
    setError("global", "The selected ambiguity case is unavailable.");
    ui.renderGlobalError(state.errors.global);
    return;
  }

  ui.renderCase(state.currentCaseKey, caseStudy, state.progress);
  const interpretationCount = caseStudy.isCustomGrammar
    ? (caseStudy.interpretations?.b?.label?.includes("not found") ||
       caseStudy.interpretations?.b?.label?.includes("not available")
        ? 1
        : 2)
    : null;
  ui.renderAmbiguityBadge(interpretationCount);
  ui.renderEditableInput(state.editableGrammar, state.editableString);
  ui.renderProgress(state.progress);
  configureMermaid(state.theme);

  await renderDerivationPanels(ui, caseStudy);
  renderPracticeMode(ui, caseStudy);
  renderLessonStage(ui, caseStudy);
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

function startApp() {
  const root = document.querySelector("[data-app-root]");
  if (!root) return;

  state.theme = "dark";
  document.documentElement.setAttribute("data-theme", "dark");

  const availableKeys = listCaseKeys();
  if (!availableKeys.includes(state.currentCaseKey)) {
    setCurrentCaseKey(availableKeys[0]);
  }

  markCaseVisited(state.currentCaseKey);

  const initialCaseStudy = getCaseStudy(state.currentCaseKey);
  if (initialCaseStudy) {
    setEditableGrammar(initialCaseStudy.grammar);
    setEditableString(initialCaseStudy.string);
  }

  LessonController.resetForCase(state.currentCaseKey, {
    isCustomGrammar: false,
  });

  const ambiguityUI = createAmbiguityUI(root, {
    onCaseChange(caseKey) {
      stopAllPlayback(ambiguityUI);
      setCurrentCaseKey(caseKey);
      markCaseVisited(caseKey);
      const caseStudy = getCaseStudy(caseKey);
      if (caseStudy) {
        setEditableGrammar(caseStudy.grammar);
        setEditableString(caseStudy.string);
      }
      resetDerivationState();
      resetPracticeState();
      LessonController.resetForCase(caseKey, { isCustomGrammar: false });
      renderCase(ambiguityUI);
    },

    onCompareModeChange(value) {
      setCompareMode(value);
      ambiguityUI.renderCompareMode(state.isCompareMode);
    },

    onGrammarSubmit({ grammar, string }) {
      const validationResult = validateGrammarInput(grammar);
      if (!validationResult.isValid) {
        setError("grammar", validationResult.message);
        ambiguityUI.renderGrammarError(state.errors.grammar);
        return;
      }
      setError("grammar", "");
      setEditableGrammar(grammar.trim());
      setEditableString(string.trim());
      resetDerivationState();
      resetPracticeState();
      LessonController.resetForCase("custom", { isCustomGrammar: true });
      ambiguityUI.renderGrammarError("");
      renderCase(ambiguityUI);
    },

    onDerivationPrev(panelKey) {
      stopDerivationPlayback(panelKey, ambiguityUI);
      const caseStudy = getActiveCaseStudy();
      const nextStep = Math.max(0, state.derivation[panelKey].currentStep - 1);
      setDerivationStep(panelKey, nextStep);
      renderDerivationPanels(ambiguityUI, caseStudy, panelKey);
    },

    onDerivationNext(panelKey) {
      stopDerivationPlayback(panelKey, ambiguityUI);
      const caseStudy = getActiveCaseStudy();
      const steps = getDerivationSteps(caseStudy, panelKey);
      const nextStep = Math.min(
        steps.length - 1,
        state.derivation[panelKey].currentStep + 1,
      );
      setDerivationStep(panelKey, nextStep);
      renderDerivationPanels(ambiguityUI, caseStudy, panelKey);
    },

    onDerivationPlayToggle(panelKey) {
      if (state.derivation[panelKey].isPlaying) {
        stopDerivationPlayback(panelKey, ambiguityUI);
        return;
      }
      startDerivationPlayback(panelKey, ambiguityUI);
    },

    onPlaybackSpeedChange(multiplier) {
      setPlaybackSpeed(multiplier);
    },

    onGlossaryEnter(term, trigger) {
      clearGlossaryTimer();
      setGlossaryTooltipTerm(term);
      const timerId = setTimeout(() => {
        ambiguityUI.renderGlossaryTooltip(term, trigger);
        setGlossaryTooltipVisible(true);
        setGlossaryTooltipTimer(null);
      }, 200);
      setGlossaryTooltipTimer(timerId);
    },

    onGlossaryLeave() {
      hideGlossaryTooltip(ambiguityUI);
    },

    onGlossaryEscape() {
      if (
        !state.glossaryTooltip.isVisible &&
        state.glossaryTooltip.hoverTimerId === null
      )
        return;
      hideGlossaryTooltip(ambiguityUI);
    },

    onPracticeAnswerSelect(answer) {
      if (state.practice.hasSubmitted) return;
      setPracticeSelectedAnswer(answer);
      const caseStudy = getActiveCaseStudy();
      renderPracticeMode(ambiguityUI, caseStudy);
    },

    onPracticeSubmit() {
      const caseStudy = getActiveCaseStudy();
      const question = getQuizQuestion(
        caseStudy,
        state.practice.currentQuestionIndex,
      );
      if (!question || !state.practice.selectedAnswer) return;
      const isCorrect = isCorrectQuizAnswer(
        question,
        state.practice.selectedAnswer,
      );
      setQuizAttempted(state.currentCaseKey, true);
      if (isCorrect) setPracticeScore(state.practice.score + 1);
      setPracticeLastAnswerCorrect(isCorrect);
      setPracticeSubmitted(true);
      renderPracticeMode(ambiguityUI, caseStudy);
      ambiguityUI.renderProgress(state.progress);
    },

    onPracticeNext() {
      const caseStudy = getActiveCaseStudy();
      const questions = getPracticeQuestions(caseStudy);
      const isLastQuestion =
        state.practice.currentQuestionIndex >= questions.length - 1;
      if (isLastQuestion) {
        setPracticeComplete(true);
        setQuizScore(state.currentCaseKey, state.practice.score);
        renderPracticeMode(ambiguityUI, caseStudy);
        ambiguityUI.renderProgress(state.progress);
        return;
      }
      setPracticeQuestionIndex(state.practice.currentQuestionIndex + 1);
      setPracticeSelectedAnswer("");
      setPracticeSubmitted(false);
      setPracticeLastAnswerCorrect(false);
      renderPracticeMode(ambiguityUI, caseStudy);
    },

    onPracticeRestart() {
      resetPracticeState();
      const caseStudy = getActiveCaseStudy();
      renderPracticeMode(ambiguityUI, caseStudy);
      ambiguityUI.renderProgress(state.progress);
      renderCase(ambiguityUI);
    },

    // Lesson stage navigation
    onLessonNext() {
      const caseStudy = getActiveCaseStudy();
      LessonController.nextStage();
      renderLessonStage(ambiguityUI, caseStudy);
    },

    onLessonPrev() {
      const caseStudy = getActiveCaseStudy();
      LessonController.prevStage();
      renderLessonStage(ambiguityUI, caseStudy);
    },

    onProgressReset() {
      clearProgress();
      ambiguityUI.renderProgress(state.progress);
    },
  });

  ambiguityUI.renderCompareMode(state.isCompareMode);
  renderCase(ambiguityUI);
}

document.addEventListener("DOMContentLoaded", startApp);
