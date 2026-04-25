import React from "react";
import { motion } from "framer-motion";
import { BasePill, MetricChip } from "./VisualizerPrimitives";
import { BASE_COLORS, normalizeDNA, parseCodonOutput, STOP_CODONS } from "./visualizerUtils";

export default function CodonVisualization({ result }) {
  const dna = normalizeDNA(result.dna);
  const proteins = parseCodonOutput(result.cleanedOutput);
  const codons = [];

  for (let i = 0; i + 2 < dna.length; i += 3) {
    codons.push(dna.slice(i, i + 3));
  }

  if (codons.length === 0) {
    return <p className="viz-empty">No complete codons are available.</p>;
  }

  const stopIndex = codons.findIndex((codon) => STOP_CODONS.has(codon));
  const translatedCount =
    stopIndex >= 0 ? Math.min(proteins.length, stopIndex) : proteins.length;

  return (
    <div className="viz-grid">
      <div className="metric-row">
        <MetricChip label="Total codons" value={codons.length} />
        <MetricChip label="Translated" value={translatedCount} tone="success" />
        <MetricChip label="Unused bases" value={dna.length % 3} />
        <MetricChip label="DNA length" value={dna.length} />
      </div>

      {stopIndex >= 0 ? (
        <div className="translation-note">
          Translation stopped at codon #{stopIndex + 1} ({codons[stopIndex]}).
          Codons after that are still part of your input, but they are not
          translated into protein.
        </div>
      ) : null}

      <div className="codon-flow">
        {codons.slice(0, 24).map((codon, idx) => {
          const isStop = STOP_CODONS.has(codon);
          const isSkipped = stopIndex >= 0 && idx > stopIndex;
          const protein = isStop
            ? "STOP"
            : isSkipped
              ? "Skipped"
              : proteins[idx] || "Unknown";

          return (
            <motion.div
              key={`${codon}-${idx}`}
              className={`codon-step ${isStop ? "stop" : ""} ${isSkipped ? "skipped" : ""}`}
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: idx * 0.045, duration: 0.22 }}
            >
              <div className="codon-triplet">
                {codon.split("").map((base, baseIndex) => (
                  <BasePill
                    key={`${idx}-${baseIndex}`}
                    base={base}
                    active={isStop}
                    muted={isSkipped || !BASE_COLORS[base]}
                  />
                ))}
              </div>
              <strong>{protein}</strong>
              <small>{`#${idx + 1}${isSkipped ? " after STOP" : ""}`}</small>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
