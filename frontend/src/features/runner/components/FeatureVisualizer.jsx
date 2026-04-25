import React, { useMemo } from "react";
import { motion } from "framer-motion";

const BASE_COLORS = Object.freeze({
  A: "#f97316",
  C: "#0e8a8d",
  G: "#2f7d32",
  T: "#2563eb",
});

function normalizeDNA(sequence) {
  return String(sequence ?? "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

function extractIndices(block) {
  return [...block.matchAll(/Index\s+(\d+)/g)].map((match) => Number(match[1]));
}

function parseZOutput(text) {
  const exactBlock =
    text.match(/Exact Matches:\s*([\s\S]*?)(?:Approximate Candidate Matches \(Modified Z\):|$)/)?.[1] || "";
  const candidateBlock =
    text.match(/Approximate Candidate Matches \(Modified Z\):\s*([\s\S]*)/)?.[1] || "";

  return {
    exact: extractIndices(exactBlock),
    candidates: extractIndices(candidateBlock),
  };
}

function parseDPOutput(text) {
  return [...text.matchAll(/Index\s+(\d+)\s+\((\d+)\s+mismatch(?:es)?\)(?:\s+at positions:\s*([0-9,\s]+))?/g)].map(
    (match) => ({
      index: Number(match[1]),
      distance: Number(match[2]),
      mismatchPositions: (match[3] || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .map(Number),
    }),
  );
}

function parseCodonOutput(text) {
  const proteinText = (text.match(/Protein:\s*([\s\S]*)/)?.[1] || text).trim();
  if (!proteinText || proteinText === "(empty)" || proteinText === "Completed successfully.") {
    return [];
  }

  return proteinText.split(/\s+/).filter(Boolean);
}

function parseHuffmanOutput(text) {
  const codeBlock = text.match(/Huffman Codes:\s*([\s\S]*?)Encoded DNA:/)?.[1] || "";
  const codeEntries = [...codeBlock.matchAll(/([A-Za-z])\s*->\s*([01]+)/g)].map((match) => ({
    symbol: match[1].toUpperCase(),
    code: match[2],
  }));

  const encodedDNA = (text.match(/Encoded DNA:\s*([01]+)/)?.[1] || "").trim();
  const originalBits = Number(text.match(/Original size \(ASCII bits\):\s*(\d+)/)?.[1] || 0);
  const compressedBits = Number(text.match(/Compressed size \(Huffman bits\):\s*(\d+)/)?.[1] || 0);
  const savings = Number(text.match(/Savings vs ASCII:\s*([0-9.]+)/)?.[1] || 0);

  return { codeEntries, encodedDNA, originalBits, compressedBits, savings };
}

function parseAnalysisOutput(text) {
  const gc = Number(text.match(/GC Content:\s*([0-9.]+)%/)?.[1] || 0);
  const matrixSection = text.split("Similarity Matrix (mismatch count):")[1] || "";
  const rowLines = matrixSection
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => /^S\d+\s+-?\d+/.test(line));

  const labels = rowLines.map((line) => line.split(/\s+/)[0]);
  const matrix = rowLines.map((line) =>
    line
      .split(/\s+/)
      .slice(1)
      .map((value) => Number(value)),
  );

  return { gc, labels, matrix };
}

function getBaseCounts(dna) {
  const counts = { A: 0, C: 0, G: 0, T: 0 };
  for (const base of dna) {
    if (counts[base] !== undefined) {
      counts[base] += 1;
    }
  }
  return counts;
}

function buildHuffmanGraph(codeEntries) {
  const nodesById = new Map();
  const edges = [];
  const root = { id: "root", label: "root", depth: 0, isLeaf: false };
  nodesById.set(root.id, root);

  for (const entry of codeEntries) {
    let prefix = "";
    let parentId = "root";

    for (const bit of entry.code) {
      prefix += bit;
      const id = prefix;

      if (!nodesById.has(id)) {
        nodesById.set(id, {
          id,
          label: prefix,
          depth: prefix.length,
          isLeaf: false,
          symbol: null,
        });
        edges.push({ from: parentId, to: id, bit });
      }

      parentId = id;
    }

    const leaf = nodesById.get(prefix);
    leaf.isLeaf = true;
    leaf.symbol = entry.symbol;
    leaf.label = entry.symbol;
    leaf.code = entry.code;
  }

  const levels = [];
  for (const node of nodesById.values()) {
    if (!levels[node.depth]) {
      levels[node.depth] = [];
    }
    levels[node.depth].push(node);
  }

  const positioned = new Map();
  levels.forEach((level, depth) => {
    level
      .sort((a, b) => a.id.localeCompare(b.id))
      .forEach((node, index) => {
        positioned.set(node.id, {
          ...node,
          x: ((index + 1) / (level.length + 1)) * 100,
          y: depth * 82 + 34,
        });
      });
  });

  return {
    nodes: [...positioned.values()],
    edges: edges.map((edge) => ({
      ...edge,
      fromNode: positioned.get(edge.from),
      toNode: positioned.get(edge.to),
    })),
    height: Math.max(180, levels.length * 82 + 34),
  };
}

function MetricChip({ label, value, tone = "neutral" }) {
  return (
    <div className={`metric-chip ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function BasePill({ base, active = false, muted = false }) {
  return (
    <span
      className={`base-pill ${active ? "active" : ""} ${muted ? "muted" : ""}`}
      style={{ "--base-color": BASE_COLORS[base] || "#64748b" }}
    >
      {base}
    </span>
  );
}

function ZVisualization({ result }) {
  const dna = normalizeDNA(result.dna);
  const pattern = normalizeDNA(result.pattern);
  const patternLength = Math.max(1, pattern.length);
  const parsed = parseZOutput(result.cleanedOutput);
  const visibleDNA = dna.slice(0, 140);
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

function DPVisualization({ result }) {
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

function CodonVisualization({ result }) {
  const dna = normalizeDNA(result.dna);
  const proteins = parseCodonOutput(result.cleanedOutput);
  const codons = [];

  for (let i = 0; i + 2 < dna.length; i += 3) {
    codons.push(dna.slice(i, i + 3));
  }

  if (proteins.length === 0) {
    return <p className="viz-empty">No translated amino acids available.</p>;
  }

  return (
    <div className="viz-grid">
      <div className="metric-row">
        <MetricChip label="Codons read" value={proteins.length} tone="success" />
        <MetricChip label="Unused bases" value={dna.length % 3} />
        <MetricChip label="DNA length" value={dna.length} />
      </div>

      <div className="codon-flow">
        {proteins.slice(0, 24).map((protein, idx) => (
          <motion.div
            key={`${protein}-${idx}`}
            className="codon-step"
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: idx * 0.045, duration: 0.22 }}
          >
            <div className="codon-triplet">
              {(codons[idx] || "---").split("").map((base, baseIndex) => (
                <BasePill key={`${idx}-${baseIndex}`} base={base} muted={!BASE_COLORS[base]} />
              ))}
            </div>
            <strong>{protein}</strong>
            <small>{`#${idx + 1}`}</small>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function HuffmanVisualization({ result }) {
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

function AnalysisVisualization({ result }) {
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

export default function FeatureVisualizer({ result }) {
  const content = useMemo(() => {
    switch (result.tool) {
      case "z_module":
        return <ZVisualization result={result} />;
      case "dp":
        return <DPVisualization result={result} />;
      case "codon":
        return <CodonVisualization result={result} />;
      case "huffman":
        return <HuffmanVisualization result={result} />;
      case "analysis":
        return <AnalysisVisualization result={result} />;
      default:
        return null;
    }
  }, [result]);

  return <div className="visualizer-shell">{content}</div>;
}
