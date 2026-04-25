import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TOOL_LABELS } from "../api/runTool";

const FEATURE_DETAILS = Object.freeze({
  analysis: {
    eyebrow: "Composition lab",
    description: "GC percentage, base balance, and mismatch heatmap.",
    sample: "ATGCGTACGTTAGC",
  },
  codon: {
    eyebrow: "Translation rail",
    description: "Split DNA into codons and watch amino acids form.",
    sample: "ATGGCCATTGTAATGGGCCGCTGAAAGGGTGCCCGATAG",
  },
  dp: {
    eyebrow: "Mutation scanner",
    description: "Verify near matches and expose mutation positions.",
    sample: "ATGCGTACGATGCGTTCGATGCGTACG",
  },
  huffman: {
    eyebrow: "Compression tree",
    description: "Build variable-bit codes from base frequencies.",
    sample: "AAAACCCCGGGTTTATATATCGCGCG",
  },
  z_module: {
    eyebrow: "Pattern lens",
    description: "Visualize exact and candidate Z-algorithm matches.",
    sample: "ACGTACGTGACGTACCTACGT",
  },
});

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

function normalizeDNA(sequence) {
  return String(sequence ?? "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

function getBaseStats(dna) {
  const clean = normalizeDNA(dna);
  const counts = { A: 0, C: 0, G: 0, T: 0 };

  for (const base of clean) {
    if (counts[base] !== undefined) {
      counts[base] += 1;
    }
  }

  const gc = clean.length ? ((counts.G + counts.C) / clean.length) * 100 : 0;
  return { clean, counts, gc };
}

export default function DNAInput({ onRun, loading }) {
  const [dna, setDna] = useState(FEATURE_DETAILS.analysis.sample);
  const [tool, setTool] = useState("analysis");
  const [pattern, setPattern] = useState("ACG");
  const [k, setK] = useState(1);
  const [analysisSequences, setAnalysisSequences] = useState([]);
  const [formError, setFormError] = useState("");

  const activeFeature = FEATURE_DETAILS[tool];
  const requiresPattern = tool === "z_module" || tool === "dp";
  const stats = useMemo(() => getBaseStats(dna), [dna]);

  const addAnalysisSequence = () => {
    setAnalysisSequences((current) => [...current, ""]);
  };

  const removeAnalysisSequence = (indexToRemove) => {
    setAnalysisSequences((current) =>
      current.filter((_, index) => index !== indexToRemove),
    );
  };

  const updateAnalysisSequence = (indexToUpdate, value) => {
    setAnalysisSequences((current) =>
      current.map((item, index) => (index === indexToUpdate ? value : item)),
    );
  };

  const selectFeature = (value) => {
    setTool(value);
    setFormError("");
  };

  const useSample = () => {
    setDna(activeFeature.sample);
    if (tool === "dp") {
      setPattern("CGTACG");
      setK(1);
    }
    if (tool === "z_module") {
      setPattern("ACGT");
      setK(1);
    }
    if (tool === "analysis") {
      setAnalysisSequences(["ATGCGTACGTTAGT", "ATGCGTTCGTTAGC"]);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    const cleanDNA = normalizeDNA(dna);
    const cleanPattern = normalizeDNA(pattern);
    const cleanExtras = analysisSequences.map(normalizeDNA).filter(Boolean);

    if (!cleanDNA) {
      setFormError("DNA sequence is required.");
      return;
    }

    if (/[^ACGT]/.test(cleanDNA)) {
      setFormError("DNA can only contain A, C, G, and T bases.");
      return;
    }

    if (requiresPattern && !cleanPattern) {
      setFormError("Pattern is required for this feature.");
      return;
    }

    if (requiresPattern && /[^ACGT]/.test(cleanPattern)) {
      setFormError("Pattern can only contain A, C, G, and T bases.");
      return;
    }

    if (cleanExtras.some((sequence) => /[^ACGT]/.test(sequence))) {
      setFormError("Additional sequences can only contain A, C, G, and T bases.");
      return;
    }

    setFormError("");
    onRun({
      dna: cleanDNA,
      tool,
      pattern: cleanPattern,
      k,
      analysisSequences: cleanExtras,
    });
  };

  return (
    <motion.form
      className="dna-form"
      onSubmit={submit}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div className="form-title-row">
        <div>
          <span className="section-kicker">Input deck</span>
          <h2 className="form-title">Run DNA Workflow</h2>
        </div>
        <button
          type="button"
          className="ghost-btn"
          onClick={useSample}
          disabled={loading}
        >
          Use Smart Sample
        </button>
      </div>

      <div className="feature-picker" role="radiogroup" aria-label="DNA feature">
        {Object.entries(TOOL_LABELS).map(([value, label], index) => {
          const details = FEATURE_DETAILS[value];
          const selected = value === tool;

          return (
            <motion.button
              type="button"
              key={value}
              className={`feature-option ${selected ? "selected" : ""}`}
              onClick={() => selectFeature(value)}
              disabled={loading}
              role="radio"
              aria-checked={selected}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.25 }}
            >
              <span>{details.eyebrow}</span>
              <strong>{label}</strong>
              <small>{details.description}</small>
            </motion.button>
          );
        })}
      </div>

      <div className="input-panel">
        <label className="field sequence-field">
          <span>DNA Sequence</span>
          <textarea
            value={dna}
            onChange={(event) => setDna(event.target.value)}
            placeholder="Example: ATGCGTACG"
            disabled={loading}
          />
        </label>

        <aside className="live-stats" aria-label="DNA sequence summary">
          <div>
            <span>Length</span>
            <strong>{stats.clean.length}</strong>
          </div>
          <div>
            <span>GC content</span>
            <strong>{stats.gc.toFixed(1)}%</strong>
          </div>
          <div className="base-meter-row">
            {Object.entries(stats.counts).map(([base, count]) => (
              <div className="base-meter" key={base}>
                <span>{base}</span>
                <motion.i
                  initial={{ height: 4 }}
                  animate={{
                    height: `${Math.max(8, stats.clean.length ? (count / stats.clean.length) * 72 : 8)}px`,
                  }}
                />
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {requiresPattern && (
        <div className="input-grid">
          <label className="field">
            <span>Pattern</span>
            <input
              value={pattern}
              onChange={(event) => setPattern(event.target.value)}
              placeholder="Example: ACG"
              disabled={loading}
            />
          </label>

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
        </div>
      )}

      {tool === "analysis" && (
        <motion.div
          className="analysis-sequences"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="analysis-sequences-head">
            <div>
              <span className="section-kicker">Similarity matrix</span>
              <h3>Compare extra sequences</h3>
            </div>
            <button
              type="button"
              className="ghost-btn"
              onClick={addAnalysisSequence}
              disabled={loading}
            >
              Add Sequence
            </button>
          </div>

          {analysisSequences.length === 0 ? (
            <p className="helper-copy">
              Add sequences if you want the heatmap to compare S0 against S1,
              S2, and beyond.
            </p>
          ) : (
            <div className="extra-sequence-list">
              {analysisSequences.map((sequence, index) => (
                <label className="field extra-sequence" key={`extra-${index}`}>
                  <span>{`Sequence S${index + 1}`}</span>
                  <input
                    value={sequence}
                    onChange={(event) =>
                      updateAnalysisSequence(index, event.target.value)
                    }
                    placeholder="Example: ATGCGTACGTTAGT"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="mini-remove"
                    onClick={() => removeAnalysisSequence(index)}
                    disabled={loading}
                    aria-label={`Remove sequence S${index + 1}`}
                  >
                    Remove
                  </button>
                </label>
              ))}
            </div>
          )}
        </motion.div>
      )}

      <div className="controls">
        <motion.button
          type="submit"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          className="run-btn"
        >
          <span>{loading ? "Running Feature" : "Run Feature"}</span>
          <i />
        </motion.button>
      </div>

      {formError && <p className="form-error">{formError}</p>}
    </motion.form>
  );
}
