/**
 * @file ambiguity.ui.js
 * @module AmbiguityUI
 * @description UI renderer and event wiring for the ambiguity module.
 */

import { clearError, showError } from "../../core/utils.js";
import { glossaryTerms } from "../../data/glossary.data.js";

const CASE_TITLES = {
  precedence: "Operator Precedence Trap",
  dangling: "Dangling Else Problem",
  epsilon: "Epsilon Loop Structure",
  associativity: "Arithmetic Associativity",
  concatenation: "Nested Concatenation",
  language: "Natural Language",
};

const CASE_TEASERS = {
  precedence: "Does `id + id * id` have one meaning, or two equally valid parses?",
  dangling: "When one `else` appears, which `if` is it supposed to belong to?",
  epsilon: "Can the empty string come from one parse tree, or from a whole family of disappearing branches?",
  associativity: "If subtraction repeats, does the grammar force left association or right association?",
  concatenation: "For `aaa`, where should the binary split happen first?",
  language: "Can `I saw her` be one sentence structure, or two different grammatical stories?",
};

function buildGlossaryPattern() {
  const terms = Object.keys(glossaryTerms)
    .sort((left, right) => right.length - left.length)
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
      fragment.append(document.createTextNode(text.slice(lastIndex, matchIndex)));
    }

    const glossaryTerm = Object.keys(glossaryTerms).find((entry) => entry.toLowerCase() === term.toLowerCase()) ?? term;
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

function createOptionButton(option, selectedValue, callback) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "practice-option";
  button.textContent = option;
  button.dataset.option = option;
  button.setAttribute("role", "radio");
  button.setAttribute("aria-checked", String(option === selectedValue));
  if (option === selectedValue) {
    button.classList.add("is-selected");
  }
  button.addEventListener("click", () => {
    callback(option);
  });
  return button;
}

function animateEntry(element, className) {
  if (!element) {
    return;
  }

  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

export function createAmbiguityUI(root, handlers) {
  const elements = {
    navButtons: Array.from(root.querySelectorAll("[data-case-key]")),
    moduleTitle: root.querySelector("#module-title"),
    grammarForm: root.querySelector("#grammar-form"),
    grammarInput: root.querySelector("#grammar-input"),
    stringInput: root.querySelector("#string-input"),
    grammarError: root.querySelector("#grammar-error"),
    progressVisited: root.querySelector("#progress-visited"),
    progressQuizScore: root.querySelector("#progress-quiz-score"),
    progressQuizAttempted: root.querySelector("#progress-quiz-attempted"),
    grammarDisplay: root.querySelector("#grammar-display"),
    stringDisplay: root.querySelector("#string-display"),
    caseTeaser: root.querySelector("#case-teaser"),
    labelA: root.querySelector("#label-a"),
    labelB: root.querySelector("#label-b"),
    prevA: root.querySelector("#prev-a"),
    nextA: root.querySelector("#next-a"),
    playA: root.querySelector("#play-a"),
    stepCounterA: root.querySelector("#step-counter-a"),
    stepTextA: root.querySelector("#step-text-a"),
    prevB: root.querySelector("#prev-b"),
    nextB: root.querySelector("#next-b"),
    playB: root.querySelector("#play-b"),
    stepCounterB: root.querySelector("#step-counter-b"),
    stepTextB: root.querySelector("#step-text-b"),
    explanationA: root.querySelector("#explanation-a"),
    explanationB: root.querySelector("#explanation-b"),
    diagramA: root.querySelector("#mermaid-a"),
    diagramB: root.querySelector("#mermaid-b"),
    appError: root.querySelector("#app-error"),
    errorA: root.querySelector("#error-a"),
    errorB: root.querySelector("#error-b"),
    compareToggle: root.querySelector("#compare-mode"),
    themeToggle: root.querySelector("#theme-toggle"),
    canvasArea: root.querySelector("#canvas-area"),
    panelA: root.querySelector("#interp-a"),
    panelB: root.querySelector("#interp-b"),
    tooltip: document.querySelector("#glossary-tooltip"),
    tooltipTitle: document.querySelector("#glossary-tooltip-title"),
    tooltipBody: document.querySelector("#glossary-tooltip-body"),
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
  };

  elements.navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      handlers.onCaseChange(button.dataset.caseKey);
    });
  });

  elements.compareToggle.addEventListener("change", (event) => {
    handlers.onCompareModeChange(event.target.checked);
  });

  elements.themeToggle.addEventListener("click", () => {
    handlers.onThemeToggle();
  });

  elements.grammarForm.addEventListener("submit", (event) => {
    event.preventDefault();
    handlers.onGrammarSubmit({
      grammar: elements.grammarInput.value,
      string: elements.stringInput.value,
    });
  });

  elements.prevA.addEventListener("click", () => {
    handlers.onDerivationPrev("a");
  });
  elements.nextA.addEventListener("click", () => {
    handlers.onDerivationNext("a");
  });
  elements.playA.addEventListener("click", () => {
    handlers.onDerivationPlayToggle("a");
  });
  elements.prevB.addEventListener("click", () => {
    handlers.onDerivationPrev("b");
  });
  elements.nextB.addEventListener("click", () => {
    handlers.onDerivationNext("b");
  });
  elements.playB.addEventListener("click", () => {
    handlers.onDerivationPlayToggle("b");
  });

  root.addEventListener("mouseover", (event) => {
    const trigger = event.target.closest("[data-glossary-term]");
    if (trigger) {
      handlers.onGlossaryEnter(trigger.dataset.glossaryTerm, trigger);
    }
  });
  root.addEventListener("mouseout", (event) => {
    const trigger = event.target.closest("[data-glossary-term]");
    if (!trigger) {
      return;
    }
    const relatedTarget = event.relatedTarget;
    if (!relatedTarget || !trigger.contains(relatedTarget)) {
      handlers.onGlossaryLeave();
    }
  });
  root.addEventListener("focusin", (event) => {
    const trigger = event.target.closest("[data-glossary-term]");
    if (trigger) {
      handlers.onGlossaryEnter(trigger.dataset.glossaryTerm, trigger);
    }
  });
  root.addEventListener("focusout", (event) => {
    const trigger = event.target.closest("[data-glossary-term]");
    if (trigger) {
      handlers.onGlossaryLeave();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      handlers.onGlossaryEscape();
    }
  });

  elements.practiceSubmit.addEventListener("click", () => {
    handlers.onPracticeSubmit();
  });
  elements.practiceNext.addEventListener("click", () => {
    handlers.onPracticeNext();
  });
  elements.practiceRestart.addEventListener("click", () => {
    handlers.onPracticeRestart();
  });

  function renderCase(caseKey, caseStudy, visitedCaseKeys) {
    elements.navButtons.forEach((button) => {
      const isActive = button.dataset.caseKey === caseKey;
      const isVisited = visitedCaseKeys.includes(button.dataset.caseKey);
      const buttonCase = button.dataset.caseKey === caseKey ? caseStudy : null;
      const title = buttonCase?.title ?? CASE_TITLES[button.dataset.caseKey] ?? button.dataset.caseKey;
      const teaser = buttonCase?.teaser ?? CASE_TEASERS[button.dataset.caseKey] ?? "";

      button.classList.toggle("is-active", isActive);
      button.classList.toggle("is-complete", isVisited && !isActive);
      button.innerHTML = `
        <span class="nav-button-title">${title}</span>
        <span class="nav-button-copy">${teaser}</span>
      `;
    });

    elements.moduleTitle.textContent = caseStudy.title;
    elements.caseTeaser.textContent = caseStudy.teaser;
    elements.grammarDisplay.textContent = caseStudy.grammar;
    elements.stringDisplay.textContent = caseStudy.string;
    elements.labelA.textContent = caseStudy.interpretations.a.label;
    elements.labelB.textContent = caseStudy.interpretations.b.label;
    elements.explanationA.replaceChildren(createGlossaryFragment(caseStudy.interpretations.a.explanation));
    elements.explanationB.replaceChildren(createGlossaryFragment(caseStudy.interpretations.b.explanation));
    elements.panelA.classList.remove("is-hidden");
    elements.practiceCard.classList.remove("is-hidden");
  }

  function renderEditableInput(grammar, stringValue) {
    elements.grammarInput.value = grammar;
    elements.stringInput.value = stringValue;
    elements.grammarDisplay.textContent = grammar;
    elements.stringDisplay.textContent = stringValue;
  }

  function renderPanelDiagram(panelKey, diagramMarkup) {
    if (panelKey === "a") {
      elements.diagramA.innerHTML = diagramMarkup;
      animateEntry(elements.panelA, "is-panel-entering");
    } else {
      elements.diagramB.innerHTML = diagramMarkup;
      animateEntry(elements.panelB, "is-panel-entering");
    }
  }

  function getDiagramStage(panelKey) {
    return panelKey === "a" ? elements.diagramA : elements.diagramB;
  }

  function clearRuleCallout(panelKey) {
    const stage = getDiagramStage(panelKey);
    stage.querySelector(".rule-callout")?.remove();
  }

  function renderRuleCallout(panelKey, text, position = null) {
    const stage = getDiagramStage(panelKey);
    clearRuleCallout(panelKey);

    if (!text) {
      return;
    }

    const callout = document.createElement("div");
    callout.className = "rule-callout";
    callout.textContent = text;
    if (position) {
      callout.style.left = `${position.left}px`;
      callout.style.top = `${position.top}px`;
    } else {
      callout.style.left = "16px";
      callout.style.top = "16px";
    }
    stage.append(callout);
  }

  function renderDerivation(panelKey, stepIndex, stepTotal, stepText, isPlaying) {
    const isPanelA = panelKey === "a";
    const prevButton = isPanelA ? elements.prevA : elements.prevB;
    const nextButton = isPanelA ? elements.nextA : elements.nextB;
    const playButton = isPanelA ? elements.playA : elements.playB;
    const counter = isPanelA ? elements.stepCounterA : elements.stepCounterB;
    const text = isPanelA ? elements.stepTextA : elements.stepTextB;
    const lastIndex = stepTotal - 1;

    prevButton.disabled = stepIndex <= 0;
    nextButton.disabled = stepIndex >= lastIndex;
    playButton.textContent = isPlaying ? "Pause" : "Play";
    counter.textContent = `Step ${stepIndex + 1} of ${stepTotal}`;
    text.textContent = stepText;
  }

  function renderCompareMode(isCompareMode) {
    elements.compareToggle.checked = isCompareMode;
    elements.panelB.classList.toggle("is-hidden", !isCompareMode);
    elements.canvasArea.classList.toggle("is-single", !isCompareMode);
  }

  function renderTheme(theme) {
    const isDark = theme === "dark";
    elements.themeToggle.setAttribute("aria-pressed", String(isDark));
    elements.themeToggle.textContent = isDark ? "Switch to light theme" : "Switch to dark theme";
  }

  function renderGlobalError(message) {
    if (message) {
      showError(elements.appError, message);
      return;
    }
    clearError(elements.appError);
  }

  function renderPanelError(panelKey, message) {
    const target = panelKey === "a" ? elements.errorA : elements.errorB;
    if (message) {
      showError(target, message);
      return;
    }
    clearError(target);
  }

  function renderGrammarError(message) {
    if (message) {
      showError(elements.grammarError, message);
      return;
    }
    clearError(elements.grammarError);
  }

  function renderGlossaryTooltip(term, trigger) {
    const description = glossaryTerms[term];
    if (!description) {
      return;
    }
    elements.tooltipTitle.textContent = term;
    elements.tooltipBody.textContent = description;
    elements.tooltip.classList.remove("is-hidden");
    elements.tooltip.setAttribute("aria-hidden", "false");
    trigger.setAttribute("aria-expanded", "true");
  }

  function hideGlossaryTooltip() {
    elements.tooltip.classList.add("is-hidden");
    elements.tooltip.setAttribute("aria-hidden", "true");
    elements.tooltipTitle.textContent = "";
    elements.tooltipBody.textContent = "";
    root.querySelectorAll("[data-glossary-term]").forEach((trigger) => {
      trigger.setAttribute("aria-expanded", "false");
    });
  }

  function renderPracticeQuestion(question, questionIndex, totalQuestions, selectedAnswer) {
    elements.practiceQuestionView.classList.remove("is-hidden");
    elements.practiceFeedbackView.classList.add("is-hidden");
    elements.practiceScoreView.classList.add("is-hidden");
    elements.practiceProgress.textContent = `Question ${questionIndex + 1} of ${totalQuestions}`;
    elements.practiceQuestion.textContent = question.question;
    elements.practiceOptions.replaceChildren(
      ...question.options.map((option) => createOptionButton(option, selectedAnswer, handlers.onPracticeAnswerSelect)),
    );
    elements.practiceSubmit.disabled = !selectedAnswer;
  }

  function renderPracticeFeedback(question, isCorrect, selectedAnswer, isLastQuestion) {
    elements.practiceQuestionView.classList.add("is-hidden");
    elements.practiceFeedbackView.classList.remove("is-hidden");
    elements.practiceScoreView.classList.add("is-hidden");
    elements.practiceSubmit.disabled = true;
    elements.practiceFeedback.className = `practice-feedback ${isCorrect ? "is-correct" : "is-incorrect"}`;
    elements.practiceFeedback.textContent = isCorrect
      ? `Correct. You answered: ${selectedAnswer}`
      : `Incorrect. You answered: ${selectedAnswer}. Correct answer: ${question.answer}`;
    elements.practiceHint.textContent = `Hint: ${question.hint}`;
    elements.practiceExplanation.textContent = question.explanation;
    elements.practiceNext.textContent = isLastQuestion ? "Show Score" : "Next";
  }

  function renderPracticeScore(score, totalQuestions) {
    elements.practiceQuestionView.classList.add("is-hidden");
    elements.practiceFeedbackView.classList.add("is-hidden");
    elements.practiceScoreView.classList.remove("is-hidden");
    elements.practiceProgress.textContent = "Score ready";
    elements.practiceScore.textContent = `You scored ${score} out of ${totalQuestions}.`;
  }

  function renderProgress(progress) {
    const visitedValue = progress.visited.length ? progress.visited.join(", ") : "None";
    const quizScoreValue = Object.keys(progress.quizScore).length
      ? Object.entries(progress.quizScore)
          .map(([caseKey, score]) => `${caseKey}: ${score}`)
          .join(" | ")
      : "None";
    const quizAttemptedValue = Object.keys(progress.quizAttempted).length
      ? Object.entries(progress.quizAttempted)
          .map(([caseKey, attempted]) => `${caseKey}: ${attempted ? "Yes" : "No"}`)
          .join(" | ")
      : "None";

    elements.progressVisited.textContent = visitedValue;
    elements.progressQuizScore.textContent = quizScoreValue;
    elements.progressQuizAttempted.textContent = quizAttemptedValue;
  }

  function showLoadingState() {
    elements.diagramA.innerHTML = '<p class="empty-state">Rendering diagram A...</p>';
    elements.diagramB.innerHTML = '<p class="empty-state">Rendering diagram B...</p>';
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
    showLoadingState,
    renderPanelDiagram,
    getDiagramStage,
    renderRuleCallout,
    clearRuleCallout,
  };
}
