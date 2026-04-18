/**
 * @file ambiguity.data.js
 * @module AmbiguityData
 * @description Pure ambiguity case-study data used by the ambiguity module.
 */

/**
 * Current authored schema baseline before the guided-lesson extension:
 * {
 *   title: String,
 *   grammar: String,
 *   string: String,
 *   lesson: String,
 *   fix: String,
 *   interpretations: {
 *     a: { label, diagrams, derivationSteps, explanation },
 *     b: { label, diagrams, derivationSteps, explanation },
 *   },
 *   quiz: Array<Question>
 * }
 */

const rawAmbiguityCases = {
  precedence: {
    title: "Operator Precedence Trap",
    grammar: "E -> E + E | E * E | id",
    string: "id + id * id",
    lesson:
      "When precedence is not encoded in the grammar, the same expression can be grouped in multiple valid ways and therefore produce multiple parse trees.",
    fix:
      "Split the grammar into precedence levels so multiplication binds tighter than addition.",
    interpretations: {
      a: {
        label: "(id + id) * id",
        diagrams: [
          `flowchart TD\n            A_Root["E"]`,
          `flowchart TD\n            A_Root["E"] --> A_Left["E"]\n            A_Root --> A_Op1["*"]\n            A_Root --> A_Right["E"]`,
          `flowchart TD\n            A_Root["E"] --> A_Left["E"]\n            A_Root --> A_Op1["*"]\n            A_Root --> A_Right["E"]\n            A_Left --> A_LLeft["E"]\n            A_Left --> A_Op2["+"]\n            A_Left --> A_LRight["E"]`,
          `flowchart TD\n            A_Root["E"] --> A_Left["E"]\n            A_Root --> A_Op1["*"]\n            A_Root --> A_Right["E"]\n            A_Left --> A_LLeft["E"]\n            A_Left --> A_Op2["+"]\n            A_Left --> A_LRight["E"]\n            A_LLeft --> A_id1["id"]`,
          `flowchart TD\n            A_Root["E"] --> A_Left["E"]\n            A_Root --> A_Op1["*"]\n            A_Root --> A_Right["E"]\n            A_Left --> A_LLeft["E"]\n            A_Left --> A_Op2["+"]\n            A_Left --> A_LRight["E"]\n            A_LLeft --> A_id1["id"]\n            A_LRight --> A_id2["id"]`,
          `flowchart TD\n            A_Root["E"] --> A_Left["E"]\n            A_Root --> A_Op1["*"]\n            A_Root --> A_Right["E"]\n            A_Left --> A_LLeft["E"]\n            A_Left --> A_Op2["+"]\n            A_Left --> A_LRight["E"]\n            A_LLeft --> A_id1["id"]\n            A_LRight --> A_id2["id"]\n            A_Right --> A_id3["id"]`
        ],
        derivationSteps: [
          "E",
          "E * E",
          "(E + E) * E",
          "(id + E) * E",
          "(id + id) * E",
          "(id + id) * id",
        ],
        explanation:
          "This tree groups the addition first, so the product is taken after the sum has already been formed.",
      },
      b: {
        label: "id + (id * id)",
        diagrams: [
          `flowchart TD\n            B_Root["E"]`,
          `flowchart TD\n            B_Root["E"] --> B_Left["E"]\n            B_Root --> B_Op1["+"]\n            B_Root --> B_Right["E"]`,
          `flowchart TD\n            B_Root["E"] --> B_Left["E"]\n            B_Root --> B_Op1["+"]\n            B_Root --> B_Right["E"]\n            B_Left --> B_id1["id"]`,
          `flowchart TD\n            B_Root["E"] --> B_Left["E"]\n            B_Root --> B_Op1["+"]\n            B_Root --> B_Right["E"]\n            B_Left --> B_id1["id"]\n            B_Right --> B_RLeft["E"]\n            B_Right --> B_Op2["*"]\n            B_Right --> B_RRight["E"]`,
          `flowchart TD\n            B_Root["E"] --> B_Left["E"]\n            B_Root --> B_Op1["+"]\n            B_Root --> B_Right["E"]\n            B_Left --> B_id1["id"]\n            B_Right --> B_RLeft["E"]\n            B_Right --> B_Op2["*"]\n            B_Right --> B_RRight["E"]\n            B_RLeft --> B_id2["id"]`,
          `flowchart TD\n            B_Root["E"] --> B_Left["E"]\n            B_Root --> B_Op1["+"]\n            B_Root --> B_Right["E"]\n            B_Left --> B_id1["id"]\n            B_Right --> B_RLeft["E"]\n            B_Right --> B_Op2["*"]\n            B_Right --> B_RRight["E"]\n            B_RLeft --> B_id2["id"]\n            B_RRight --> B_id3["id"]`
        ],
        derivationSteps: [
          "E",
          "E + E",
          "id + E",
          "id + (E * E)",
          "id + (id * E)",
          "id + (id * id)",
        ],
        explanation:
          "This tree groups the multiplication first, which matches the usual arithmetic convention but is still only one possible parse.",
      },
    },
    quiz: [
      {
        question: "Which grouping matches Interpretation B?",
        type: "mcq",
        options: ["(id + id) * id", "id + (id * id)"],
        answer: "id + (id * id)",
        hint: "Look for the multiplication that happens deeper in the tree.",
        explanation: "Interpretation B nests multiplication inside the right branch before addition.",
      },
      {
        question: "What makes the grammar E -> E + E | E * E | id ambiguous?",
        type: "mcq",
        options: [
          "It allows multiple valid groupings of the same expression",
          "It uses terminals and non-terminals together",
          "It contains the symbol id",
        ],
        answer: "It allows multiple valid groupings of the same expression",
        hint: "Focus on whether the grammar fixes precedence.",
        explanation: "Because precedence is not encoded, one input expression can produce more than one parse tree.",
      },
      {
        question: "Which interpretation groups addition before multiplication?",
        type: "mcq",
        options: ["(id + id) * id", "id + (id * id)", "Neither interpretation"],
        answer: "(id + id) * id",
        hint: "Check which operation appears at the root of the parse tree.",
        explanation: "If addition is grouped first, the sum becomes one side of the multiplication.",
      },
      {
        question: "How can this grammar be fixed?",
        type: "mcq",
        options: [
          "Split the grammar into precedence levels",
          "Replace every id with epsilon",
          "Remove multiplication from the grammar",
        ],
        answer: "Split the grammar into precedence levels",
        hint: "A correct fix should preserve the language while forcing one structure.",
        explanation: "Using separate non-terminals for expressions, terms, and factors encodes precedence directly.",
      },
      {
        question: "Which operator should bind tighter in the usual arithmetic interpretation?",
        type: "mcq",
        options: ["*", "+", "Both equally"],
        answer: "*",
        hint: "Think about standard arithmetic rules.",
        explanation: "Multiplication normally has higher precedence than addition.",
      },
    ],
  },
  dangling: {
    title: "Dangling Else Problem",
    grammar: "S -> if C then S | if C then S else S | a",
    string: "if C then if C then a else a",
    lesson:
      "The optional else branch can attach to more than one if, which creates two valid parse structures for the same string.",
    fix:
      "Separate matched and unmatched statements so each else is forced to pair with the nearest valid if.",
    interpretations: {
      a: {
        label: "else belongs to inner if",
        diagrams: [
          `flowchart TD\n            A_S1["S"]`,
          `flowchart TD\n            A_S1["S"] --> A_if1["if"]\n            A_S1 --> A_C1["C"]\n            A_S1 --> A_then1["then"]\n            A_S1 --> A_S2["S"]`,
          `flowchart TD\n            A_S1["S"] --> A_if1["if"]\n            A_S1 --> A_C1["C"]\n            A_S1 --> A_then1["then"]\n            A_S1 --> A_S2["S"]\n            A_S2 --> A_if2["if"]\n            A_S2 --> A_C2["C"]\n            A_S2 --> A_then2["then"]\n            A_S2 --> A_S3["S"]\n            A_S2 --> A_else["else"]\n            A_S2 --> A_S4["S"]`,
          `flowchart TD\n            A_S1["S"] --> A_if1["if"]\n            A_S1 --> A_C1["C"]\n            A_S1 --> A_then1["then"]\n            A_S1 --> A_S2["S"]\n            A_S2 --> A_if2["if"]\n            A_S2 --> A_C2["C"]\n            A_S2 --> A_then2["then"]\n            A_S2 --> A_S3["S"]\n            A_S2 --> A_else["else"]\n            A_S2 --> A_S4["S"]\n            A_S3 --> A_a1["a"]`,
          `flowchart TD\n            A_S1["S"] --> A_if1["if"]\n            A_S1 --> A_C1["C"]\n            A_S1 --> A_then1["then"]\n            A_S1 --> A_S2["S"]\n            A_S2 --> A_if2["if"]\n            A_S2 --> A_C2["C"]\n            A_S2 --> A_then2["then"]\n            A_S2 --> A_S3["S"]\n            A_S2 --> A_else["else"]\n            A_S2 --> A_S4["S"]\n            A_S3 --> A_a1["a"]\n            A_S4 --> A_a2["a"]`
        ],
        derivationSteps: [
          "S",
          "if C then S",
          "if C then if C then S else S",
          "if C then if C then a else S",
          "if C then if C then a else a",
        ],
        explanation:
          "The else is paired with the inner if, which is the standard resolution used by most programming languages.",
      },
      b: {
        label: "else belongs to outer if",
        diagrams: [
          `flowchart TD\n            B_S1["S"]`,
          `flowchart TD\n            B_S1["S"] --> B_if1["if"]\n            B_S1 --> B_C1["C"]\n            B_S1 --> B_then1["then"]\n            B_S1 --> B_S2["S"]\n            B_S1 --> B_else["else"]\n            B_S1 --> B_S4["S"]`,
          `flowchart TD\n            B_S1["S"] --> B_if1["if"]\n            B_S1 --> B_C1["C"]\n            B_S1 --> B_then1["then"]\n            B_S1 --> B_S2["S"]\n            B_S1 --> B_else["else"]\n            B_S1 --> B_S4["S"]\n            B_S2 --> B_if2["if"]\n            B_S2 --> B_C2["C"]\n            B_S2 --> B_then2["then"]\n            B_S2 --> B_S3["S"]`,
          `flowchart TD\n            B_S1["S"] --> B_if1["if"]\n            B_S1 --> B_C1["C"]\n            B_S1 --> B_then1["then"]\n            B_S1 --> B_S2["S"]\n            B_S1 --> B_else["else"]\n            B_S1 --> B_S4["S"]\n            B_S2 --> B_if2["if"]\n            B_S2 --> B_C2["C"]\n            B_S2 --> B_then2["then"]\n            B_S2 --> B_S3["S"]\n            B_S3 --> B_a1["a"]`,
          `flowchart TD\n            B_S1["S"] --> B_if1["if"]\n            B_S1 --> B_C1["C"]\n            B_S1 --> B_then1["then"]\n            B_S1 --> B_S2["S"]\n            B_S1 --> B_else["else"]\n            B_S1 --> B_S4["S"]\n            B_S2 --> B_if2["if"]\n            B_S2 --> B_C2["C"]\n            B_S2 --> B_then2["then"]\n            B_S2 --> B_S3["S"]\n            B_S3 --> B_a1["a"]\n            B_S4 --> B_a2["a"]`
        ],
        derivationSteps: [
          "S",
          "if C then S else S",
          "if C then if C then S else S",
          "if C then if C then a else S",
          "if C then if C then a else a",
        ],
        explanation:
          "This interpretation attaches the else to the outer if, leaving the inner if without an else branch.",
      },
    },
    quiz: [
      {
        question: "What is ambiguous in the dangling else grammar?",
        type: "mcq",
        options: ["Which if receives the else", "Whether C is terminal", "Whether a is nullable"],
        answer: "Which if receives the else",
        hint: "The uncertainty is about attachment, not token types.",
        explanation: "Two different if statements can legally claim the same else branch.",
      },
      {
        question: "In the standard programming-language resolution, the else pairs with the...",
        type: "mcq",
        options: ["nearest unmatched if", "outermost if", "first terminal symbol"],
        answer: "nearest unmatched if",
        hint: "Most languages choose the closest possible if.",
        explanation: "The conventional rule is to attach each else to the nearest preceding unmatched if.",
      },
      {
        question: "Which interpretation leaves the outer if without an else branch?",
        type: "mcq",
        options: ["else belongs to inner if", "else belongs to outer if", "Both interpretations"],
        answer: "else belongs to inner if",
        hint: "If the inner if takes the else, what remains for the outer if?",
        explanation: "When the inner if claims the else, the outer if is interpreted as an if-then statement only.",
      },
      {
        question: "Why does the grammar allow two parses for the same string?",
        type: "mcq",
        options: [
          "The else can attach to different if statements",
          "The symbol a has two meanings",
          "The grammar contains epsilon productions",
        ],
        answer: "The else can attach to different if statements",
        hint: "Look at the two if occurrences in the sample string.",
        explanation: "The same else token can be associated with either the inner or outer if in the grammar.",
      },
      {
        question: "What is a standard grammar-level fix for the dangling else problem?",
        type: "mcq",
        options: [
          "Separate matched and unmatched statements",
          "Remove all else clauses",
          "Change C into a terminal",
        ],
        answer: "Separate matched and unmatched statements",
        hint: "The fix should force one legal attachment structure.",
        explanation: "Matched and unmatched statement categories eliminate the ambiguous attachment choice.",
      },
      {
        question: "Which sample string is being analyzed in this case study?",
        type: "mcq",
        options: [
          "if C then if C then a else a",
          "if a else C then a",
          "if C then else if C then a",
        ],
        answer: "if C then if C then a else a",
        hint: "Read the case-study input string exactly.",
        explanation: "That nested conditional string is the one shown in the case study.",
      },
    ],
  },
  epsilon: {
    title: "Epsilon Loop Structure",
    grammar: "S -> SS | a | epsilon",
    string: "epsilon",
    lesson:
      "A nullable recursive grammar can keep expanding before collapsing back to the empty string, which creates distinct parse trees for the same input.",
    fix:
      "Remove unnecessary nullable productions and rewrite the grammar so the empty string has a single intended derivation.",
    interpretations: {
      a: {
        label: "Direct reduction to epsilon",
        diagrams: [
          `flowchart TD\n            A_S1["S"]`,
          `flowchart TD\n            A_S1["S"] --> A_eps["epsilon"]`
        ],
        derivationSteps: [
          "S",
          "epsilon",
        ],
        explanation:
          "The start symbol immediately reduces to epsilon, producing the empty string in one step.",
      },
      b: {
        label: "Recursive split, then epsilon",
        diagrams: [
          `flowchart TD\n            B_S1["S"]`,
          `flowchart TD\n            B_S1["S"] --> B_S2["S"]\n            B_S1 --> B_S3["S"]`,
          `flowchart TD\n            B_S1["S"] --> B_S2["S"]\n            B_S1 --> B_S3["S"]\n            B_S2 --> B_eps1["epsilon"]`,
          `flowchart TD\n            B_S1["S"] --> B_S2["S"]\n            B_S1 --> B_S3["S"]\n            B_S2 --> B_eps1["epsilon"]\n            B_S3 --> B_eps2["epsilon"]`,
          `flowchart TD\n            B_S1["S"] --> B_S2["S"]\n            B_S1 --> B_S3["S"]\n            B_S2 --> B_eps1["epsilon"]\n            B_S3 --> B_eps2["epsilon"]`
        ],
        derivationSteps: [
          "S",
          "SS",
          "epsilon S",
          "epsilon epsilon",
          "epsilon",
        ],
        explanation:
          "The grammar first duplicates the start symbol and then lets both branches vanish into epsilon, creating a second valid tree.",
      },
    },
    quiz: [
      {
        question: "Why is the epsilon case ambiguous?",
        type: "mcq",
        options: [
          "Because epsilon can be derived through more than one parse tree",
          "Because epsilon is not part of context-free grammars",
          "Because recursion is forbidden in grammars",
        ],
        answer: "Because epsilon can be derived through more than one parse tree",
        hint: "Compare the one-step and split-then-collapse derivations.",
        explanation: "The same empty string can result from structurally different derivation trees.",
      },
      {
        question: "Which production introduces the recursive split in this grammar?",
        type: "mcq",
        options: ["S -> SS", "S -> a", "S -> epsilon"],
        answer: "S -> SS",
        hint: "The recursive production duplicates S.",
        explanation: "The rule S -> SS creates two branches, allowing multiple derivation structures.",
      },
      {
        question: "Which interpretation reduces directly to epsilon?",
        type: "mcq",
        options: ["Interpretation A", "Interpretation B", "Both only after splitting"],
        answer: "Interpretation A",
        hint: "Look for the one-step derivation.",
        explanation: "Interpretation A goes from S straight to epsilon without recursive expansion.",
      },
      {
        question: "What is the main reason ambiguity appears here?",
        type: "mcq",
        options: [
          "Nullable recursion creates more than one tree for the empty string",
          "The terminal a appears twice",
          "Epsilon is not allowed in grammars",
        ],
        answer: "Nullable recursion creates more than one tree for the empty string",
        hint: "Combine the ideas of recursion and epsilon.",
        explanation: "Because S can expand recursively and still disappear, the empty string gets multiple structural derivations.",
      },
      {
        question: "Which case-study input string is being derived?",
        type: "mcq",
        options: ["epsilon", "a", "aa"],
        answer: "epsilon",
        hint: "Check the input string shown near the grammar.",
        explanation: "This example focuses on deriving the empty string.",
      },
      {
        question: "What is a good fix for this ambiguity?",
        type: "mcq",
        options: [
          "Remove unnecessary nullable productions",
          "Add more recursive S -> SS rules",
          "Replace epsilon with +",
        ],
        answer: "Remove unnecessary nullable productions",
        hint: "The fix should reduce the number of ways to disappear.",
        explanation: "Restricting nullable structure helps ensure the empty string has one intended derivation.",
      },
    ],
  },
  associativity: {
    title: "Arithmetic Associativity",
    grammar: "E -> E - E | id",
    string: "id - id - id",
    lesson:
      "A grammar that does not enforce associativity allows repeated subtraction to group in more than one valid way, changing the resulting meaning.",
    fix:
      "Rewrite the grammar so subtraction is forced into a single associativity pattern, such as consistent left association.",
    interpretations: {
      a: {
        label: "(id - id) - id",
        diagrams: [
          `flowchart TD\n            A_Root["E"]`,
          `flowchart TD\n            A_Root["E"] --> A_Left["E"]\n            A_Root --> A_Op1["-"]\n            A_Root --> A_Right["E"]`,
          `flowchart TD\n            A_Root["E"] --> A_Left["E"]\n            A_Root --> A_Op1["-"]\n            A_Root --> A_Right["E"]\n            A_Left --> A_LLeft["E"]\n            A_Left --> A_Op2["-"]\n            A_Left --> A_LRight["E"]`,
          `flowchart TD\n            A_Root["E"] --> A_Left["E"]\n            A_Root --> A_Op1["-"]\n            A_Root --> A_Right["E"]\n            A_Left --> A_LLeft["E"]\n            A_Left --> A_Op2["-"]\n            A_Left --> A_LRight["E"]\n            A_LLeft --> A_id1["id"]`,
          `flowchart TD\n            A_Root["E"] --> A_Left["E"]\n            A_Root --> A_Op1["-"]\n            A_Root --> A_Right["E"]\n            A_Left --> A_LLeft["E"]\n            A_Left --> A_Op2["-"]\n            A_Left --> A_LRight["E"]\n            A_LLeft --> A_id1["id"]\n            A_LRight --> A_id2["id"]`,
          `flowchart TD\n            A_Root["E"] --> A_Left["E"]\n            A_Root --> A_Op1["-"]\n            A_Root --> A_Right["E"]\n            A_Left --> A_LLeft["E"]\n            A_Left --> A_Op2["-"]\n            A_Left --> A_LRight["E"]\n            A_LLeft --> A_id1["id"]\n            A_LRight --> A_id2["id"]\n            A_Right --> A_id3["id"]`
        ],
        derivationSteps: [
          "E",
          "E - E",
          "(E - E) - E",
          "(id - E) - E",
          "(id - id) - E",
          "(id - id) - id",
        ],
        explanation:
          "This parse makes subtraction left-associative by combining the first two identifiers before subtracting the third.",
      },
      b: {
        label: "id - (id - id)",
        diagrams: [
          `flowchart TD\n            B_Root["E"]`,
          `flowchart TD\n            B_Root["E"] --> B_Left["E"]\n            B_Root --> B_Op1["-"]\n            B_Root --> B_Right["E"]`,
          `flowchart TD\n            B_Root["E"] --> B_Left["E"]\n            B_Root --> B_Op1["-"]\n            B_Root --> B_Right["E"]\n            B_Left --> B_id1["id"]`,
          `flowchart TD\n            B_Root["E"] --> B_Left["E"]\n            B_Root --> B_Op1["-"]\n            B_Root --> B_Right["E"]\n            B_Left --> B_id1["id"]\n            B_Right --> B_RLeft["E"]\n            B_Right --> B_Op2["-"]\n            B_Right --> B_RRight["E"]`,
          `flowchart TD\n            B_Root["E"] --> B_Left["E"]\n            B_Root --> B_Op1["-"]\n            B_Root --> B_Right["E"]\n            B_Left --> B_id1["id"]\n            B_Right --> B_RLeft["E"]\n            B_Right --> B_Op2["-"]\n            B_Right --> B_RRight["E"]\n            B_RLeft --> B_id2["id"]`,
          `flowchart TD\n            B_Root["E"] --> B_Left["E"]\n            B_Root --> B_Op1["-"]\n            B_Root --> B_Right["E"]\n            B_Left --> B_id1["id"]\n            B_Right --> B_RLeft["E"]\n            B_Right --> B_Op2["-"]\n            B_Right --> B_RRight["E"]\n            B_RLeft --> B_id2["id"]\n            B_RRight --> B_id3["id"]`
        ],
        derivationSteps: [
          "E",
          "E - E",
          "id - E",
          "id - (E - E)",
          "id - (id - E)",
          "id - (id - id)",
        ],
        explanation:
          "This parse makes subtraction right-associative by grouping the last two identifiers together first.",
      },
    },
    quiz: [
      {
        question: "Which interpretation is left-associative?",
        type: "mcq",
        options: ["(id - id) - id", "id - (id - id)"],
        answer: "(id - id) - id",
        hint: "Left associativity combines the earliest pair first.",
        explanation: "Left-associative subtraction groups the first operation before the second one.",
      },
      {
        question: "Why is the grammar E -> E - E | id ambiguous?",
        type: "mcq",
        options: [
          "It does not enforce a single associativity",
          "It does not contain enough terminals",
          "It forbids subtraction",
        ],
        answer: "It does not enforce a single associativity",
        hint: "Think about how repeated subtraction can be grouped.",
        explanation: "Without a left- or right-associative rule, the same subtraction chain can be parsed in multiple ways.",
      },
      {
        question: "Which interpretation is right-associative?",
        type: "mcq",
        options: ["id - (id - id)", "(id - id) - id", "Neither interpretation"],
        answer: "id - (id - id)",
        hint: "Right associativity groups the later pair first.",
        explanation: "Right-associative subtraction forms the subtraction on the right before applying the left one.",
      },
      {
        question: "What is the input string for this case study?",
        type: "mcq",
        options: ["id - id - id", "id + id - id", "id * id - id"],
        answer: "id - id - id",
        hint: "Read the string shown beside the grammar.",
        explanation: "The example uses three identifiers connected by subtraction.",
      },
      {
        question: "What is the recommended fix for this ambiguity?",
        type: "mcq",
        options: [
          "Rewrite the grammar to force one associativity pattern",
          "Remove the symbol id",
          "Allow both parses equally",
        ],
        answer: "Rewrite the grammar to force one associativity pattern",
        hint: "A good fix should produce only one intended parse.",
        explanation: "Encoding a fixed associativity in the grammar removes the competing parse tree.",
      },
      {
        question: "Which grouping combines the first two identifiers first?",
        type: "mcq",
        options: ["(id - id) - id", "id - (id - id)", "id - id - id has no grouping"],
        answer: "(id - id) - id",
        hint: "Look for parentheses around the first subtraction.",
        explanation: "Parenthesizing the first two identifiers makes the initial subtraction happen first.",
      },
    ],
  },
  concatenation: {
    title: "Nested Concatenation",
    grammar: "S -> SS | a",
    string: "aaa",
    lesson:
      "Concatenation without explicit grouping rules can create multiple valid binary splits for the same string of symbols.",
    fix:
      "Introduce structure that fixes one grouping pattern so the string can be derived in only one intended way.",
    interpretations: {
      a: {
        label: "(aa)a",
        diagrams: [
          `flowchart TD\n            A_Root["S"]`,
          `flowchart TD\n            A_Root["S"] --> A_Left["S"]\n            A_Root --> A_Right["S"]`,
          `flowchart TD\n            A_Root["S"] --> A_Left["S"]\n            A_Root --> A_Right["S"]\n            A_Left --> A_LL["S"]\n            A_Left --> A_LR["S"]`,
          `flowchart TD\n            A_Root["S"] --> A_Left["S"]\n            A_Root --> A_Right["S"]\n            A_Left --> A_LL["S"]\n            A_Left --> A_LR["S"]\n            A_LL --> A_a1["a"]`,
          `flowchart TD\n            A_Root["S"] --> A_Left["S"]\n            A_Root --> A_Right["S"]\n            A_Left --> A_LL["S"]\n            A_Left --> A_LR["S"]\n            A_LL --> A_a1["a"]\n            A_LR --> A_a2["a"]`,
          `flowchart TD\n            A_Root["S"] --> A_Left["S"]\n            A_Root --> A_Right["S"]\n            A_Left --> A_LL["S"]\n            A_Left --> A_LR["S"]\n            A_LL --> A_a1["a"]\n            A_LR --> A_a2["a"]\n            A_Right --> A_a3["a"]`
        ],
        derivationSteps: [
          "S",
          "SS",
          "(SS)S",
          "(aS)S",
          "(aa)S",
          "(aa)a",
        ],
        explanation:
          "This interpretation groups the first two symbols together before concatenating the third symbol.",
      },
      b: {
        label: "a(aa)",
        diagrams: [
          `flowchart TD\n            B_Root["S"]`,
          `flowchart TD\n            B_Root["S"] --> B_Left["S"]\n            B_Root --> B_Right["S"]`,
          `flowchart TD\n            B_Root["S"] --> B_Left["S"]\n            B_Root --> B_Right["S"]\n            B_Right --> B_RL["S"]\n            B_Right --> B_RR["S"]`,
          `flowchart TD\n            B_Root["S"] --> B_Left["S"]\n            B_Root --> B_Right["S"]\n            B_Right --> B_RL["S"]\n            B_Right --> B_RR["S"]\n            B_Left --> B_a1["a"]`,
          `flowchart TD\n            B_Root["S"] --> B_Left["S"]\n            B_Root --> B_Right["S"]\n            B_Right --> B_RL["S"]\n            B_Right --> B_RR["S"]\n            B_Left --> B_a1["a"]\n            B_RL --> B_a2["a"]`,
          `flowchart TD\n            B_Root["S"] --> B_Left["S"]\n            B_Root --> B_Right["S"]\n            B_Left --> B_a1["a"]\n            B_Right --> B_RL["S"]\n            B_Right --> B_RR["S"]\n            B_RL --> B_a2["a"]\n            B_RR --> B_a3["a"]`
        ],
        derivationSteps: [
          "S",
          "SS",
          "S(SS)",
          "a(SS)",
          "a(aS)",
          "a(aa)",
        ],
        explanation:
          "This interpretation keeps the first symbol separate and groups the last two symbols together.",
      },
    },
    quiz: [
      {
        question: "What makes the concatenation grammar ambiguous for aaa?",
        type: "mcq",
        options: [
          "The string can be split into binary groups in more than one way",
          "The symbol a is not terminal",
          "Concatenation is not allowed in CFGs",
        ],
        answer: "The string can be split into binary groups in more than one way",
        hint: "Focus on how the three symbols are parenthesized.",
        explanation: "The grammar permits different binary tree shapes for the same concatenated string.",
      },
      {
        question: "Which production causes recursive concatenation?",
        type: "mcq",
        options: ["S -> SS", "S -> a", "S -> epsilon"],
        answer: "S -> SS",
        hint: "The recursive rule duplicates S into two parts.",
        explanation: "The production S -> SS lets the string be split into smaller concatenated pieces repeatedly.",
      },
      {
        question: "Which interpretation groups the first two a symbols together?",
        type: "mcq",
        options: ["(aa)a", "a(aa)", "aaa"],
        answer: "(aa)a",
        hint: "Look for parentheses around the left pair.",
        explanation: "Interpretation A forms a binary group from the first two a symbols before attaching the last one.",
      },
      {
        question: "Which interpretation groups the last two a symbols together?",
        type: "mcq",
        options: ["a(aa)", "(aa)a", "Both interpretations do"],
        answer: "a(aa)",
        hint: "Check the parentheses on the right side.",
        explanation: "Interpretation B isolates the first a and groups the last two symbols together.",
      },
      {
        question: "What is the input string used in this case study?",
        type: "mcq",
        options: ["aaa", "aa", "aaaa"],
        answer: "aaa",
        hint: "The string has three copies of a.",
        explanation: "This example studies ambiguity in deriving exactly three concatenated a symbols.",
      },
      {
        question: "How can this grammar be made less ambiguous?",
        type: "mcq",
        options: [
          "Introduce structure that fixes one grouping pattern",
          "Add more S -> SS productions",
          "Replace a with id",
        ],
        answer: "Introduce structure that fixes one grouping pattern",
        hint: "The fix should force one intended binary shape.",
        explanation: "Adding more structure to the grammar can ensure the string is derived with only one valid grouping.",
      },
    ],
  },
  language: {
    title: "Natural Language",
    grammar: `S -> NP VP | Pron V NP
NP -> Pron | her
VP -> V NP
Pron -> I | they
V -> saw`,
    string: "I saw her",
    lesson:
      "Natural language phrases can often be assigned more than one syntactic role, which leads to multiple valid parses for the same sentence.",
    fix:
      "Separate pronouns and noun phrases more carefully or add feature constraints so each sentence structure has one intended parse.",
    interpretations: {
      a: {
        label: "I [saw her]",
        diagrams: [
          `flowchart TD\n            A_Root["S"]`,
          `flowchart TD\n            A_Root["S"] --> A_NP["NP"]\n            A_Root --> A_VP["VP"]`,
          `flowchart TD\n            A_Root["S"] --> A_NP["NP"]\n            A_Root --> A_VP["VP"]\n            A_NP --> A_I["I"]`,
          `flowchart TD\n            A_Root["S"] --> A_NP["NP"]\n            A_Root --> A_VP["VP"]\n            A_NP --> A_I["I"]\n            A_VP --> A_V["V"]\n            A_VP --> A_NP2["NP"]`,
          `flowchart TD\n            A_Root["S"] --> A_NP["NP"]\n            A_Root --> A_VP["VP"]\n            A_NP --> A_I["I"]\n            A_VP --> A_V["V"]\n            A_VP --> A_NP2["NP"]\n            A_V --> A_saw["saw"]`,
          `flowchart TD\n            A_Root["S"] --> A_NP["NP"]\n            A_Root --> A_VP["VP"]\n            A_NP --> A_I["I"]\n            A_VP --> A_V["V"]\n            A_VP --> A_NP2["NP"]\n            A_V --> A_saw["saw"]\n            A_NP2 --> A_her["her"]`
        ],
        derivationSteps: [
          "S",
          "NP VP",
          "I VP",
          "I V NP",
          "I saw NP",
          "I saw her",
        ],
        explanation:
          "This parse treats I as the subject noun phrase and saw her as the verb phrase.",
      },
      b: {
        label: "[I saw] her",
        diagrams: [
          `flowchart TD\n            B_Root["S"]`,
          `flowchart TD\n            B_Root["S"] --> B_Pron["Pron"]\n            B_Root --> B_V["V"]\n            B_Root --> B_NP["NP"]`,
          `flowchart TD\n            B_Root["S"] --> B_Pron["Pron"]\n            B_Root --> B_V["V"]\n            B_Root --> B_NP["NP"]\n            B_Pron --> B_I["I"]`,
          `flowchart TD\n            B_Root["S"] --> B_Pron["Pron"]\n            B_Root --> B_V["V"]\n            B_Root --> B_NP["NP"]\n            B_Pron --> B_I["I"]\n            B_V --> B_saw["saw"]`,
          `flowchart TD\n            B_Root["S"] --> B_Pron["Pron"]\n            B_Root --> B_V["V"]\n            B_Root --> B_NP["NP"]\n            B_Pron --> B_I["I"]\n            B_V --> B_saw["saw"]\n            B_NP --> B_her["her"]`
        ],
        derivationSteps: [
          "S",
          "Pron V NP",
          "I V NP",
          "I saw NP",
          "I saw her",
        ],
        explanation:
          "This parse uses the direct sentence pattern Pron V NP, making the same words fit a different top-level structure.",
      },
    },
    quiz: [
      {
        question: "Why is \"I saw her\" ambiguous in this grammar?",
        type: "mcq",
        options: [
          "The sentence matches more than one top-level rule pattern",
          "Because saw is not a verb",
          "Because natural language cannot use CFGs",
        ],
        answer: "The sentence matches more than one top-level rule pattern",
        hint: "Compare NP VP with Pron V NP.",
        explanation: "The grammar allows the same sentence to satisfy different sentence-building rules.",
      },
      {
        question: "Which top-level rule is used in Interpretation A?",
        type: "mcq",
        options: ["S -> NP VP", "S -> Pron V NP", "S -> NP V NP"],
        answer: "S -> NP VP",
        hint: "Interpretation A treats 'saw her' as a verb phrase.",
        explanation: "In Interpretation A, the sentence is split into a subject noun phrase and a verb phrase.",
      },
      {
        question: "Which top-level rule is used in Interpretation B?",
        type: "mcq",
        options: ["S -> Pron V NP", "S -> NP VP", "S -> VP NP"],
        answer: "S -> Pron V NP",
        hint: "Interpretation B starts directly with a pronoun.",
        explanation: "Interpretation B parses the full sentence using the Pron V NP pattern.",
      },
      {
        question: "What role does 'her' play in both interpretations?",
        type: "mcq",
        options: ["It is parsed as a noun phrase", "It is parsed as a verb", "It is parsed as epsilon"],
        answer: "It is parsed as a noun phrase",
        hint: "Look at the final constituent on the right side.",
        explanation: "In both parses, 'her' fills the noun-phrase position at the end.",
      },
      {
        question: "Why are natural-language grammars often ambiguous?",
        type: "mcq",
        options: [
          "Words and phrases can fit multiple syntactic roles",
          "They cannot contain terminals",
          "They never use parse trees",
        ],
        answer: "Words and phrases can fit multiple syntactic roles",
        hint: "Think about how the same words can be structured differently.",
        explanation: "Natural-language expressions often support more than one grammatical structure or category assignment.",
      },
      {
        question: "What is one suggested fix in this case study?",
        type: "mcq",
        options: [
          "Separate pronouns and noun phrases more carefully",
          "Remove the word saw",
          "Allow any word to be a verb",
        ],
        answer: "Separate pronouns and noun phrases more carefully",
        hint: "The fix aims to reduce overlapping structural choices.",
        explanation: "More precise categories or feature constraints can reduce multiple valid parses for the same sentence.",
      },
    ],
  },
};

function createStages(config) {
  return [
    {
      id: "setup",
      title: "Setup",
      prompt: config.setupPrompt,
      spotlight: config.setupSpotlight,
      callout: config.setupCallout,
    },
    {
      id: "prediction",
      title: "Make A Prediction",
      prompt: config.predictionPrompt,
      spotlight: config.predictionSpotlight,
      callout: config.predictionCallout,
      options: config.predictionOptions,
      correctOption: config.correctOption,
      feedbackCorrect: config.feedbackCorrect,
      feedbackWrong: config.feedbackWrong,
    },
    {
      id: "walkA",
      title: "Walkthrough A",
      prompt: config.walkAPrompt,
      spotlight: config.walkASpotlight,
      callout: config.walkACallout,
    },
    {
      id: "walkB",
      title: "Walkthrough B",
      prompt: config.walkBPrompt,
      spotlight: config.walkBSpotlight,
      callout: config.walkBCallout,
    },
    {
      id: "split",
      title: "Split Moment",
      prompt: config.splitPrompt,
      spotlight: config.splitSpotlight,
      callout: config.splitCallout,
    },
    {
      id: "diagnosis",
      title: "Diagnosis",
      prompt: config.diagnosisPrompt,
      spotlight: config.diagnosisSpotlight,
      callout: config.diagnosisCallout,
    },
    {
      id: "fix",
      title: "Repair The Grammar",
      prompt: config.fixPrompt,
      spotlight: config.fixSpotlight,
      callout: config.fixCallout,
    },
    {
      id: "practice",
      title: "Practice",
      prompt: config.practicePrompt,
      spotlight: config.practiceSpotlight,
      callout: config.practiceCallout,
    },
  ];
}

const authoredLessonMeta = {
  precedence: {
    teaser: "Does `id + id * id` have one meaning, or two equally valid parses?",
    stages: createStages({
      setupPrompt: "This grammar puts `+` and `*` at the same structural level, so nothing in the rules forces a unique precedence order.",
      setupSpotlight: ["E -> E + E", "E -> E * E"],
      setupCallout: "Watch for the grammar rules that let the root expand into either addition or multiplication first.",
      predictionPrompt: "Which grouping do you think the grammar can also generate besides the usual arithmetic reading?",
      predictionSpotlight: ["E -> E + E", "E -> E * E"],
      predictionCallout: "Both operators compete for the same non-terminal.",
      predictionOptions: ["(id + id) * id", "id + id * id has only one parse"],
      correctOption: "(id + id) * id",
      feedbackCorrect: "Exactly. Because both productions are available from `E`, the grammar can build a tree where addition happens first.",
      feedbackWrong: "The grammar does allow a second grouping. Equal-precedence productions let the tree branch in more than one valid way.",
      walkAPrompt: "Walk through the parse where the multiplication sits at the root and the left child expands into an addition.",
      walkASpotlight: ["E -> E * E", "E -> E + E"],
      walkACallout: "This path builds `(id + id) * id` by expanding the left `E` into a sum.",
      walkBPrompt: "Now trace the alternative parse where addition sits at the root and the right child expands into a multiplication.",
      walkBSpotlight: ["E -> E + E", "E -> E * E"],
      walkBCallout: "This path builds `id + (id * id)`, the grouping students usually expect.",
      splitPrompt: "Both trees derive the same string, but the first structural split happens at the root of the expression.",
      splitSpotlight: ["E -> E + E", "E -> E * E"],
      splitCallout: "The fork happens because the start symbol `E` may choose either `E -> E + E` or `E -> E * E` first.",
      diagnosisPrompt: "Semantic meaning changes with the tree: one parse adds before multiplying, while the other multiplies before adding.",
      diagnosisSpotlight: ["E -> E + E", "E -> E * E"],
      diagnosisCallout: "Ambiguity here is not cosmetic. Different trees imply different arithmetic results.",
      fixPrompt: "Repair the grammar by separating precedence levels so multiplication can only happen inside terms before addition combines those terms.",
      fixSpotlight: ["E -> E + T | T", "T -> T * F | F", "F -> id"],
      fixCallout: "Only the expression-shaping rules need to change; the language itself stays the same.",
      practicePrompt: "Use the checkpoint to confirm you can now explain both the ambiguity and the grammar-level fix.",
      practiceSpotlight: ["E -> E + T | T", "T -> T * F | F"],
      practiceCallout: "You’re ready to test whether the precedence repair really stuck.",
    }),
    fixGrammar: ["E -> E + T | T", "T -> T * F | F", "F -> id"],
    fixWalkthrough: [
      { rule: "E -> E + T | T", note: "Addition now combines complete terms, so it cannot outrank multiplication." },
      { rule: "T -> T * F | F", note: "Multiplication is isolated one level deeper and therefore binds tighter." },
      { rule: "F -> id", note: "Operands remain simple leaves, so no extra ambiguity is introduced." },
    ],
    removedRules: ["E -> E + E", "E -> E * E"],
  },
  dangling: {
    teaser: "When one `else` appears, which `if` is it supposed to belong to?",
    stages: createStages({
      setupPrompt: "This grammar has both `if C then S` and `if C then S else S`, so an `else` can legally attach at more than one depth.",
      setupSpotlight: ["S -> if C then S", "S -> if C then S else S"],
      setupCallout: "The optional `else` is the source of trouble.",
      predictionPrompt: "For `if C then if C then a else a`, which `if` do you expect the `else` to attach to in one valid parse?",
      predictionSpotlight: ["S -> if C then S", "S -> if C then S else S"],
      predictionCallout: "Think about whether the outer or inner statement consumes the `else` token.",
      predictionOptions: ["The inner if", "Neither if can legally take it"],
      correctOption: "The inner if",
      feedbackCorrect: "Yes. One valid parse gives the `else` to the inner `if`, which is also the conventional programming-language rule.",
      feedbackWrong: "The grammar absolutely can attach the `else`. In fact, it can attach it in two different places.",
      walkAPrompt: "Step through the parse where the outer statement uses the shorter rule and the inner statement expands to include `else`.",
      walkASpotlight: ["S -> if C then S", "S -> if C then S else S"],
      walkACallout: "Here the inner `if` claims the `else`, leaving the outer statement unmatched.",
      walkBPrompt: "Trace the competing parse where the outer statement takes the `else` and the inner statement stays as `if C then S`.",
      walkBSpotlight: ["S -> if C then S else S", "S -> if C then S"],
      walkBCallout: "The same token sequence still works, but now the outer `if` owns the `else`.",
      splitPrompt: "The two trees diverge at the point where the grammar chooses whether the first statement is matched or unmatched.",
      splitSpotlight: ["S -> if C then S", "S -> if C then S else S"],
      splitCallout: "The fork is caused by choosing the shorter `if C then S` rule versus the longer `if C then S else S` rule for the outer statement.",
      diagnosisPrompt: "Control flow changes with the parse: the `else` either belongs to the nested condition or to the outer condition.",
      diagnosisSpotlight: ["S -> if C then S", "S -> if C then S else S"],
      diagnosisCallout: "This is why languages define a policy like 'attach `else` to the nearest unmatched `if`.'",
      fixPrompt: "Repair the grammar by separating matched statements from unmatched statements so each `else` has exactly one legal partner.",
      fixSpotlight: ["S -> M | U", "M -> if C then M else M | a", "U -> if C then S | if C then M else U"],
      fixCallout: "Matched/unmatched categories encode the attachment rule directly into the grammar.",
      practicePrompt: "Use the checkpoint to verify you can explain where the `else` attaches and how matched/unmatched rules remove the ambiguity.",
      practiceSpotlight: ["M -> if C then M else M", "U -> if C then S"],
      practiceCallout: "The quiz reinforces the nearest-unmatched-if idea.",
    }),
    fixGrammar: ["S -> M | U", "M -> if C then M else M | a", "U -> if C then S | if C then M else U"],
    fixWalkthrough: [
      { rule: "S -> M | U", note: "The start symbol now distinguishes complete statements from dangling ones." },
      { rule: "M -> if C then M else M | a", note: "Matched statements always consume their own `else` branch." },
      { rule: "U -> if C then S | if C then M else U", note: "Unmatched statements represent the only places where an `else` is still pending." },
    ],
    removedRules: ["S -> if C then S", "S -> if C then S else S"],
  },
  epsilon: {
    teaser: "Can the empty string come from one parse tree, or from a whole family of disappearing branches?",
    stages: createStages({
      setupPrompt: "Because `S` can both split recursively and vanish into `epsilon`, the grammar can create structure and still erase it.",
      setupSpotlight: ["S -> SS", "S -> epsilon"],
      setupCallout: "Nullable recursion is the warning sign here.",
      predictionPrompt: "What second strategy can the grammar use to derive `epsilon` besides reducing immediately?",
      predictionSpotlight: ["S -> SS", "S -> epsilon"],
      predictionCallout: "Look for a rule that duplicates work before both pieces disappear.",
      predictionOptions: ["Split into `SS`, then let both branches become `epsilon`", "There is no other valid derivation"],
      correctOption: "Split into `SS`, then let both branches become `epsilon`",
      feedbackCorrect: "Right. Recursive splitting creates a second tree even though the final string is still empty.",
      feedbackWrong: "There is another valid tree: `S` can expand to `SS` before both branches reduce to `epsilon`.",
      walkAPrompt: "First inspect the shortest parse, where the start symbol immediately reduces to `epsilon`.",
      walkASpotlight: ["S -> epsilon"],
      walkACallout: "This is the direct one-step derivation.",
      walkBPrompt: "Now follow the alternative tree that adds extra structure with `S -> SS` before collapsing both branches.",
      walkBSpotlight: ["S -> SS", "S -> epsilon"],
      walkBCallout: "The grammar builds a bigger tree and still ends with the same empty string.",
      splitPrompt: "The split happens as soon as the start symbol decides whether to disappear immediately or recurse first.",
      splitSpotlight: ["S -> SS", "S -> epsilon"],
      splitCallout: "The fork is caused by choosing `S -> epsilon` versus `S -> SS` at the root.",
      diagnosisPrompt: "Structurally different trees for the same empty string mean the grammar is ambiguous even when no visible terminals remain.",
      diagnosisSpotlight: ["S -> SS", "S -> epsilon"],
      diagnosisCallout: "Ambiguity is about parse-tree shape, not just surface tokens.",
      fixPrompt: "Repair the grammar by removing unnecessary nullable recursion so the empty string has one intended derivation path.",
      fixSpotlight: ["S -> aS | epsilon"],
      fixCallout: "The goal is not to ban `epsilon`; it is to stop generating redundant hidden structure.",
      practicePrompt: "Use the checkpoint to confirm you can recognize why nullable recursion produces multiple trees.",
      practiceSpotlight: ["S -> aS | epsilon"],
      practiceCallout: "Focus on the contrast between direct disappearance and recursive disappearance.",
    }),
    fixGrammar: ["S -> aS | epsilon"],
    fixWalkthrough: [
      { rule: "S -> aS | epsilon", note: "The grammar keeps one controlled nullable path instead of arbitrary recursive splitting." },
    ],
    removedRules: ["S -> SS"],
  },
  associativity: {
    teaser: "If subtraction repeats, does the grammar force left association or right association?",
    stages: createStages({
      setupPrompt: "The rule `E -> E - E` lets subtraction chains regroup freely, so repeated subtraction can lean left or right.",
      setupSpotlight: ["E -> E - E"],
      setupCallout: "Nothing in the grammar decides which subtraction should happen first.",
      predictionPrompt: "Which alternative grouping can this grammar generate for `id - id - id`?",
      predictionSpotlight: ["E -> E - E"],
      predictionCallout: "Both parses use the same rule, but the recursive expansion happens on different sides.",
      predictionOptions: ["id - (id - id)", "The grammar only allows `(id - id) - id`"],
      correctOption: "id - (id - id)",
      feedbackCorrect: "Exactly. The grammar can nest the second subtraction on the right, creating a different meaning.",
      feedbackWrong: "The grammar does not force left association. It also allows `id - (id - id)` as a valid parse.",
      walkAPrompt: "Walk through the left-associative parse where the left child expands again before the right child becomes `id`.",
      walkASpotlight: ["E -> E - E"],
      walkACallout: "This yields `(id - id) - id`.",
      walkBPrompt: "Now trace the right-associative parse where the right child becomes another subtraction subtree.",
      walkBSpotlight: ["E -> E - E"],
      walkBCallout: "This yields `id - (id - id)`.",
      splitPrompt: "The parse trees diverge when the recursive `E -> E - E` expansion happens on the left side versus the right side.",
      splitSpotlight: ["E -> E - E"],
      splitCallout: "The fork is caused by reusing the subtraction rule in a different branch of the same tree.",
      diagnosisPrompt: "Subtraction is not associative, so the two valid parse trees lead to different arithmetic outcomes.",
      diagnosisSpotlight: ["E -> E - E"],
      diagnosisCallout: "A grammar that ignores associativity leaves meaning unstable.",
      fixPrompt: "Repair the grammar by encoding one associativity pattern directly, such as left-associative repetition.",
      fixSpotlight: ["E -> E - id | id"],
      fixCallout: "Once the recursive form is fixed to one side, only one grouping remains legal.",
      practicePrompt: "Use the checkpoint to distinguish left-associative and right-associative parses with confidence.",
      practiceSpotlight: ["E -> E - id | id"],
      practiceCallout: "The key is noticing which side keeps expanding.",
    }),
    fixGrammar: ["E -> E - id | id"],
    fixWalkthrough: [
      { rule: "E -> E - id | id", note: "Recursion stays on the left, so repeated subtraction must group left-associatively." },
    ],
    removedRules: ["E -> E - E"],
  },
  concatenation: {
    teaser: "For `aaa`, where should the binary split happen first: on the left pair or the right pair?",
    stages: createStages({
      setupPrompt: "The rule `S -> SS` repeatedly splits the string into two parts, but the grammar never says where the first grouping should land.",
      setupSpotlight: ["S -> SS", "S -> a"],
      setupCallout: "Concatenation is invisible in the string, so the parse tree carries all the grouping information.",
      predictionPrompt: "Besides `(aa)a`, what other grouping can the grammar derive for `aaa`?",
      predictionSpotlight: ["S -> SS"],
      predictionCallout: "The difference comes from whether the recursive split expands the left or right child again.",
      predictionOptions: ["a(aa)", "There is no second parse for `aaa`"],
      correctOption: "a(aa)",
      feedbackCorrect: "Yes. The grammar can regroup the same three symbols into a different binary tree shape.",
      feedbackWrong: "There is a second parse. `S -> SS` can keep expanding on the other side and produce `a(aa)`.",
      walkAPrompt: "Walk through the parse where the left branch splits one more time, giving the grouping `(aa)a`.",
      walkASpotlight: ["S -> SS", "S -> a"],
      walkACallout: "The left subtree holds the first pair.",
      walkBPrompt: "Now follow the alternative parse where the right branch splits again, producing `a(aa)`.",
      walkBSpotlight: ["S -> SS", "S -> a"],
      walkBCallout: "The right subtree now carries the final pair.",
      splitPrompt: "Both trees use the same recursive rule, but the first repeated split happens in different subtrees.",
      splitSpotlight: ["S -> SS"],
      splitCallout: "The fork is caused by reapplying `S -> SS` to the left child in one parse and the right child in the other.",
      diagnosisPrompt: "Even though plain concatenation has no visible operator, the grammar still assigns two distinct hierarchical groupings.",
      diagnosisSpotlight: ["S -> SS"],
      diagnosisCallout: "Ambiguity can hide inside structure even when the string itself looks simple.",
      fixPrompt: "Repair the grammar by forcing one grouping strategy so each concatenated string has a single intended tree shape.",
      fixSpotlight: ["S -> aS | a"],
      fixCallout: "A right-linear form removes the competing binary shapes.",
      practicePrompt: "Use the checkpoint to reinforce how invisible concatenation can still produce visible ambiguity in the tree.",
      practiceSpotlight: ["S -> aS | a"],
      practiceCallout: "Pay attention to which subtree keeps growing.",
    }),
    fixGrammar: ["S -> aS | a"],
    fixWalkthrough: [
      { rule: "S -> aS | a", note: "The grammar now grows in one direction only, so each string gets one consistent grouping." },
    ],
    removedRules: ["S -> SS"],
  },
  language: {
    teaser: "Can `I saw her` be one sentence structure, or two different grammatical stories?",
    stages: createStages({
      setupPrompt: "This miniature language allows both `S -> NP VP` and `S -> Pron V NP`, so the same sentence can match two top-level shapes.",
      setupSpotlight: ["S -> NP VP", "S -> Pron V NP", "NP -> Pron | her"],
      setupCallout: "Overlapping categories are what create the ambiguity here.",
      predictionPrompt: "Which second top-level pattern can parse `I saw her` besides `S -> NP VP`?",
      predictionSpotlight: ["S -> NP VP", "S -> Pron V NP"],
      predictionCallout: "Look at the sentence-level rules first, not the lexical leaves.",
      predictionOptions: ["S -> Pron V NP", "No alternative sentence rule fits"],
      correctOption: "S -> Pron V NP",
      feedbackCorrect: "Correct. The same words also match the direct `Pron V NP` sentence pattern.",
      feedbackWrong: "There is another valid top-level parse. `I saw her` also fits `S -> Pron V NP` in this grammar.",
      walkAPrompt: "Walk through the interpretation where `I` forms an `NP` and `saw her` forms the `VP`.",
      walkASpotlight: ["S -> NP VP", "VP -> V NP", "NP -> Pron | her"],
      walkACallout: "This is the classic subject-plus-verb-phrase analysis.",
      walkBPrompt: "Now trace the competing interpretation where the sentence directly expands as `Pron V NP`.",
      walkBSpotlight: ["S -> Pron V NP", "NP -> Pron | her"],
      walkBCallout: "The same words now fit a flatter top-level structure.",
      splitPrompt: "The ambiguity begins immediately at the sentence root because two sentence-level productions fit the exact same token sequence.",
      splitSpotlight: ["S -> NP VP", "S -> Pron V NP"],
      splitCallout: "The fork is caused by choosing `S -> NP VP` versus `S -> Pron V NP` at the root.",
      diagnosisPrompt: "Different syntactic structures imply different constituent boundaries, which is a central source of ambiguity in natural-language grammars.",
      diagnosisSpotlight: ["S -> NP VP", "S -> Pron V NP"],
      diagnosisCallout: "Natural-language ambiguity often comes from categories that overlap more than once.",
      fixPrompt: "Repair the grammar by tightening category boundaries so pronouns and noun phrases do not create overlapping top-level analyses.",
      fixSpotlight: ["S -> NP VP", "NP -> I | they | her", "VP -> saw NP"],
      fixCallout: "The goal is to keep the intended sentence pattern while removing the competing duplicate path.",
      practicePrompt: "Use the checkpoint to test whether you can identify the two competing sentence structures and explain the overlap.",
      practiceSpotlight: ["S -> NP VP", "NP -> I | they | her", "VP -> saw NP"],
      practiceCallout: "Focus on why the root can branch in two valid ways.",
    }),
    fixGrammar: ["S -> NP VP", "NP -> I | they | her", "VP -> saw NP"],
    fixWalkthrough: [
      { rule: "NP -> I | they | her", note: "Pronouns are folded into one noun-phrase category instead of duplicating a separate top-level sentence pattern." },
      { rule: "VP -> saw NP", note: "The verb phrase remains explicit, preserving the intended constituent boundary." },
    ],
    removedRules: ["S -> Pron V NP", "Pron -> I | they"],
  },
};

function augmentCaseStudy(caseId, caseStudy) {
  const metadata = authoredLessonMeta[caseId];

  return {
    ...caseStudy,
    id: caseId,
    inputString: caseStudy.string,
    teaser: metadata.teaser,
    stages: metadata.stages,
    fix: {
      grammar: metadata.fixGrammar,
      explanation: caseStudy.fix,
      walkthrough: metadata.fixWalkthrough,
      removedRules: metadata.removedRules,
    },
  };
}

export const ambiguityCases = Object.fromEntries(
  Object.entries(rawAmbiguityCases).map(([caseId, caseStudy]) => [caseId, augmentCaseStudy(caseId, caseStudy)]),
);
