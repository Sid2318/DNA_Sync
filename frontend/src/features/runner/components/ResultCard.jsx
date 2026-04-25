import React from "react";
import { motion } from "framer-motion";

export default function ResultCard({ result }) {
  return (
    <motion.section
      className="result-card"
      initial={{ y: 14, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="result-head">
        <h2>{result.toolLabel} Result</h2>
        <span className="status-chip">Ready</span>
      </div>

      <p className="result-note">Cleaned output</p>
      <pre className="clean-output">{result.cleanedOutput}</pre>

      <details className="raw-output">
        <summary>Show raw terminal output</summary>
        <pre>{result.rawOutput}</pre>
      </details>
    </motion.section>
  );
}
