import React, { useState } from "react";
import DNAInput from "./features/runner/components/DNAInput";
import ResultCard from "./features/runner/components/ResultCard";
import { motion } from "framer-motion";
import { runTool } from "./features/runner/api/runTool";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRun = async (input, options) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await runTool(input, options);
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <motion.header
        className="app-header"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1>DNA Tools — Interactive UI</h1>
        <p>Run analysis, codon, DP, Huffman and more</p>
      </motion.header>

      <main>
        <DNAInput onRun={handleRun} loading={loading} />

        {loading && (
          <motion.div
            className="spinner"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        )}

        {error && <div className="error">{error}</div>}
        {result && <ResultCard result={result} />}
      </main>

      <footer>Built with React • Animations by Framer Motion</footer>
    </div>
  );
}
