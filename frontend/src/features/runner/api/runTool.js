import axios from "axios";

export const TOOL_LABELS = Object.freeze({
  analysis: "GC Content and Similarity",
  codon: "DNA to Protein",
  dp: "Mutation Detection (DP)",
  huffman: "Huffman Compression",
  z_module: "Pattern Matching (Z)",
});

const MENU_OPTION_BY_TOOL = Object.freeze({
  analysis: "6",
  codon: "4",
  dp: "3",
  huffman: "5",
  z_module: "2",
});

function normalizeDNAInput(sequence) {
  return String(sequence ?? "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

function toNonNegativeInt(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(0, Math.floor(parsed));
}

export function buildStdinScript(formData) {
  const tool = formData?.tool || "analysis";
  const menuOption = MENU_OPTION_BY_TOOL[tool];

  if (!menuOption) {
    throw new Error("Unsupported tool selection.");
  }

  const dna = normalizeDNAInput(formData?.dna);
  if (!dna) {
    throw new Error("Please enter a DNA sequence.");
  }

  const lines = ["1", "2", dna, menuOption];

  if (tool === "z_module" || tool === "dp") {
    const pattern = normalizeDNAInput(formData?.pattern);
    if (!pattern) {
      throw new Error("Pattern is required for this tool.");
    }

    const k = toNonNegativeInt(formData?.k, 1);
    lines.push(pattern, String(k));
  }

  if (tool === "analysis") {
    const analysisSequences = Array.isArray(formData?.analysisSequences)
      ? formData.analysisSequences.map(normalizeDNAInput).filter(Boolean)
      : [];

    lines.push(String(analysisSequences.length));
    lines.push(...analysisSequences);
  }

  lines.push("7");
  return `${lines.join("\n")}\n`;
}

const MENU_BLOCK_PATTERN =
  /===== DNA Analysis System =====\s*1\. Load DNA\s*2\. Pattern Matching \(Z-Algorithm\)\s*3\. Mutation Detection \(DP Verification\)\s*4\. DNA -> Protein\s*5\. Huffman Compression\s*6\. GC Content \+ Similarity Matrix\s*7\. Exit\s*/g;

const PROMPT_PATTERNS = [
  /Choose an option:\s*/g,
  /Select input mode:\s*/g,
  /Enter DNA sequence:\s*/g,
  /Enter pattern:\s*/g,
  /Enter pattern for mutation detection:\s*/g,
  /Allowed mismatches for modified Z candidate filtering:\s*/g,
  /Enter mismatch threshold k for DP verification:\s*/g,
  /How many additional sequences for similarity matrix\?\s*/g,
  /Reuse last pattern \([^\n]*?\)\? \(y\/n\):\s*/g,
  /Enter sequence \d+:\s*/g,
  /Invalid number\. Try again\.\s*/g,
];

const NON_ESSENTIAL_LINE_PATTERNS = [
  /^\s*1\. Load from file \([^\n]*\)\s*$/gm,
  /^\s*2\. Enter DNA manually\s*$/gm,
  /^\s*DNA loaded successfully \(length = \d+\)\.\s*$/gm,
  /^\s*\[Load DNA\]\s*$/gm,
  /^\s*Load DNA first \(option 1\)\.\s*$/gm,
];

export function cleanTerminalOutput(rawOutput) {
  let text = String(rawOutput ?? "").replace(/\r/g, "");

  text = text.replace(MENU_BLOCK_PATTERN, "");

  for (const pattern of PROMPT_PATTERNS) {
    text = text.replace(pattern, "");
  }

  for (const pattern of NON_ESSENTIAL_LINE_PATTERNS) {
    text = text.replace(pattern, "");
  }

  text = text.replace(/Input stream closed\. Exiting\.[^\n]*/g, "");
  text = text.replace(/Exiting\. Output log saved to [^\n]*/g, "");
  text = text
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text || "Completed successfully.";
}

export async function runTool(stdinScript) {
  const response = await axios.post("/api/run", { input: stdinScript });
  return response.data;
}
