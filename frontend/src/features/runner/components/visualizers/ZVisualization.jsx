import React from "react";
import { motion } from "framer-motion";
import { BasePill, MetricChip } from "./VisualizerPrimitives";
import { normalizeDNA, parseZOutput } from "./visualizerUtils";

export default function ZVisualization({ result }) {
  const dna = normalizeDNA(result.dna);
  const pattern = normalizeDNA(result.pattern);
  const patternLength = Math.max(1, pattern.length);
  const parsed = parseZOutput(result.cleanedOutput);
  const visibleDNA = dna.slice(0, 140);
  const scanDNA = visibleDNA.slice(0, Math.min(36, visibleDNA.length));
  const scanDistance = Math.max(0, (scanDNA.length - patternLength) * 38);
  const mark = new Array(visibleDNA.length).fill("none");
  const candidateOnly = parsed.candidates.filter((idx) => !parsed.exact.includes(idx));

  for (const start of candidateOnly) {
    for (let i = 0; i < patternLength; i += 1) {
      const idx = start + i;
      if (idx >= 0 && idx < mark.length) {
        mark[idx] = "candidate";
      }
    }
  }

  for (const start of parsed.exact) {
    for (let i = 0; i < patternLength; i += 1) {
      const idx = start + i;
      if (idx >= 0 && idx < mark.length) {
        mark[idx] = "exact";
      }
    }
  }

  const alignments = [
    ...parsed.exact.map((index) => ({ index, type: "Exact" })),
    ...candidateOnly.map((index) => ({ index, type: "Candidate" })),
  ].slice(0, 6);

  return (
    <div className="viz-grid">
      <div className="metric-row">
        <MetricChip label="Exact matches" value={parsed.exact.length} tone="success" />
        <MetricChip label="Z candidates" value={parsed.candidates.length} tone="warm" />
        <MetricChip label="Pattern" value={pattern || "N/A"} />
      </div>

      <div className="pattern-lens">
        <span>Pattern lens</span>
        <div>
          {pattern.split("").map((base, index) => (
            <BasePill key={`${base}-${index}`} base={base} active />
          ))}
        </div>
      </div>

      <div className="z-scan-stage" aria-label="Animated Z pattern matching scan">
        <div className="z-scan-copy">
          <strong>Z scan animation</strong>
          <span>The pattern window slides across the DNA and lights up reported match zones.</span>
        </div>

        <div
          className="z-scan-rail"
          style={{ width: `${Math.max(360, scanDNA.length * 38)}px` }}
        >
          <div className="z-scan-bases">
            {scanDNA.split("").map((base, idx) => (
              <span
                key={`scan-${base}-${idx}`}
                className={mark[idx] !== "none" ? mark[idx] : ""}
              >
                {base}
              </span>
            ))}
          </div>

          <motion.div
            className="z-scanner"
            initial={{ x: 0 }}
            animate={{ x: scanDistance }}
            transition={{
              duration: Math.max(2.2, scanDNA.length * 0.08),
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            style={{ minWidth: `${Math.max(58, patternLength * 38 + 16)}px` }}
          >
            <small>Compare pattern</small>
            <div>
              {pattern.split("").map((base, index) => (
                <BasePill key={`scan-pattern-${base}-${index}`} base={base} active />
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="dna-track" aria-label="DNA match track">
        {visibleDNA.split("").map((base, idx) => (
          <motion.div
            key={`${base}-${idx}`}
            className={`dna-cell ${mark[idx]}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.006, duration: 0.2 }}
          >
            <span>{base}</span>
            <small>{idx}</small>
          </motion.div>
        ))}
      </div>

      {alignments.length > 0 ? (
        <div className="alignment-stack">
          {alignments.map((item, index) => (
            <motion.div
              className={`alignment-row ${item.type.toLowerCase()}`}
              key={`${item.type}-${item.index}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <span>{item.type}</span>
              <strong>Index {item.index}</strong>
              <i style={{ width: `${Math.min(100, patternLength * 12)}px` }} />
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="viz-empty">No Z matches were reported for this pattern.</p>
      )}
    </div>
  );
}
