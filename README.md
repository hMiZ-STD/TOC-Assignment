<div align="center">

<h1> CFG Ambiguity Simulator</h1>

<p><em>"Your grammar is ambiguous."<br>— every compiler, every professor, and now this app.</em></p>

<p>
  <img src="https://img.shields.io/badge/JavaScript-ES%20Modules-F7DF1E?style=flat-square&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/Mermaid-v10-FF3670?style=flat-square&logo=mermaid&logoColor=white" />
  <img src="https://img.shields.io/badge/CSS-Custom%20Properties-1572B6?style=flat-square&logo=css3&logoColor=white" />
</p>

<br/>

<p>An interactive, browser-based simulator for exploring <strong>Context-Free Grammar (CFG) ambiguity</strong> —<br/>
that beautiful moment when your grammar looks perfectly fine until it silently produces<br/>
two completely different parse trees for the same input and ruins your entire compiler design.</p>

<br/>

</div>

---

## 🎬 Live Demo

> *Replace this block with a real screenshot or GIF of the simulator running.*

> To add a real screenshot: record a GIF using [LICEcap](https://www.cockos.com/licecap/) or [ScreenToGif](https://www.screentogif.com/), drop it in the repo as `demo.gif`, then replace the block above with:
> ```md
> ![CFG Ambiguity Simulator Demo](./demo.gif)
> ```

---

## 🤔 What Even Is This?

Your professor writes `E -> E + E | E * E | id` on the board and asks *"is this grammar ambiguous?"*

You say no.

You are wrong.

This simulator shows you **exactly why you're wrong** — step by step, with animated parse trees, side-by-side derivations, a guided lesson, and a quiz at the end to confirm that you now understand the thing you were wrong about.

It works entirely in the browser. No backend. No bundler. No `node_modules` folder that weighs more than your OS. You can literally `python -m http.server` it and go.

---

## 📚 The Six Cases That Will Change You

<details>
<summary><strong>1. Operator Precedence Trap</strong> — <code>E -> E + E | E * E | id</code></summary>

**Input:** `id + id * id`

**Problem:** Is it `(id + id) * id` or `id + (id * id)`? Both are valid. The grammar doesn't encode precedence, so the parser is forced to guess — and it can guess wrong in two equally valid ways.

**Fix:** Split into precedence levels with separate non-terminals for expressions, terms, and factors.
</details>

<details>
<summary><strong>2. Dangling Else Problem</strong> — <code>S -> if C then S | if C then S else S | a</code></summary>

**Input:** `if C then if C then a else a`

**Problem:** Which `if` does the `else` attach to? The grammar genuinely cannot decide. This exact ambiguity existed in ALGOL 60 and started arguments that lasted decades.

**Fix:** Introduce `matched` and `unmatched` statement non-terminals.
</details>

<details>
<summary><strong>3. Epsilon Loop Structure</strong> — <code>S -> SS | a | epsilon</code></summary>

**Input:** `epsilon`

**Problem:** The empty string can be derived in infinitely many structurally distinct ways. One direct step. Two recursive steps. Three. The grammar has no incentive to stop.

**Fix:** Remove the epsilon production or restructure to prevent recursive epsilon chains.
</details>

<details>
<summary><strong>4. Arithmetic Associativity</strong> — <code>E -> E - E | id</code></summary>

**Input:** `id - id - id`

**Problem:** Is `a - b - c` equal to `(a - b) - c` or `a - (b - c)`? These compute different values. The grammar doesn't enforce associativity, so the parser picks both.

**Fix:** Use left-recursive rules: `E -> E - id | id`.
</details>

<details>
<summary><strong>5. Nested Concatenation</strong> — <code>S -> SS | a</code></summary>

**Input:** `aaa`

**Problem:** Three `a`s can be split as `(aa)a` or `a(aa)`. Binary concatenation with no associativity constraint means the tree shape is underdetermined.

**Fix:** Enforce one direction: `S -> Sa | a`.
</details>

<details>
<summary><strong>6. Natural Language Ambiguity</strong> — NP/VP grammar</summary>

**Input:** `I saw her`

**Problem:** Did you see her? Or did you use her as a telescope? Both parse trees are grammatically valid under a naive NL grammar. This is why NLP is hard and linguists have trust issues.

**Fix:** Context. (Good luck encoding that in a CFG.)
</details>

---

**Search limits:** 12,000 processed states, `max(12, len × 6 + 10)` expansions. Hits a cap → returns partial results gracefully.

### Divergence Detection

```js
function findDivergenceStep(caseStudy) {
  const stepsA = getDerivationSteps(caseStudy, "a");
  const stepsB = getDerivationSteps(caseStudy, "b");
  for (let i = 0; i < Math.min(stepsA.length, stepsB.length); i++) {
    if (stepsA[i] !== stepsB[i]) return i; // ← first mismatch = divergence
  }
  return null;
}
```

That index becomes the step where ⚡ appears. Simple. Correct. Satisfying.

---

## 🛠️ Adding a New Case Study

**Step 1** — Add to `rawAmbiguityCases` in `data/ambiguity.data.js`:

```js
myCase: {
  title: "My Case Title",
  grammar: "S -> a S b | epsilon",
  string: "a a b b",
  fix: "One sentence on how to eliminate the ambiguity.",
  interpretations: {
    a: {
      label: "Interpretation A short label",
      explanation: "What this structural interpretation means.",
      derivationSteps: ["S", "a S b", "a a S b b", "a a b b"],
      diagrams: [
        `flowchart TD\n  A_S0["S"]`,
        `flowchart TD\n  A_S0["S"] --> A_a0["a"]\n  A_S0 --> A_S1["S"]\n  A_S0 --> A_b0["b"]`,
        // one diagram string per step — must match derivationSteps length exactly
      ],
    },
    b: {
      // same structure, different tree shape
    },
  },
  quiz: [
    {
      type: "mcq",
      question: "What causes the ambiguity in this grammar?",
      options: ["Option A", "Option B", "Option C"],
      answer: "Option A",
      hint: "Think about tree structure.",
      explanation: "Shown to the user after they answer.",
    },
  ],
},
```

**Step 2** — Add lesson stage metadata to `authoredLessonMeta` in the same file (copy an existing entry and adapt).

**Step 3** — Add the nav button in `index.html`:

```html
<button class="nav-button" type="button" data-case-key="myCase"></button>
```

That's it. The app picks it up automatically on next load.

---

## 🔧 Tech Stack

| Concern | Technology | Why |
|---|---|---|
| Language | Vanilla JS — ES Modules | No framework needed for a focused single-feature tool |
| Diagrams | [Mermaid v10](https://mermaid.js.org/) via CDN | Declarative tree diagrams from strings — no canvas math |
| Styling | CSS custom properties + Grid | Full responsive layout without a CSS framework |
| State | Plain JS module singleton | One object, explicit setters, nothing magical |
| Persistence | `localStorage` | Works offline, zero server, survives refresh |

---

> Contributions welcome. Or not. The grammar works either way.

---

## 👥 Contributors

<table>
  <tr>
    <td align="center">
      <img src="https://github.com/hMiZ-STD.png" width="80px" style="border-radius:50%"/><br/>
      <sub><b>hMiZ-STD</b></sub><br/>
      <sub>Author & Developer</sub>
    </td>
  </tr>
</table>

Want to contribute? Fork the repo, add a case study, fix a bug, or open an issue. All valid forms of participation.

---

## 📄 License

Built as a Theory of Computation assignment at **IIIT Sri City**.

No warranty. No support. No promises.

But `E -> E + E | E * E | id` is definitely ambiguous, and now you can prove it.

---

<div align="center">

<br/><br/>

<img src="https://img.shields.io/badge/parse%20trees%20generated-%E2%88%9E-blueviolet?style=flat-square" />
<img src="https://img.shields.io/badge/ambiguities%20found-more%20than%20expected-red?style=flat-square" />
<img src="https://img.shields.io/badge/node__modules-absent-brightgreen?style=flat-square" />

</div>
