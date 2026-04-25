import React from "react";
import { motion } from "framer-motion";
import { BasePill, MetricChip } from "./VisualizerPrimitives";
import { getBaseCounts, normalizeDNA, parseAnalysisOutput } from "./visualizerUtils";

export default function AnalysisVisualization({ result }) {
  const dna = normalizeDNA(result.dna);
  const parsed = parseAnalysisOutput(result.cleanedOutput);
  const counts = getBaseCounts(dna);
  const maxCount = Math.max(...Object.values(counts), 1);
  const maxValue = Math.max(...parsed.matrix.flat(), 1);

  return (
    <div className="viz-grid">
      <div className="metric-row">
        <MetricChip label="GC content" value={`${parsed.gc.toFixed(2)}%`} tone="success" />
        <MetricChip label="Sequences" value={parsed.labels.length || 1} />
        <MetricChip label="DNA length" value={dna.length} />
      </div>

      <div className="analysis-dashboard">
        <div className="gc-meter">
          <span>GC Content</span>
          <div className="gc-track">
            <motion.div
              className="gc-fill"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, Math.min(100, parsed.gc))}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </div>
          <strong>{parsed.gc.toFixed(2)}%</strong>
        </div>

        <div className="base-composition">
          {Object.entries(counts).map(([base, count], index) => (
            <div className="composition-bar" key={base}>
              <BasePill base={base} />
              <motion.i
                initial={{ height: 0 }}
                animate={{ height: `${(count / maxCount) * 100}%` }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
              />
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </div>

      {parsed.matrix.length > 0 ? (
        <div className="matrix-wrap">
          <div className="matrix-heading">
            <strong>Mismatch heatmap</strong>
            <span>Darker cells mean more differences.</span>
          </div>
          {parsed.matrix.map((row, rIdx) => (
            <div className="matrix-row" key={parsed.labels[rIdx] || rIdx}>
              <span className="matrix-label">{parsed.labels[rIdx] || `S${rIdx}`}</span>
              {row.map((value, cIdx) => {
                const alpha = 0.18 + (value / maxValue) * 0.68;
                return (
                  <motion.div
                    key={`${rIdx}-${cIdx}`}
                    className="matrix-cell"
                    style={{ backgroundColor: `rgba(14, 138, 141, ${alpha.toFixed(3)})` }}
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (rIdx + cIdx) * 0.035, duration: 0.18 }}
                  >
                    {value}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
