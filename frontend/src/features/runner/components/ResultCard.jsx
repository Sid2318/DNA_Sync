import React from "react";
import { motion } from "framer-motion";
import FeatureVisualizer from "./FeatureVisualizer";

const RESULT_COPY = Object.freeze({
  analysis: "Composition and similarity map",
  codon: "Codon-by-codon protein translation",
  dp: "DP verified mutation windows",
  huffman: "Compression metrics and Huffman tree",
  z_module: "Exact and candidate pattern alignments",
});

export default function ResultCard({ result }) {
  const hasOutput = Boolean(
    result.cleanedOutput && result.cleanedOutput.trim(),
  );
  const subtitle = RESULT_COPY[result.tool] || "Interactive result";

  return (
    <motion.section
      className="result-card"
      initial={{ y: 18, opacity: 0, scale: 0.98 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -12, opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.38, ease: "easeOut" }}
    >
      <div className="result-head">
        <div>
          <span className="section-kicker">Visualization ready</span>
          <h2>{result.toolLabel}</h2>
          <p>{subtitle}</p>
        </div>
        <span className="status-chip">Interactive</span>
      </div>

      <FeatureVisualizer result={result} />

      {hasOutput ? (
        <details className="text-summary">
          <summary>View cleaned terminal summary</summary>
          <pre className="clean-output">{result.cleanedOutput}</pre>
        </details>
      ) : null}
    </motion.section>
  );
}
