import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TOOL_LABELS } from "../api/runTool";

export default function DNAInput({ onRun, loading }) {
  const [dna, setDna] = useState("ATGCGTACG");
  const [tool, setTool] = useState("analysis");
  const [pattern, setPattern] = useState("ACG");
  const [k, setK] = useState(1);
  const [analysisExtraCount, setAnalysisExtraCount] = useState(0);
  const [formError, setFormError] = useState("");

  const requiresPattern = useMemo(
    () => tool === "z_module" || tool === "dp",
    [tool],
  );

  const submit = (event) => {
    event.preventDefault();

    if (!dna.trim()) {
      setFormError("DNA sequence is required.");
      return;
    }

    if (requiresPattern && !pattern.trim()) {
      setFormError("Pattern is required for this tool.");
      return;
    }

    setFormError("");
    onRun({ dna, tool, pattern, k, analysisExtraCount });
  };

  return (
    <motion.form
      className="dna-form"
      onSubmit={submit}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="form-title-row">
        <h2 className="form-title">Run DNA Workflow</h2>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => setDna("ATGCGTACG")}
          disabled={loading}
        >
          Use Sample
        </button>
      </div>

      <label className="field">
        <span>DNA Sequence</span>
        <textarea
          value={dna}
          onChange={(event) => setDna(event.target.value)}
          placeholder="Example: ATGCGTACG"
          disabled={loading}
        />
      </label>

      <div className="input-grid">
        <label className="field">
          <span>Feature</span>
          <select
            value={tool}
            onChange={(event) => setTool(event.target.value)}
            disabled={loading}
          >
            {Object.entries(TOOL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {requiresPattern && (
          <label className="field">
            <span>Pattern</span>
            <input
              value={pattern}
              onChange={(event) => setPattern(event.target.value)}
              placeholder="Example: ACG"
              disabled={loading}
            />
          </label>
        )}

        {requiresPattern && (
          <label className="field field-small">
            <span>Max Mismatches (k)</span>
            <input
              type="number"
              min="0"
              value={k}
              onChange={(event) => setK(event.target.value)}
              disabled={loading}
            />
          </label>
        )}

        {tool === "analysis" && (
          <label className="field field-small">
            <span>Additional Sequences</span>
            <input
              type="number"
              min="0"
              value={analysisExtraCount}
              onChange={(event) => setAnalysisExtraCount(event.target.value)}
              disabled={loading}
            />
          </label>
        )}
      </div>

      <div className="controls">
        <motion.button
          type="submit"
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          className="run-btn"
        >
          {loading ? "Running..." : "Run Feature"}
        </motion.button>
      </div>

      {formError && <p className="form-error">{formError}</p>}
    </motion.form>
  );
}
