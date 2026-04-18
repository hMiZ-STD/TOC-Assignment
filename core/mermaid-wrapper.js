/**
 * @file mermaid-wrapper.js
 * @module MermaidWrapper
 * @description Initializes Mermaid once per theme change. Avoids redundant re-init.
 *              Cleans up Mermaid's body-injected artifact elements after each render
 *              to prevent SVG <defs> ID collisions that cause diagram glitches.
 */

import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs";

let currentTheme = null;

function getMermaidTheme(theme) {
  return theme === "dark" ? "dark" : "default";
}

/** Remove hidden artifact nodes Mermaid injects into <body> after render(). */
function purgeMermaidArtifacts() {
  // Mermaid v10 leaves behind elements with id="d{renderId}" or id matching
  // /^mermaid-/ and a style of display:none or visibility:hidden injected at body level.
  document
    .querySelectorAll(
      'body > [id^="d"][style*="display: none"], ' +
      'body > [id^="mermaid"], ' +
      'body > .mermaid-dummy, ' +
      'body > [id^="dmermaid"]'
    )
    .forEach((el) => el.remove());
}

export function configureMermaid(theme) {
  const nextTheme = getMermaidTheme(theme);
  if (nextTheme === currentTheme) return;
  currentTheme = nextTheme;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: currentTheme,
    // Prevents Mermaid from injecting its own font link mid-render,
    // which causes a layout reflow / size-jump glitch on the diagram stage.
    fontFamily: "inherit",
  });
}

export async function renderMermaidDiagram(id, diagram) {
  // Clean up any previous orphan container Mermaid left behind
  document.getElementById(`d${id}`)?.remove();
  const { svg } = await mermaid.render(id, diagram);
  // Clean up the container Mermaid just created
  document.getElementById(`d${id}`)?.remove();
  purgeMermaidArtifacts();
  return svg;
}
