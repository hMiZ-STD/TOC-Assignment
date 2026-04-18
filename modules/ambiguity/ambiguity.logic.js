/**
 * @file ambiguity.logic.js
 * @module AmbiguityLogic
 * @description Pure module logic for reading and validating ambiguity case data.
 */

import { ambiguityCases } from "../../data/ambiguity.data.js";
import { BUILT_IN_STAGE_IDS } from "../../core/constants.js";
import { getQuizItems, hasValidQuizSchema } from "./ambiguity.quiz.js";

function hasValidInterpretations(interpretations) {
  if (!interpretations || typeof interpretations !== "object") {
    return false;
  }

  return ["a", "b"].every((key) => {
    const entry = interpretations[key];

    return (
      entry &&
      typeof entry.label === "string" &&
      typeof entry.explanation === "string" &&
      Array.isArray(entry.derivationSteps) &&
      entry.derivationSteps.length > 0 &&
      entry.derivationSteps.every((step) => typeof step === "string") &&
      Array.isArray(entry.diagrams) &&
      entry.diagrams.length === entry.derivationSteps.length &&
      entry.diagrams.every((d) => typeof d === "string")
    );
  });
}

function hasValidStages(stages) {
  return (
    Array.isArray(stages) &&
    stages.length === BUILT_IN_STAGE_IDS.length &&
    stages.every((stage, index) => {
      return (
        stage &&
        stage.id === BUILT_IN_STAGE_IDS[index] &&
        typeof stage.title === "string" &&
        typeof stage.prompt === "string" &&
        Array.isArray(stage.spotlight)
      );
    })
  );
}

export function listCaseKeys() {
  return Object.keys(ambiguityCases);
}

export function getCaseStudy(caseKey) {
  return ambiguityCases[caseKey] ?? null;
}

function normalizeGrammar(grammar) {
  return String(grammar ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function normalizeInputString(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function segmentCompactChunk(chunk, nonTerminalList) {
  const memo = new Map();

  function segmentFrom(index) {
    if (index === chunk.length) {
      return [];
    }

    if (memo.has(index)) {
      return memo.get(index);
    }

    for (const symbol of nonTerminalList) {
      if (!chunk.startsWith(symbol, index)) {
        continue;
      }

      const remainder = segmentFrom(index + symbol.length);
      if (remainder) {
        const segmented = [symbol, ...remainder];
        memo.set(index, segmented);
        return segmented;
      }
    }

    memo.set(index, null);
    return null;
  }

  return segmentFrom(0);
}

function tokenizeBranch(branch, nonTerminalList) {
  if (branch === "epsilon") {
    return ["epsilon"];
  }

  if (/\s/.test(branch)) {
    return branch.split(/\s+/).filter(Boolean);
  }

  const symbols = [];
  let cursor = 0;

  while (cursor < branch.length) {
    const current = branch[cursor];

    if (/\s/.test(current)) {
      cursor++;
      continue;
    }

    const matchedNonTerminal = nonTerminalList.find((symbol) =>
      branch.startsWith(symbol, cursor),
    );
    if (matchedNonTerminal) {
      symbols.push(matchedNonTerminal);
      cursor += matchedNonTerminal.length;
      continue;
    }

    if (/[^A-Za-z0-9_]/.test(current)) {
      symbols.push(current);
      cursor++;
      continue;
    }

    let nextCursor = cursor;
    while (
      nextCursor < branch.length &&
      /[A-Za-z0-9_]/.test(branch[nextCursor])
    ) {
      nextCursor++;
    }

    const chunk = branch.slice(cursor, nextCursor);
    const segmentedChunk = segmentCompactChunk(chunk, nonTerminalList);
    if (segmentedChunk && segmentedChunk.length > 1) {
      symbols.push(...segmentedChunk);
    } else {
      symbols.push(chunk);
    }

    cursor = nextCursor;
  }

  return symbols;
}

function parseGrammar(grammar) {
  const normalizedGrammar = normalizeGrammar(grammar);
  const rules = normalizedGrammar.split("\n").filter(Boolean);
  const startSymbol = rules[0]?.split("->")[0]?.trim() || "S";
  const nonTerminalList = rules
    .map((rule) => rule.split("->")[0]?.trim())
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);
  const nonTerminals = new Set(nonTerminalList);
  const productions = {};

  rules.forEach((rule) => {
    const [leftSide, rightSide] = rule.split("->").map((part) => part.trim());
    const branches = rightSide
      .split("|")
      .map((branch) => branch.trim())
      .filter(Boolean);
    productions[leftSide] = branches.map((branch) =>
      tokenizeBranch(branch, nonTerminalList),
    );
  });

  const terminals = new Set();
  Object.values(productions).forEach((branches) => {
    branches.forEach((branch) => {
      branch.forEach((symbol) => {
        if (symbol !== "epsilon" && !nonTerminals.has(symbol)) {
          terminals.add(symbol);
        }
      });
    });
  });

  return {
    startSymbol,
    productions,
    nonTerminals,
    nonTerminalList,
    terminals: Array.from(terminals).sort(
      (left, right) => right.length - left.length,
    ),
  };
}

function tokenizeInputString(inputString, grammarSpec) {
  const normalizedString = normalizeInputString(inputString);

  if (!normalizedString || normalizedString === "epsilon") {
    return [];
  }

  if (/\s/.test(normalizedString)) {
    return normalizedString.split(/\s+/).filter(Boolean);
  }

  const tokens = [];
  let cursor = 0;

  while (cursor < normalizedString.length) {
    const matchedTerminal = grammarSpec.terminals.find((terminal) =>
      normalizedString.startsWith(terminal, cursor),
    );
    if (matchedTerminal) {
      tokens.push(matchedTerminal);
      cursor += matchedTerminal.length;
      continue;
    }

    const current = normalizedString[cursor];
    if (/[^A-Za-z0-9_]/.test(current)) {
      tokens.push(current);
      cursor++;
      continue;
    }

    let nextCursor = cursor;
    while (
      nextCursor < normalizedString.length &&
      /[A-Za-z0-9_]/.test(normalizedString[nextCursor])
    ) {
      nextCursor++;
    }
    tokens.push(normalizedString.slice(cursor, nextCursor));
    cursor = nextCursor;
  }

  return tokens;
}

function computeMinTokens(grammarSpec) {
  const minTokens = {};
  grammarSpec.nonTerminalList.forEach((symbol) => {
    minTokens[symbol] = Number.POSITIVE_INFINITY;
  });

  let didChange = true;
  while (didChange) {
    didChange = false;

    grammarSpec.nonTerminalList.forEach((symbol) => {
      const branches = grammarSpec.productions[symbol] ?? [];
      branches.forEach((branch) => {
        let total = 0;
        let isResolvable = true;

        branch.forEach((entry) => {
          if (entry === "epsilon") {
            return;
          }

          if (grammarSpec.nonTerminals.has(entry)) {
            if (!Number.isFinite(minTokens[entry])) {
              isResolvable = false;
              return;
            }

            total += minTokens[entry];
            return;
          }

          total += 1;
        });

        if (isResolvable && total < minTokens[symbol]) {
          minTokens[symbol] = total;
          didChange = true;
        }
      });
    });
  }

  return minTokens;
}

function createNodeFactory() {
  let nodeId = 0;

  return function createNode(symbol, kind) {
    nodeId += 1;
    return {
      id: nodeId,
      symbol,
      kind,
      children: kind === "nonterminal" ? null : [],
    };
  };
}

function cloneTreeWithExpansion(node, targetId, nextChildren) {
  const clonedNode = {
    id: node.id,
    symbol: node.symbol,
    kind: node.kind,
    children: node.children,
  };

  if (node.id === targetId) {
    clonedNode.children = nextChildren;
    return clonedNode;
  }

  if (Array.isArray(node.children)) {
    clonedNode.children = node.children.map((child) =>
      cloneTreeWithExpansion(child, targetId, nextChildren),
    );
  }

  return clonedNode;
}

function getLeafNodes(node, leaves = []) {
  if (!Array.isArray(node.children) || node.children.length === 0) {
    leaves.push(node);
    return leaves;
  }

  node.children.forEach((child) => {
    getLeafNodes(child, leaves);
  });
  return leaves;
}

function getLeftmostPendingLeaf(root) {
  return (
    getLeafNodes(root).find(
      (node) => node.kind === "nonterminal" && node.children === null,
    ) ?? null
  );
}

function isSubsequence(sequence, target) {
  let sequenceIndex = 0;

  for (
    let targetIndex = 0;
    targetIndex < target.length && sequenceIndex < sequence.length;
    targetIndex += 1
  ) {
    if (sequence[sequenceIndex] === target[targetIndex]) {
      sequenceIndex += 1;
    }
  }

  return sequenceIndex === sequence.length;
}

function getFixedEdgeTokens(leaves, grammarSpec) {
  const pendingIndexes = leaves
    .map((leaf, index) =>
      leaf.kind === "nonterminal" && leaf.children === null ? index : -1,
    )
    .filter((index) => index >= 0);
  const firstPendingIndex = pendingIndexes[0] ?? leaves.length;
  const lastPendingIndex = pendingIndexes[pendingIndexes.length - 1] ?? -1;

  const prefix = leaves
    .slice(0, firstPendingIndex)
    .filter((leaf) => leaf.kind === "terminal")
    .map((leaf) => leaf.symbol);
  const suffix = leaves
    .slice(lastPendingIndex + 1)
    .filter((leaf) => leaf.kind === "terminal")
    .map((leaf) => leaf.symbol);

  return {
    prefix,
    suffix,
    concrete: leaves
      .filter((leaf) => leaf.kind === "terminal")
      .map((leaf) => leaf.symbol),
  };
}

function matchesEdgeTokens(prefix, suffix, targetTokens) {
  if (
    prefix.length > targetTokens.length ||
    suffix.length > targetTokens.length
  ) {
    return false;
  }

  const targetPrefix = targetTokens.slice(0, prefix.length);
  const targetSuffix = suffix.length
    ? targetTokens.slice(targetTokens.length - suffix.length)
    : [];

  return (
    prefix.every((token, index) => token === targetPrefix[index]) &&
    suffix.every((token, index) => token === targetSuffix[index])
  );
}

function getMinimumPossibleTokens(leaves, minTokens) {
  let total = 0;

  for (const leaf of leaves) {
    if (leaf.kind === "epsilon") {
      continue;
    }

    if (leaf.kind === "terminal") {
      total += 1;
      continue;
    }

    const symbolMinimum = minTokens[leaf.symbol];
    if (!Number.isFinite(symbolMinimum)) {
      return Number.POSITIVE_INFINITY;
    }

    total += symbolMinimum;
  }

  return total;
}

function formatSententialForm(root) {
  const visibleLeaves = getLeafNodes(root)
    .map((leaf) => leaf.symbol)
    .filter((symbol) => symbol !== "");

  if (!visibleLeaves.length) {
    return "epsilon";
  }

  const value = visibleLeaves.join(" ").trim();
  return value || "epsilon";
}

function buildTreeSignature(node) {
  if (!Array.isArray(node.children) || node.children.length === 0) {
    return node.symbol;
  }

  return `${node.symbol}(${node.children.map((child) => buildTreeSignature(child)).join(",")})`;
}

function escapeMermaidLabel(value) {
  return String(value).replace(/"/g, '\\"');
}

function buildDiagramFromTree(root, diagramKey) {
  const nodes = [];
  const edges = [];

  function traverse(node) {
    const nodeId = `${diagramKey}_${node.id}`;
    nodes.push(`${nodeId}["${escapeMermaidLabel(node.symbol)}"]`);

    if (Array.isArray(node.children)) {
      node.children.forEach((child) => {
        const childId = `${diagramKey}_${child.id}`;
        edges.push(`${nodeId} --> ${childId}`);
        traverse(child);
      });
    }
  }

  traverse(root);
  return `flowchart TD\n  ${[...nodes, ...edges].join("\n  ")}`;
}

function canStillReachTarget(root, grammarSpec, targetTokens, minTokens) {
  const leaves = getLeafNodes(root);
  const { prefix, suffix, concrete } = getFixedEdgeTokens(leaves, grammarSpec);

  if (!matchesEdgeTokens(prefix, suffix, targetTokens)) {
    return false;
  }

  if (!isSubsequence(concrete, targetTokens)) {
    return false;
  }

  return getMinimumPossibleTokens(leaves, minTokens) <= targetTokens.length;
}

function matchesTarget(root, grammarSpec, targetTokens) {
  const leaves = getLeafNodes(root);
  const hasPendingLeaf = leaves.some(
    (leaf) => leaf.kind === "nonterminal" && leaf.children === null,
  );
  if (hasPendingLeaf) {
    return false;
  }

  const concreteTokens = leaves
    .filter((leaf) => leaf.kind === "terminal")
    .map((leaf) => leaf.symbol);
  return (
    concreteTokens.length === targetTokens.length &&
    concreteTokens.every((token, index) => token === targetTokens[index])
  );
}

function generateParseInterpretations(grammar, inputString) {
  const grammarSpec = parseGrammar(grammar);
  const targetTokens = tokenizeInputString(inputString, grammarSpec);
  const minTokens = computeMinTokens(grammarSpec);
  const createNode = createNodeFactory();
  const classifySymbol = (symbol) => {
    if (symbol === "epsilon") {
      return "epsilon";
    }

    return grammarSpec.nonTerminals.has(symbol) ? "nonterminal" : "terminal";
  };

  const initialRoot = createNode(grammarSpec.startSymbol, "nonterminal");
  const maxInterpretations = 2;
  const maxStates = 12000;
  const maxExpansions = Math.max(12, targetTokens.length * 6 + 10);
  const queue = [
    {
      root: initialRoot,
      steps: [formatSententialForm(initialRoot)],
      history: [initialRoot],
      expansions: 0,
    },
  ];
  const accepted = [];
  const acceptedSignatures = new Set();
  let processedStates = 0;

  while (
    queue.length &&
    accepted.length < maxInterpretations &&
    processedStates < maxStates
  ) {
    const current = queue.shift();
    processedStates += 1;

    if (
      !canStillReachTarget(current.root, grammarSpec, targetTokens, minTokens)
    ) {
      continue;
    }

    if (matchesTarget(current.root, grammarSpec, targetTokens)) {
      const signature = buildTreeSignature(current.root);
      if (!acceptedSignatures.has(signature)) {
        acceptedSignatures.add(signature);
        accepted.push(current);
      }
      continue;
    }

    if (current.expansions >= maxExpansions) {
      continue;
    }

    const pendingLeaf = getLeftmostPendingLeaf(current.root);
    if (!pendingLeaf) {
      continue;
    }

    const branches = grammarSpec.productions[pendingLeaf.symbol] ?? [];
    branches.forEach((branch) => {
      const nextChildren = branch.map((symbol) =>
        createNode(symbol, classifySymbol(symbol)),
      );
      const nextRoot = cloneTreeWithExpansion(
        current.root,
        pendingLeaf.id,
        nextChildren,
      );
      queue.push({
        root: nextRoot,
        steps: [...current.steps, formatSententialForm(nextRoot)],
        history: [...current.history, nextRoot],
        expansions: current.expansions + 1,
      });
    });
  }

  return {
    grammarSpec,
    targetTokens,
    interpretations: accepted.map((entry, index) => {
      return {
        label: `Generated parse ${index + 1}`,
        derivationSteps: entry.steps,
        diagrams: entry.history.map((tree, stepIndex) =>
          buildDiagramFromTree(tree, `Custom${index}_${stepIndex}`),
        ),
        explanation:
          "This derivation was generated from the grammar and input you submitted, and each diagram step reflects the next expansion in the parse tree.",
      };
    }),
  };
}

function buildEmptyInterpretation(message, startSymbol, diagramKey) {
  const root = {
    id: 0,
    symbol: startSymbol,
    kind: "nonterminal",
    children: null,
  };

  return {
    label: message,
    derivationSteps: [message],
    diagrams: [buildDiagramFromTree(root, diagramKey)],
    explanation: message,
  };
}

function buildCustomCaseStudy(grammar, inputString) {
  const normalizedGrammar = normalizeGrammar(grammar);
  const normalizedString = normalizeInputString(inputString);
  const renderedString = normalizedString || "epsilon";
  const generated = generateParseInterpretations(
    normalizedGrammar,
    normalizedString,
  );
  const startSymbol = generated.grammarSpec.startSymbol;
  const interpretationA =
    generated.interpretations[0] ??
    buildEmptyInterpretation(
      "No derivation found for the submitted input.",
      startSymbol,
      "CustomMissingA",
    );
  const interpretationB =
    generated.interpretations[1] ??
    buildEmptyInterpretation(
      generated.interpretations.length
        ? "A second distinct interpretation was not found within the current search limit."
        : "No second interpretation is available because the input could not be derived.",
      startSymbol,
      "CustomMissingB",
    );
  const interpretationCount = generated.interpretations.length;
  const title =
    interpretationCount >= 2
      ? "Custom Grammar Ambiguity Analysis"
      : interpretationCount === 1
        ? "Custom Grammar Derivation"
        : "Custom Grammar Analysis";
  const lesson =
    interpretationCount >= 2
      ? "The submitted grammar produced at least two distinct parse trees for this input, so the step-by-step panels now show different derivations generated from your own grammar."
      : interpretationCount === 1
        ? "The simulator found one derivation for your submitted grammar and input, so the panels now use generated derivation steps instead of stale preset diagrams."
        : "The simulator could not derive the submitted input from the grammar within the current search limit, so no valid step-by-step interpretation was available to animate.";
  const fix =
    interpretationCount >= 2
      ? "To remove ambiguity, rewrite the grammar so the input can be derived in only one intended structural way."
      : interpretationCount === 1
        ? "If you expected a second interpretation, the grammar may be unambiguous for this input or may need a broader parser/search strategy."
        : "Check the token spacing, grammar rules, and start symbol, then try again with a derivable input string.";
  const diagnosisPrompt =
    interpretationCount >= 2
      ? "These generated parse trees show a structural ambiguity, but the semantic consequence depends on the language your grammar is modeling."
      : interpretationCount === 1
        ? "Only one derivation was found for this input, so there is no second competing interpretation to compare."
        : "No derivation was found, so the simulator cannot diagnose ambiguity for this grammar and string.";

  const stages = [
    {
      id: "setup",
      title: "Setup",
      prompt:
        "This panel is using generated content because the grammar and string do not match one of the built-in authored case studies.",
      spotlight: normalizedGrammar.split("\n").slice(0, 3),
      callout:
        "Generated mode focuses on structure and derivability rather than pre-written teaching copy.",
    },
    {
      id: "prediction",
      title: "Make A Prediction",
      prompt:
        "How many parse trees do you think this grammar has for the submitted input?",
      spotlight: normalizedGrammar.split("\n").slice(0, 3),
      callout: "Prediction remains available even for custom grammars.",
      options: ["At least two distinct parses", "Exactly one parse or none"],
      correctOption:
        interpretationCount >= 2
          ? "At least two distinct parses"
          : "Exactly one parse or none",
      feedbackCorrect:
        "That matches what the generated analysis found for this grammar and input.",
      feedbackWrong:
        "The generated analysis found a different derivation count than your prediction.",
    },
    {
      id: "walkA",
      title: "Walkthrough A",
      prompt:
        "This walkthrough shows the first generated derivation found for your grammar and input.",
      spotlight: normalizedGrammar.split("\n").slice(0, 3),
      callout:
        "Generated derivations do not include authored semantic commentary.",
    },
    {
      id: "walkB",
      title: "Walkthrough B",
      prompt:
        interpretationCount >= 2
          ? "This walkthrough shows a second distinct generated derivation for the same input."
          : "A second generated walkthrough is not available because the parser did not find a competing second derivation.",
      spotlight: normalizedGrammar.split("\n").slice(0, 3),
      callout:
        interpretationCount >= 2
          ? "Comparing these two derivations reveals the structural fork."
          : "If you expected another tree, the grammar may be unambiguous for this input.",
    },
    {
      id: "split",
      title: "Split Moment",
      prompt:
        interpretationCount >= 2
          ? "The compare view places both generated derivations side by side so you can inspect where their structures begin to diverge."
          : "There is no structural split to compare because the simulator did not find two distinct generated parses.",
      spotlight: normalizedGrammar.split("\n").slice(0, 3),
      callout:
        interpretationCount >= 2
          ? "Custom grammars still support structural comparison."
          : "No divergence view is available without two distinct parses.",
    },
    {
      id: "diagnosis",
      title: "Diagnosis",
      prompt: diagnosisPrompt,
      spotlight: normalizedGrammar.split("\n").slice(0, 3),
      callout: "Semantic diagnosis is not authored for custom grammars.",
    },
    {
      id: "fix",
      title: "Repair The Grammar",
      prompt:
        "A generated grammar fix walkthrough is not available for custom grammars, but the simulator can still show where structural ambiguity appears.",
      spotlight: normalizedGrammar.split("\n").slice(0, 3),
      callout:
        "Use the divergence point to decide which productions should be constrained.",
    },
    {
      id: "practice",
      title: "Practice",
      prompt:
        "Use the generic checkpoint below to test whether you can explain the ambiguity in your own grammar.",
      spotlight: normalizedGrammar.split("\n").slice(0, 3),
      callout:
        "Built-in authored quizzes are only available for the curated case studies.",
    },
  ];

  return {
    id: "custom",
    title,
    grammar: normalizedGrammar,
    string: renderedString,
    teaser: "Generated analysis for your own grammar and input.",
    lesson,
    fix: {
      grammar: normalizedGrammar.split("\n"),
      explanation: fix,
      walkthrough: [
        {
          rule: normalizedGrammar.split("\n")[0] ?? "No rule available",
          note: "Use the authored cases as models for rewriting ambiguous productions into more constrained alternatives.",
        },
      ],
      removedRules: [],
    },
    stages,
    interpretations: {
      a: interpretationA,
      b: interpretationB,
    },
    // Inside buildCustomCaseStudy, replace:  quiz: [],
    // With:
    quiz:
      interpretationCount >= 2
        ? [
            {
              type: "mcq",
              question: `Is the grammar ambiguous for the input "${renderedString}"?`,
              options: [
                "Yes — multiple parse trees exist",
                "No — only one parse tree exists",
              ],
              answer: "Yes — multiple parse trees exist",
              hint: "Count the number of distinct derivations found by the simulator.",
              explanation:
                "The simulator found at least two distinct parse trees for this input, confirming the grammar is ambiguous.",
            },
          ]
        : [],
    isCustomGrammar: true,
  };
}

export function resolveCaseStudy(caseKey, grammar, inputString) {
  const baseCaseStudy = getCaseStudy(caseKey);
  const normalizedGrammar = normalizeGrammar(grammar);
  const normalizedString = normalizeInputString(inputString);

  if (!normalizedGrammar) {
    return baseCaseStudy;
  }

  const matchedCaseStudy = Object.values(ambiguityCases).find((caseStudy) => {
    return (
      normalizeGrammar(caseStudy.grammar) === normalizedGrammar &&
      normalizeInputString(caseStudy.string) === normalizedString
    );
  });

  if (matchedCaseStudy) {
    return matchedCaseStudy;
  }

  return buildCustomCaseStudy(normalizedGrammar, normalizedString);
}

function isValidSymbol(symbol) {
  return /^[A-Za-z][A-Za-z0-9_]*$/.test(symbol);
}

function isValidProductionToken(token) {
  return (
    /^[A-Za-z][A-Za-z0-9_]*$/.test(token) || /^[^A-Za-z0-9\s]$/.test(token)
  );
}

export function validateGrammarInput(grammar) {
  const normalizedGrammar = grammar.trim();

  if (!normalizedGrammar) {
    return {
      isValid: false,
      message: "Invalid grammar: enter at least one production rule.",
    };
  }

  const rules = normalizedGrammar
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!rules.length) {
    return {
      isValid: false,
      message: "Invalid grammar: enter at least one production rule.",
    };
  }

  for (const rule of rules) {
    const [leftSide, rightSide, ...extraParts] = rule
      .split("->")
      .map((part) => part.trim());

    if (extraParts.length || !leftSide || !rightSide) {
      return {
        isValid: false,
        message: `Invalid grammar: "${rule}" must use exactly one "->" production arrow.`,
      };
    }

    if (!isValidSymbol(leftSide)) {
      return {
        isValid: false,
        message: `Invalid grammar: "${leftSide}" is not a valid non-terminal.`,
      };
    }

    const branches = rightSide
      .split("|")
      .map((branch) => branch.trim())
      .filter(Boolean);

    if (!branches.length) {
      return {
        isValid: false,
        message: `Invalid grammar: "${rule}" must include at least one production choice.`,
      };
    }

    for (const branch of branches) {
      const tokens = branch.split(/\s+/).filter(Boolean);

      if (!tokens.length) {
        return {
          isValid: false,
          message: `Invalid grammar: "${rule}" contains an empty production choice.`,
        };
      }

      const hasInvalidToken = tokens.some(
        (token) => !isValidProductionToken(token) && token !== "epsilon",
      );
      if (hasInvalidToken) {
        return {
          isValid: false,
          message: `Invalid grammar: "${branch}" contains unsupported symbols.`,
        };
      }
    }
  }

  return {
    isValid: true,
    message: "",
  };
}

export function getDerivationSteps(caseStudy, panelKey) {
  if (
    !caseStudy ||
    !caseStudy.interpretations ||
    !caseStudy.interpretations[panelKey]
  ) {
    return [];
  }

  return caseStudy.interpretations[panelKey].derivationSteps;
}

export function getDiagramSteps(caseStudy, panelKey) {
  if (
    !caseStudy ||
    !caseStudy.interpretations ||
    !caseStudy.interpretations[panelKey]
  ) {
    return [];
  }

  return caseStudy.interpretations[panelKey].diagrams;
}

export function getPracticeQuestions(caseStudy) {
  return getQuizItems(caseStudy);
}

export function getLessonStages(caseStudy) {
  return caseStudy?.stages ?? [];
}

export function isValidCaseStudy(caseStudy) {
  return Boolean(
    caseStudy &&
    typeof caseStudy.id === "string" &&
    typeof caseStudy.title === "string" &&
    typeof caseStudy.grammar === "string" &&
    typeof caseStudy.string === "string" &&
    typeof caseStudy.teaser === "string" &&
    typeof caseStudy.lesson === "string" &&
    caseStudy.fix &&
    typeof caseStudy.fix.explanation === "string" &&
    Array.isArray(caseStudy.fix.grammar) &&
    Array.isArray(caseStudy.fix.walkthrough) &&
    Array.isArray(caseStudy.fix.removedRules) &&
    hasValidStages(caseStudy.stages) &&
    hasValidInterpretations(caseStudy.interpretations) &&
    hasValidQuizSchema(caseStudy),
  );
}
