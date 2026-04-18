/**
 * @file ambiguity.ui.js
 * @module AmbiguityUI
 * @description UI renderer and event wiring.
 *              Adds: lesson stage bar, playback speed slider, mobile panel tabs,
 *              progress reset button. Panel iteration uses PANEL_KEYS constant.
 */

import { clearError, showError } from "../../core/utils.js";
import { glossaryTerms } from "../../data/glossary.data.js";
import { PANEL_KEYS } from "../../core/constants.js";

const CASE_TITLES = {
  precedence: "Operator Precedence Trap",
  dangling: "Dangling Else Problem",
  epsilon: "Epsilon Loop Structure",
  associativity: "Arithmetic Associativity",
  concatenation: "Nested Concatenation",
  language: "Natural Language",
};

const CASE_TEASERS = {
  precedence:
    "Does `id + id * id` have one meaning, or two equally valid parses?",
  dangling: "When one `else` appears, which `if` is it supposed to belong to?",
  epsilon:
    "Can the empty string come from one parse tree, or from a whole family of disappearing branches?",
  associativity:
    "If subtraction repeats, does the grammar force left association or right association?",
  concatenation: "For `aaa`, where should the binary split happen first?",
  language:
    "Can `I saw her` be one sentence structure, or two different grammatical stories?",
};

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------

function buildGlossaryPattern() {
  const terms = Object.keys(glossaryTerms)
    .sort((a, b) => b.length - a.length)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`\\b(${terms.join("|")})\\b`, "gi");
}

function createGlossaryFragment(text) {
  const fragment = document.createDocumentFragment();
  const matches = text.matchAll(buildGlossaryPattern());
  let lastIndex = 0;

  for (const match of matches) {
    const [term] = match;
    const matchIndex = match.index ?? 0;
    if (matchIndex > lastIndex) {
      fragment.append(
        document.createTextNode(text.slice(lastIndex, matchIndex)),
      );
    }
    const glossaryTerm =
      Object.keys(glossaryTerms).find(
        (entry) => entry.toLowerCase() === term.toLowerCase(),
      ) ?? term;
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "glossary-term";
    trigger.dataset.glossaryTerm = glossaryTerm;
    trigger.setAttribute("aria-expanded", "false");
    trigger.textContent = term;
    fragment.append(trigger);
    lastIndex = matchIndex + term.length;
  }

  if (lastIndex < text.length) {
    fragment.append(document.createTextNode(text.slice(lastIndex)));
  }
  return fragment;
}

// ---------------------------------------------------------------------------
// Option button
// ---------------------------------------------------------------------------

function createOptionButton(option, selectedValue, callback) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "practice-option";
  button.textContent = option;
  button.dataset.option = option;
  button.setAttribute("role", "radio");
  button.setAttribute("aria-checked", String(option === selectedValue));
  if (option === selectedValue) button.classList.add("is-selected");
  button.addEventListener("click", () => callback(option));
  return button;
}

function animateEntry(element, className) {
  if (!element) return;
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

// ---------------------------------------------------------------------------
// createAmbiguityUI
// ---------------------------------------------------------------------------

export function createAmbiguityUI(root, handlers) {
  // -- Element cache --
  const el = {
    navButtons: Array.from(root.querySelectorAll("[data-case-key]")),
    moduleTitle: root.querySelector("#module-title"),
    grammarForm: root.querySelector("#grammar-form"),
    grammarInput: root.querySelector("#grammar-input"),
    stringInput: root.querySelector("#string-input"),
    grammarError: root.querySelector("#grammar-error"),
    progressVisited: root.querySelector("#progress-visited"),
    progressQuizScore: root.querySelector("#progress-quiz-score"),
    progressQuizAttempted: root.querySelector("#progress-quiz-attempted"),
    progressReset: root.querySelector("#progress-reset"),
    grammarDisplay: root.querySelector("#grammar-display"),
    stringDisplay: root.querySelector("#string-display"),
    caseTeaser: root.querySelector("#case-teaser"),
    appError: root.querySelector("#app-error"),
    canvasArea: root.querySelector("#canvas-area"),
    compareToggle: root.querySelector("#compare-mode"),
    themeToggle: root.querySelector("#theme-toggle"),
    speedSlider: root.querySelector("#speed-slider"),
    speedLabel: root.querySelector("#speed-label"),
    // Lesson stage bar
    lessonBar: root.querySelector("#lesson-bar"),
    lessonStageTitle: root.querySelector("#lesson-stage-title"),
    lessonStagePrompt: root.querySelector("#lesson-stage-prompt"),
    lessonPrev: root.querySelector("#lesson-prev"),
    lessonNext: root.querySelector("#lesson-next"),
    lessonProgress: root.querySelector("#lesson-progress-fill"),
    // Per-panel (keyed by PANEL_KEYS)
    panels: {},
    diagrams: {},
    errors: {},
    labels: {},
    prevBtns: {},
    nextBtns: {},
    playBtns: {},
    stepCounters: {},
    stepTexts: {},
    explanations: {},
    // Mobile tab buttons
    mobileTabs: {},
    // Practice
    practiceCard: root.querySelector("#practice-card"),
    practiceProgress: root.querySelector("#practice-progress"),
    practiceQuestionView: root.querySelector("#practice-question-view"),
    practiceFeedbackView: root.querySelector("#practice-feedback-view"),
    practiceScoreView: root.querySelector("#practice-score-view"),
    practiceQuestion: root.querySelector("#practice-question"),
    practiceOptions: root.querySelector("#practice-options"),
    practiceSubmit: root.querySelector("#practice-submit"),
    practiceFeedback: root.querySelector("#practice-feedback"),
    practiceHint: root.querySelector("#practice-hint"),
    practiceExplanation: root.querySelector("#practice-explanation"),
    practiceNext: root.querySelector("#practice-next"),
    practiceScore: root.querySelector("#practice-score"),
    practiceRestart: root.querySelector("#practice-restart"),
    // Tooltip
    tooltip: document.querySelector("#glossary-tooltip"),
    tooltipTitle: document.querySelector("#glossary-tooltip-title"),
    tooltipBody: document.querySelector("#glossary-tooltip-body"),
  };

  // Wire per-panel elements using PANEL_KEYS so "a"/"b" aren't scattered
  PANEL_KEYS.forEach((key) => {
    const K = key.toUpperCase();
    el.panels[key] = root.querySelector(`#interp-${key}`);
    el.diagrams[key] = root.querySelector(`#mermaid-${key}`);
    el.errors[key] = root.querySelector(`#error-${key}`);
    el.labels[key] = root.querySelector(`#label-${key}`);
    el.prevBtns[key] = root.querySelector(`#prev-${key}`);
    el.nextBtns[key] = root.querySelector(`#next-${key}`);
    el.playBtns[key] = root.querySelector(`#play-${key}`);
    el.stepCounters[key] = root.querySelector(`#step-counter-${key}`);
    el.stepTexts[key] = root.querySelector(`#step-text-${key}`);
    el.explanations[key] = root.querySelector(`#explanation-${key}`);
    el.mobileTabs[key] = root.querySelector(`#tab-${key}`);
  });

  // -- Event wiring --

  el.navButtons.forEach((button) => {
    button.addEventListener("click", () =>
      handlers.onCaseChange(button.dataset.caseKey),
    );
  });

  el.compareToggle?.addEventListener("change", (event) => {
    handlers.onCompareModeChange(event.target.checked);
  });

  el.themeToggle?.addEventListener("click", () => handlers.onThemeToggle());

  el.grammarForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    handlers.onGrammarSubmit({
      grammar: el.grammarInput.value,
      string: el.stringInput.value,
    });
  });

  PANEL_KEYS.forEach((key) => {
    el.prevBtns[key]?.addEventListener("click", () =>
      handlers.onDerivationPrev(key),
    );
    el.nextBtns[key]?.addEventListener("click", () =>
      handlers.onDerivationNext(key),
    );
    el.playBtns[key]?.addEventListener("click", () =>
      handlers.onDerivationPlayToggle(key),
    );
    el.mobileTabs[key]?.addEventListener("click", () => {
      PANEL_KEYS.forEach((k) => {
        el.panels[k]?.classList.toggle("is-hidden", k !== key);
        el.mobileTabs[k]?.classList.toggle("is-active", k === key);
      });
    });
  });

  // Speed slider
  el.speedSlider?.addEventListener("input", (event) => {
    const raw = parseFloat(event.target.value);
    handlers.onPlaybackSpeedChange(raw);
    if (el.speedLabel) el.speedLabel.textContent = `${raw}×`;
  });

  // Lesson navigation
  el.lessonPrev?.addEventListener("click", () => handlers.onLessonPrev());
  el.lessonNext?.addEventListener("click", () => handlers.onLessonNext());

  // Progress reset
  el.progressReset?.addEventListener("click", () => {
    if (confirm("Reset all progress and quiz scores?"))
      handlers.onProgressReset();
  });

  // Glossary events
  root.addEventListener("mouseover", (event) => {
    const trigger = event.target.closest("[data-glossary-term]");
    if (trigger)
      handlers.onGlossaryEnter(trigger.dataset.glossaryTerm, trigger);
  });
  root.addEventListener("mouseout", (event) => {
    const trigger = event.target.closest("[data-glossary-term]");
    if (!trigger) return;
    if (!event.relatedTarget || !trigger.contains(event.relatedTarget)) {
      handlers.onGlossaryLeave();
    }
  });
  root.addEventListener("focusin", (event) => {
    const trigger = event.target.closest("[data-glossary-term]");
    if (trigger)
      handlers.onGlossaryEnter(trigger.dataset.glossaryTerm, trigger);
  });
  root.addEventListener("focusout", (event) => {
    const trigger = event.target.closest("[data-glossary-term]");
    if (trigger) handlers.onGlossaryLeave();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") handlers.onGlossaryEscape();
  });

  // Practice events
  el.practiceSubmit?.addEventListener("click", () =>
    handlers.onPracticeSubmit(),
  );
  el.practiceNext?.addEventListener("click", () => handlers.onPracticeNext());
  el.practiceRestart?.addEventListener("click", () =>
    handlers.onPracticeRestart(),
  );

  // ---------------------------------------------------------------------------
  // Render functions
  // ---------------------------------------------------------------------------

  function renderCase(caseKey, caseStudy, progress) {
    el.navButtons.forEach((button) => {
      const isActive = button.dataset.caseKey === caseKey;
      const isVisited = progress.visited.includes(button.dataset.caseKey);
      const isCompleted = (progress.completed ?? []).includes(
        button.dataset.caseKey,
      );
      const title = isActive
        ? caseStudy.title
        : (CASE_TITLES[button.dataset.caseKey] ?? button.dataset.caseKey);
      const teaser = CASE_TEASERS[button.dataset.caseKey] ?? "";
      button.classList.toggle("is-active", isActive);
      button.classList.toggle("is-complete", isVisited && !isActive);
      button.classList.toggle("is-completed", isCompleted);
      button.innerHTML = `
        <span class="nav-button-title">${title}${isCompleted ? ' <span class="case-badge" aria-label="Completed">✅</span>' : ""}</span>
        <span class="nav-button-copy">${teaser}</span>
      `;
    });

    el.moduleTitle.textContent = caseStudy.title;
    el.caseTeaser.textContent = caseStudy.teaser;
    el.grammarDisplay.textContent = caseStudy.grammar;
    el.stringDisplay.textContent = caseStudy.string;

    PANEL_KEYS.forEach((key) => {
      el.labels[key].textContent = caseStudy.interpretations[key].label;
      el.explanations[key].replaceChildren(
        createGlossaryFragment(caseStudy.interpretations[key].explanation),
      );
    });

    el.panels[PANEL_KEYS[0]]?.classList.remove("is-hidden");
    el.practiceCard?.classList.remove("is-hidden");
  }

  function renderEditableInput(grammar, stringValue) {
    el.grammarInput.value = grammar;
    el.stringInput.value = stringValue;
    el.grammarDisplay.textContent = grammar;
    el.stringDisplay.textContent = stringValue;
  }

  function renderPanelDiagram(panelKey, diagramMarkup) {
    el.diagrams[panelKey].innerHTML = diagramMarkup;
    animateEntry(el.panels[panelKey], "is-panel-entering");
  }

  function getDiagramStage(panelKey) {
    return el.diagrams[panelKey];
  }

  function clearRuleCallout(panelKey) {
    el.diagrams[panelKey]?.querySelector(".rule-callout")?.remove();
  }

  function renderRuleCallout(panelKey, text, position = null) {
    clearRuleCallout(panelKey);
    if (!text) return;
    const callout = document.createElement("div");
    callout.className = "rule-callout";
    callout.textContent = text;
    callout.style.left = position ? `${position.left}px` : "16px";
    callout.style.top = position ? `${position.top}px` : "16px";
    el.diagrams[panelKey]?.append(callout);
  }

  function renderDerivation(
    panelKey,
    stepIndex,
    stepTotal,
    stepText,
    isPlaying,
  ) {
    const lastIndex = stepTotal - 1;
    el.prevBtns[panelKey].disabled = stepIndex <= 0;
    el.nextBtns[panelKey].disabled = stepIndex >= lastIndex;
    el.playBtns[panelKey].textContent = isPlaying ? "Pause" : "Play";
    el.stepCounters[panelKey].textContent =
      `Step ${stepIndex + 1} of ${stepTotal}`;
    el.stepTexts[panelKey].textContent = stepText;
  }

  function renderCompareMode(isCompareMode) {
    el.compareToggle.checked = isCompareMode;
    el.panels[PANEL_KEYS[1]]?.classList.toggle("is-hidden", !isCompareMode);
    el.canvasArea?.classList.toggle("is-single", !isCompareMode);
    // On mobile, only show tabs when compare mode is active
    Object.values(el.mobileTabs).forEach((tab) => {
      tab?.classList.toggle("is-hidden", !isCompareMode);
    });
  }

  function renderTheme(theme) {
    const isDark = theme === "dark";
    el.themeToggle?.setAttribute("aria-pressed", String(isDark));
    if (el.themeToggle) {
      el.themeToggle.textContent = isDark
        ? "Switch to light theme"
        : "Switch to dark theme";
    }
  }

  function renderGlobalError(message) {
    message ? showError(el.appError, message) : clearError(el.appError);
  }

  function renderPanelError(panelKey, message) {
    message
      ? showError(el.errors[panelKey], message)
      : clearError(el.errors[panelKey]);
  }

  function renderGrammarError(message) {
    message ? showError(el.grammarError, message) : clearError(el.grammarError);
  }

  function renderGlossaryTooltip(term, trigger) {
    const description = glossaryTerms[term];
    if (!description) return;
    el.tooltipTitle.textContent = term;
    el.tooltipBody.textContent = description;
    el.tooltip.classList.remove("is-hidden");
    el.tooltip.setAttribute("aria-hidden", "false");
    trigger.setAttribute("aria-expanded", "true");
  }

  function hideGlossaryTooltip() {
    el.tooltip.classList.add("is-hidden");
    el.tooltip.setAttribute("aria-hidden", "true");
    el.tooltipTitle.textContent = "";
    el.tooltipBody.textContent = "";
    root
      .querySelectorAll("[data-glossary-term]")
      .forEach((t) => t.setAttribute("aria-expanded", "false"));
  }

  function renderPracticeQuestion(
    question,
    questionIndex,
    totalQuestions,
    selectedAnswer,
  ) {
    el.practiceQuestionView.classList.remove("is-hidden");
    el.practiceFeedbackView.classList.add("is-hidden");
    el.practiceScoreView.classList.add("is-hidden");
    el.practiceProgress.textContent = `Question ${questionIndex + 1} of ${totalQuestions}`;
    el.practiceQuestion.textContent = question.question;
    el.practiceOptions.replaceChildren(
      ...question.options.map((option) =>
        createOptionButton(
          option,
          selectedAnswer,
          handlers.onPracticeAnswerSelect,
        ),
      ),
    );
    el.practiceSubmit.disabled = !selectedAnswer;
  }

  function renderPracticeFeedback(
    question,
    isCorrect,
    selectedAnswer,
    isLastQuestion,
  ) {
    el.practiceQuestionView.classList.add("is-hidden");
    el.practiceFeedbackView.classList.remove("is-hidden");
    el.practiceScoreView.classList.add("is-hidden");
    el.practiceSubmit.disabled = true;
    el.practiceFeedback.className = `practice-feedback ${isCorrect ? "is-correct" : "is-incorrect"}`;
    el.practiceFeedback.textContent = isCorrect
      ? `Correct. You answered: ${selectedAnswer}`
      : `Incorrect. You answered: ${selectedAnswer}. Correct answer: ${question.answer}`;
    el.practiceHint.textContent = `Hint: ${question.hint}`;
    el.practiceExplanation.textContent = question.explanation;
    el.practiceNext.textContent = isLastQuestion ? "Show Score" : "Next";
  }

  function renderPracticeScore(score, totalQuestions) {
    el.practiceQuestionView.classList.add("is-hidden");
    el.practiceFeedbackView.classList.add("is-hidden");
    el.practiceScoreView.classList.remove("is-hidden");
    el.practiceProgress.textContent = "Score ready";
    el.practiceScore.textContent = `You scored ${score} out of ${totalQuestions}.`;
  }

  function renderProgress(progress) {
    const visitedValue = progress.visited.length
      ? progress.visited.join(", ")
      : "None";
    const quizScoreValue = Object.keys(progress.quizScore).length
      ? Object.entries(progress.quizScore)
          .map(([k, v]) => `${k}: ${v}`)
          .join(" | ")
      : "None";
    const quizAttemptedValue = Object.keys(progress.quizAttempted).length
      ? Object.entries(progress.quizAttempted)
          .map(([k, v]) => `${k}: ${v ? "Yes" : "No"}`)
          .join(" | ")
      : "None";

    if (el.progressVisited) el.progressVisited.textContent = visitedValue;
    if (el.progressQuizScore) el.progressQuizScore.textContent = quizScoreValue;
    if (el.progressQuizAttempted)
      el.progressQuizAttempted.textContent = quizAttemptedValue;
  }

  function renderLessonStage(
    stage,
    stageIndex,
    totalStages,
    isFirst,
    isLast,
    progressFraction,
  ) {
    if (!el.lessonBar) return;
    el.lessonBar.classList.remove("is-hidden");
    if (el.lessonStageTitle)
      el.lessonStageTitle.textContent = `${stageIndex + 1} / ${totalStages} — ${stage.title}`;
    if (el.lessonStagePrompt) el.lessonStagePrompt.textContent = stage.prompt;
    if (el.lessonPrev) el.lessonPrev.disabled = isFirst;
    if (el.lessonNext) el.lessonNext.textContent = isLast ? "Finish" : "Next →";
    if (el.lessonProgress) {
      el.lessonProgress.style.width = `${Math.round(progressFraction * 100)}%`;
    }
  }

  function showLoadingState() {
    PANEL_KEYS.forEach((key) => {
      el.diagrams[key].innerHTML =
        `<p class="empty-state">Rendering diagram ${key.toUpperCase()}...</p>`;
    });
  }

  return {
    renderCase,
    renderCompareMode,
    renderTheme,
    renderDerivation,
    renderGlobalError,
    renderEditableInput,
    renderGrammarError,
    renderGlossaryTooltip,
    hideGlossaryTooltip,
    renderPracticeQuestion,
    renderPracticeFeedback,
    renderPracticeScore,
    renderProgress,
    renderPanelError,
    renderLessonStage,
    showLoadingState,
    renderPanelDiagram,
    getDiagramStage,
    renderRuleCallout,
    clearRuleCallout,
  };
}
