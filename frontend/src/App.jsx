import React, { useState } from "react";
import DNAInput from "./features/runner/components/DNAInput";
import ResultCard from "./features/runner/components/ResultCard";
import { motion } from "framer-motion";
import {
  buildStdinScript,
  cleanTerminalOutput,
  runTool,
  TOOL_LABELS,
} from "./features/runner/api/runTool";

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
        cleanedOutput: cleanTerminalOutput(data.output),
      });
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
        <h1>DNA Workbench</h1>
        <p>
          Pick a feature, run it cleanly, and read results without terminal
          clutter.
        </p>
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

      <footer>React UI with streamlined DNA feature runs</footer>
    </div>
  );
}
