export const BASE_COLORS = Object.freeze({
  A: "#f97316",
  C: "#0e8a8d",
  G: "#2f7d32",
  T: "#2563eb",
});

export const STOP_CODONS = new Set(["TAA", "TAG", "TGA"]);

export function normalizeDNA(sequence) {
  return String(sequence ?? "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

export function extractIndices(block) {
  return [...block.matchAll(/Index\s+(\d+)/g)].map((match) => Number(match[1]));
}

export function parseZOutput(text) {
  const exactBlock =
    text.match(/Exact Matches:\s*([\s\S]*?)(?:Approximate Candidate Matches \(Modified Z\):|$)/)?.[1] || "";
  const candidateBlock =
    text.match(/Approximate Candidate Matches \(Modified Z\):\s*([\s\S]*)/)?.[1] || "";

  return {
    exact: extractIndices(exactBlock),
    candidates: extractIndices(candidateBlock),
  };
}

export function parseDPOutput(text) {
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

export function parseCodonOutput(text) {
  const proteinText = (text.match(/Protein:\s*([\s\S]*)/)?.[1] || text).trim();
  if (!proteinText || proteinText === "(empty)" || proteinText === "Completed successfully.") {
    return [];
  }

  return proteinText.split(/\s+/).filter(Boolean);
}

export function parseHuffmanOutput(text) {
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

export function parseAnalysisOutput(text) {
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

export function getBaseCounts(dna) {
  const counts = { A: 0, C: 0, G: 0, T: 0 };
  for (const base of dna) {
    if (counts[base] !== undefined) {
      counts[base] += 1;
    }
  }
  return counts;
}

export function buildHuffmanGraph(codeEntries) {
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
