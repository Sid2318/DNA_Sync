import React from "react";
import { BASE_COLORS } from "./visualizerUtils";

export function MetricChip({ label, value, tone = "neutral" }) {
  return (
    <div className={`metric-chip ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function BasePill({ base, active = false, muted = false }) {
  return (
    <span
      className={`base-pill ${active ? "active" : ""} ${muted ? "muted" : ""}`}
      style={{ "--base-color": BASE_COLORS[base] || "#64748b" }}
    >
      {base}
    </span>
  );
}
