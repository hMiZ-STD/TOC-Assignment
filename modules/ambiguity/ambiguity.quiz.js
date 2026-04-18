/**
 * @file ambiguity.quiz.js
 * @module AmbiguityQuiz
 * @description Quiz helpers for validating ambiguity quiz data without rendering quiz UI yet.
 */

export function getQuizItems(caseStudy) {
  if (!caseStudy || !Array.isArray(caseStudy.quiz)) {
    return [];
  }

  return caseStudy.quiz;
}

export function hasValidQuizSchema(caseStudy) {
  return getQuizItems(caseStudy).every((item) => {
    return (
      typeof item.question === "string" &&
      item.type === "mcq" &&
      Array.isArray(item.options) &&
      item.options.length >= 2 &&
      item.options.every((option) => typeof option === "string") &&
      typeof item.answer === "string" &&
      item.options.includes(item.answer) &&
      typeof item.hint === "string" &&
      typeof item.explanation === "string"
    );
  });
}

export function getQuizQuestion(caseStudy, questionIndex) {
  return getQuizItems(caseStudy)[questionIndex] ?? null;
}

export function isCorrectQuizAnswer(question, answer) {
  if (!question) {
    return false;
  }

  return question.answer.trim() === answer.trim();
}
