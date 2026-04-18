/**
 * @file mermaid-wrapper.js
 * @module MermaidWrapper
 * @description Initializes Mermaid and renders diagrams with visible failure handling.
 */

import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs";

function getMermaidTheme(theme) {
  return theme === "dark" ? "dark" : "default";
}

export function configureMermaid(theme) {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: getMermaidTheme(theme),
  });
}

export async function renderMermaidDiagram(id, diagram) {
  const { svg } = await mermaid.render(id, diagram);
  return svg;
}
