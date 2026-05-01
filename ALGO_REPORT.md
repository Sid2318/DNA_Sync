# DNA Project Algorithm Report

## Notation

- n = DNA text length
- m = pattern length
- c = candidate indices count after Z filtering
- r = verified matches count
- s = number of sequences in similarity matrix
- L = average sequence length
- k = number of unique symbols for Huffman tree

## 1) Z Algorithm (Exact + Approximate Candidate Filter)

Implementation:

- cpp/features/z/z_module.cpp (computeZArray, findExactMatchesZ, findApproxCandidateIndicesZ)
- cpp/app/main.cpp (used in zMenu and dpMenu)

Complexity:

- computeZArray: TC O(n), SC O(n)
- findExactMatchesZ: TC O(n + m), SC O(n + m)
- findApproxCandidateIndicesZ: TC O(n + m), SC O(n)

Why it is better:

- Better than naive exact pattern search O(nm) because it is linear.
- Better as a pre-filter for approximate matching: it quickly narrows candidate positions before expensive verification.
- In this project, this reduces DP verification load in mutation detection.

Comparison:

- vs Naive matching: much faster for long DNA strings.
- vs KMP: same asymptotic TC for exact matching, but this code also reuses Z logic for prefix/suffix based approximate candidate filtering.

## 2) DP and Mutation Verification

Implementation:

- cpp/features/dp/dp_module.cpp (editDistance, getMismatchPositions, verifyCandidatesWithDP)
- cpp/app/main.cpp (dpMenu)

Complexity:

- editDistance:
  - Equal-length shortcut (Hamming path): TC O(m), SC O(1)
  - General path (linear-space Levenshtein): TC O(mn), SC O(min(m, n))
- getMismatchPositions:
  - Equal lengths: TC O(m), SC O(1)
  - Unequal lengths (full DP + traceback): TC O(mn), SC O(mn)
- verifyCandidatesWithDP:
  - TC O(c*m + r*log r + n)
  - SC O(n + r)

Why it is better:

- Better than running full DP at every shift in text, because Z pre-filter gives candidate indices first.
- Better in memory than full-matrix DP for distance-only calls due to linear-space edit distance.
- Faster in practice due to early cutoff in mismatch counting.

Comparison:

- vs Pure DP on all windows: lower practical runtime because c is usually far smaller than n.
- vs Hamming-only approaches: this module can still compute full edit distance when lengths differ.

## 3) Codon Translation (Hash Table Lookup)

Implementation:

- cpp/features/codon/codon.cpp (loadCodonTable, translateDNAToProtein)
- cpp/app/main.cpp (codonMenu)

Complexity:

- loadCodonTable: TC O(lines), SC O(unique codons) ~ O(64)
- translateDNAToProtein: TC O(n), SC O(n/3)

Why it is better:

- Better than scanning a codon list for each triplet.
- Unordered map lookup gives average O(1) per codon, making full translation linear.

Comparison:

- vs Linear search per codon: this is much faster and cleaner as table size grows.

## 4) Huffman Compression

Implementation:

- cpp/features/huffman/huffman.cpp (compressDNAHuffman)
- cpp/app/main.cpp (huffmanMenu)

Complexity:

- compressDNAHuffman: TC O(n + k log k), SC O(n + k)

Why it is better:

- Better than fixed 8-bit ASCII storage for symbol sequences, especially when symbol frequencies are skewed.
- Produces variable-length prefix codes optimized for observed frequencies.

Comparison:

- vs ASCII: almost always fewer bits.
- vs fixed 2-bit DNA encoding:
  - similar when frequencies are near uniform,
  - potentially better when one/two symbols dominate,
  - may be worse for very short inputs due to code/tree overhead.

## 5) Analysis Utilities (GC + Similarity Matrix)

Implementation:

- cpp/features/analysis/analysis.cpp (calculateGCContent, mismatchCount, buildSimilarityMatrix)
- cpp/app/main.cpp (analysisMenu)

Complexity:

- calculateGCContent: TC O(n), SC O(1)
- mismatchCount: TC O(min(len1, len2)), SC O(1)
- buildSimilarityMatrix: TC O(s^2 \* L), SC O(s^2)

Why it is better:

- Better than expensive alignment-based comparison when only mismatch-based similarity is needed.
- Uses matrix symmetry and computes pair (i, j) once, then mirrors to (j, i), cutting redundant work.

Comparison:

- vs full alignment for all pairs: significantly cheaper for quick comparative analysis.

## Practical Ranking in This Project

- Fastest for search: Z-based exact/candidate matching.
- Most accurate for mutation verification: DP verification step.
- Best for compression objective: Huffman vs ASCII.
- Best for biological translation objective: codon hash lookup.
- Best for multi-sequence summary: mismatch-based similarity matrix.

## Overall Why This Hybrid Design Is Better

The project combines a linear-time filter (Z) with selective verification (DP). This is better than a single heavy method because it balances:

- speed on large DNA texts,
- acceptable memory use,
- and better practical accuracy for mutation search.
