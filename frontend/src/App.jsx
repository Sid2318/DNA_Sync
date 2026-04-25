import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import DNAInput from "./features/runner/components/DNAInput";
import ResultCard from "./features/runner/components/ResultCard";
import {
  buildStdinScript,
  cleanTerminalOutput,
  runTool,
  TOOL_LABELS,
} from "./features/runner/api/runTool";

const HERO_BASES = ["A", "T", "G", "C", "G", "A", "T", "C"];

function LoadingLab() {
  return (
    <motion.div
      className="loading-lab"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
    >
      <div className="scan-orbit" aria-hidden="true">
        {HERO_BASES.map((base, index) => (
          <motion.span
            key={`${base}-${index}`}
            animate={{ y: [0, -10, 0], opacity: [0.45, 1, 0.45] }}
            transition={{
              repeat: Infinity,
              duration: 1.4,
              delay: index * 0.09,
              ease: "easeInOut",
            }}
          >
            {base}
          </motion.span>
        ))}
      </div>
      <div>
        <strong>Running native DNA engine</strong>
        <p>Parsing output and preparing the visualization layer.</p>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRun = async (formData) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const stdinScript = buildStdinScript(formData);
      const data = await runTool(stdinScript);

      setResult({
        tool: formData.tool,
        toolLabel: TOOL_LABELS[formData.tool] || formData.tool,
        dna: formData.dna,
        pattern: formData.pattern,
        k: formData.k,
        analysisSequences: formData.analysisSequences || [],
        cleanedOutput: cleanTerminalOutput(data.output),
      });
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <div className="app">
        <motion.header
          className="app-header"
          initial={{ y: -28, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="hero-copy">
            <span className="section-kicker">DNA algorithm studio</span>
            <h1>Visualize every step of your DNA workflow.</h1>
            <p>
              Run the C++ algorithms through a clean React interface with
              animated views for Z matching, DP mutations, codon translation,
              Huffman compression, and sequence analysis.
            </p>
          </div>

          <motion.div
            className="hero-card"
            initial={{ opacity: 0, scale: 0.96, rotate: -1 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.12, duration: 0.45 }}
            aria-hidden="true"
          >
            <div className="helix-lane">
              {HERO_BASES.concat(HERO_BASES).map((base, index) => (
                <motion.span
                  key={`hero-${base}-${index}`}
                  animate={{ y: index % 2 === 0 ? [0, 10, 0] : [0, -10, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.2,
                    delay: index * 0.05,
                    ease: "easeInOut",
                  }}
                >
                  {base}
                </motion.span>
              ))}
            </div>
            <strong>5</strong>
            <small>algorithm visualizers</small>
          </motion.div>
        </motion.header>

        <main>
          <DNAInput onRun={handleRun} loading={loading} />

          <AnimatePresence mode="wait">
            {loading && <LoadingLab key="loading" />}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div
                className="error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {result && <ResultCard key={result.tool} result={result} />}
          </AnimatePresence>
        </main>

        <footer>
          Native C++ algorithms, production-ready React visual layer.
        </footer>
      </div>
    </div>
  );
}
