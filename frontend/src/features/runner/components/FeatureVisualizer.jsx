import React, { useMemo } from "react";
import AnalysisVisualization from "./visualizers/AnalysisVisualization";
import CodonVisualization from "./visualizers/CodonVisualization";
import DPVisualization from "./visualizers/DPVisualization";
import HuffmanVisualization from "./visualizers/HuffmanVisualization";
import ZVisualization from "./visualizers/ZVisualization";

const VISUALIZERS = Object.freeze({
  dp: DPVisualization,
  huffman: HuffmanVisualization,
  z_module: ZVisualization,
  analysis: AnalysisVisualization,
  codon: CodonVisualization,
});

export default function FeatureVisualizer({ result }) {
  const Visualizer = useMemo(() => VISUALIZERS[result.tool], [result.tool]);

  if (!Visualizer) {
    return null;
  }

  return (
    <div className="visualizer-shell">
      <Visualizer result={result} />
    </div>
  );
}
