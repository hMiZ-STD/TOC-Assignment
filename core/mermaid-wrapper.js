/**
 * @file mermaid-wrapper.js
 * @module MermaidWrapper
 * @description Initializes Mermaid once per theme change. Avoids redundant re-init.
 */

import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs";

let currentTheme = null;

function getMermaidTheme(theme) {
  return theme === "dark" ? "dark" : "default";
}

export function configureMermaid(theme) {
  const nextTheme = getMermaidTheme(theme);
  if (nextTheme === currentTheme) return; // skip redundant init
  currentTheme = nextTheme;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: currentTheme,
  });
}

export async function renderMermaidDiagram(id, diagram) {
  const { svg } = await mermaid.render(id, diagram);
  return svg;
}
