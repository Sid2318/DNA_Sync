import React from "react";
import { motion } from "framer-motion";
import { BasePill, MetricChip } from "./VisualizerPrimitives";
import { normalizeDNA, parseDPOutput } from "./visualizerUtils";

export default function DPVisualization({ result }) {
  const dna = normalizeDNA(result.dna);
  const pattern = normalizeDNA(result.pattern);
  const matches = parseDPOutput(result.cleanedOutput);

  if (matches.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-scan" />
        <p>No DP verified mutations were found within k = {result.k ?? 0}.</p>
      </div>
    );
  }

  return (
    <div className="viz-list">
      <div className="metric-row">
        <MetricChip label="Verified windows" value={matches.length} tone="success" />
        <MetricChip label="Threshold k" value={result.k ?? 0} />
        <MetricChip label="Pattern length" value={pattern.length} />
      </div>

      {matches.slice(0, 8).map((match, idx) => {
        const window = dna.slice(match.index, match.index + pattern.length);

        return (
          <motion.article
            key={`${match.index}-${idx}`}
            className="mutation-card"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.07, duration: 0.25 }}
          >
            <div className="mutation-head">
              <div>
                <span>Window start</span>
                <h4>Index {match.index}</h4>
              </div>
              <strong>
                {match.distance} {match.distance === 1 ? "mismatch" : "mismatches"}
              </strong>
            </div>

            <div className="mutation-compare">
              <span>Pattern</span>
              <div>
                {pattern.split("").map((base, pos) => (
                  <BasePill
                    key={`pattern-${pos}`}
                    base={base}
                    active={match.mismatchPositions.includes(pos)}
                  />
                ))}
              </div>
            </div>

            <div className="mutation-compare">
              <span>DNA window</span>
              <div>
                {window.split("").map((base, pos) => (
                  <BasePill
                    key={`window-${pos}`}
                    base={base}
                    active={match.mismatchPositions.includes(pos)}
                  />
                ))}
              </div>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
