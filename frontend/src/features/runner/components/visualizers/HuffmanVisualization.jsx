import React from "react";
import { motion } from "framer-motion";
import { BasePill, MetricChip } from "./VisualizerPrimitives";
import {
  buildHuffmanGraph,
  getBaseCounts,
  normalizeDNA,
  parseHuffmanOutput,
} from "./visualizerUtils";

export default function HuffmanVisualization({ result }) {
  const dna = normalizeDNA(result.dna);
  const parsed = parseHuffmanOutput(result.cleanedOutput);
  const counts = getBaseCounts(dna);
  const graph = buildHuffmanGraph(parsed.codeEntries);
  const compressionRatio =
    parsed.originalBits > 0
      ? Math.max(0, Math.min(100, 100 - (parsed.compressedBits / parsed.originalBits) * 100))
      : 0;

  if (parsed.codeEntries.length === 0) {
    return <p className="viz-empty">Huffman codes are not available.</p>;
  }

  return (
    <div className="viz-grid">
      <div className="metric-row">
        <MetricChip label="Symbols" value={parsed.codeEntries.length} tone="success" />
        <MetricChip label="Original bits" value={parsed.originalBits} />
        <MetricChip label="Compressed bits" value={parsed.compressedBits} tone="warm" />
      </div>

      <div className="compression-panel">
        <div className="compression-bar-wrap">
          <motion.div
            className="compression-bar"
            initial={{ width: 0 }}
            animate={{ width: `${compressionRatio}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        </div>
        <span>{parsed.savings.toFixed(2)}% savings vs ASCII</span>
      </div>

      <div className="huffman-split">
        <div className="frequency-bars">
          {Object.entries(counts).map(([base, count]) => (
            <div className="frequency-row" key={base}>
              <BasePill base={base} />
              <div>
                <motion.i
                  initial={{ width: 0 }}
                  animate={{ width: `${dna.length ? (count / dna.length) * 100 : 0}%` }}
                  transition={{ duration: 0.7 }}
                />
              </div>
              <strong>{count}</strong>
            </div>
          ))}
        </div>

        <div className="code-book">
          {parsed.codeEntries.map((entry) => (
            <div key={entry.symbol}>
              <BasePill base={entry.symbol} />
              <code>{entry.code}</code>
            </div>
          ))}
        </div>
      </div>

      <div className="tree-canvas" style={{ height: graph.height }}>
        <svg viewBox={`0 0 100 ${graph.height}`} preserveAspectRatio="none">
          {graph.edges.map((edge, index) => (
            <motion.line
              key={`${edge.from}-${edge.to}`}
              x1={edge.fromNode.x}
              y1={edge.fromNode.y}
              x2={edge.toNode.x}
              y2={edge.toNode.y}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: index * 0.04, duration: 0.28 }}
            />
          ))}
        </svg>
        {graph.nodes.map((node, index) => (
          <motion.div
            key={node.id}
            className={`tree-node ${node.isLeaf ? "leaf" : ""}`}
            style={{ left: `${node.x}%`, top: node.y }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.04, duration: 0.22 }}
          >
            <strong>{node.label}</strong>
            <span>{node.isLeaf ? node.code : node.id}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
