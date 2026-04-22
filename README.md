# DNA Analysis System (Hybrid Algorithms in C++)

A modular, menu-driven C++ project for DNA processing using a hybrid algorithmic pipeline:

- Z-Algorithm for fast exact and candidate approximate pattern matching
- Dynamic Programming (Levenshtein edit distance) for mutation verification
- Huffman Coding for DNA compression
- Codon table based DNA to protein translation
- Bioinformatics analysis (DNA validation, GC content, similarity matrix)

This project is structured as a 5-member team submission with clear module boundaries.

## 1. Complete Project Structure

```text
dna_project/
|-- main.cpp
|-- z_module.cpp
|-- dp_module.cpp
|-- huffman.cpp
|-- codon.cpp
|-- analysis.cpp
|
|-- z_module.h
|-- dp_module.h
|-- huffman.h
|-- codon.h
|-- analysis.h
|
|-- codon.txt
|-- dna.txt
|-- output.txt
|-- README.md
|-- dna_system.exe (generated after build)
```

## 2. Language and Coding Style

- Language: C++17
- STL used: vector, string, unordered_map, unordered_set, priority_queue, sstream, iostream, iomanip
- Style update in this version:
- `using namespace std;` is used so `std::` prefixes are removed in source and header declarations

## 3. Team Member Responsibility Mapping

- Member 1: Z-Algorithm module (`z_module.h`, `z_module.cpp`)
- Member 2: DP mutation module (`dp_module.h`, `dp_module.cpp`)
- Member 3: Huffman module (`huffman.h`, `huffman.cpp`)
- Member 4: Codon translation module (`codon.h`, `codon.cpp`, `codon.txt`)
- Member 5: DNA analysis module (`analysis.h`, `analysis.cpp`)
- Integrator: `main.cpp` (menu + pipeline + logging)

## 4. Input and Output: Exactly What Goes Where

### 4.1 File Input: `dna.txt`

- Purpose: Default DNA sequence source when menu option 1 -> mode 1 is used
- Current sample content:

```text
ATGCGTACG
```

- Supported format:
- Single or multiple lines
- Whitespace is removed by normalization
- Case-insensitive input is accepted because it is converted to uppercase
- Validation rule: only A, C, G, T allowed after normalization

### 4.2 File Input: `codon.txt`

- Purpose: External codon map used for translation (no hardcoded table in C++ source)
- Current format per line:

```text
CODON AMINO
```

Example:

```text
ATG Met
TAA STOP
```

Rules:

- Lines starting with `#` are comments
- Codon token must be 3 characters
- Translation stops when amino acid is `STOP` or `*`

### 4.3 Runtime User Input (Menu)

The program asks for user inputs at different stages:

- Menu selection (1 to 7)
- DNA load mode (file/manual)
- DNA sequence when manual mode is selected
- Pattern string for matching and mutation detection
- Allowed mismatch threshold `k`
- Number of additional sequences for similarity matrix
- Additional DNA sequences for matrix rows

### 4.4 Output Channels

- Console: all interactive results are printed live
- `output.txt`: every operation appends a structured log section

## 5. End-to-End Workflow (System Pipeline)

Main pipeline implemented by `main.cpp`:

1. Load DNA from `dna.txt` or manual input
2. Normalize and validate DNA
3. Pattern input
4. Run exact matching with Z-algorithm
5. Run modified Z-based candidate filtering
6. Verify candidates with DP edit distance (`<= k`)
7. Print final matches and mismatch positions
8. Translate DNA to protein using codon file
9. Compress DNA using Huffman coding
10. Compute GC content
11. Build mismatch-based similarity matrix
12. Append results to `output.txt`

## 6. Menu Behavior (Detailed)

### Option 1: Load DNA

Flow:

- Ask load mode (file/manual)
- Read DNA
- Normalize (`normalizeDNA`)
- Validate (`validateDNA`)
- Save accepted sequence to in-memory `dna`
- Append `[Load DNA]` section to `output.txt`

Expected input:

- File mode: valid `dna.txt`
- Manual mode: any text containing DNA letters (whitespace is removed)

Failure cases:

- Missing/empty file
- Invalid DNA characters

### Option 2: Pattern Matching (Z-Algorithm)

Flow:

- Take pattern input
- Normalize + validate pattern
- Ask mismatch threshold `k`
- Run:
- `findExactMatchesZ(dna, pattern)`
- `findApproxCandidateIndicesZ(dna, pattern, k)`
- Print exact matches and modified-Z candidate matches
- Save pattern as `lastPattern`
- Append `[Pattern Matching]` log block

### Option 3: Mutation Detection (DP Verification)

Flow:

- Optionally reuse `lastPattern`
- Validate pattern
- Ask threshold `k`
- Get candidates from modified Z
- Verify using:
- `verifyCandidatesWithDP(dna, pattern, candidates, k)`
- For each accepted match print:
- index
- edit distance (mismatch count)
- mismatch positions
- Append `[Mutation Detection]` log block

### Option 4: DNA -> Protein

Flow:

- Ensure codon table is loaded from `codon.txt`
- Run `translateDNAToProtein`
- Convert vector to printable line with `proteinToString`
- Print and log `[Translation]`

### Option 5: Huffman Compression

Flow:

- Run `compressDNAHuffman(dna)`
- Print detailed report with `printHuffmanReport`
- Report includes code table, encoded DNA, bit sizes, savings
- Append `[Huffman Compression]`

### Option 6: GC Content + Similarity Matrix

Flow:

- Compute GC percentage with `calculateGCContent`
- Ask how many additional sequences to compare
- Validate each provided sequence
- Build matrix with `buildSimilarityMatrix`
- Print with `printSimilarityMatrix`
- Append `[Analysis]`

### Option 7: Exit

- Program terminates gracefully
- Indicates output location (`output.txt`)

## 7. File-by-File Technical Explanation

### 7.1 `main.cpp` (Integration Layer)

Purpose:

- Coordinates all modules
- Provides CLI menu loop
- Handles input validation flow and operation logging

Key helper functions:

- `initializeOutputFile()`
- `appendToOutput(const string&)`
- `readDNAFromFile(const string&)`
- `readInt(const string&)`
- `readLine(const string&)`
- `isYes(const string&)`
- `printIndexList(...)`
- `printMutationResults(...)`
- `printMenu()`

Main state variables:

- `dna`: current active DNA sequence
- `lastPattern`: remembers last matching pattern
- `codonTable`: loaded codon dictionary

### 7.2 `z_module.h`

Public API for fast matching:

- `computeZArray`
- `findExactMatchesZ`
- `findApproxCandidateIndicesZ`

### 7.3 `z_module.cpp`

Implements Z-based matching.

- `computeZArray`: linear-time Z box computation
- `findExactMatchesZ`: classic `pattern + "$" + text` based exact occurrences
- `computePrefixMatches` (internal): longest prefix match at each alignment
- `computeSuffixMatches` (internal): longest suffix match using reversed strings and Z
- `findApproxCandidateIndicesZ`: combines prefix/suffix match lengths and accepts candidate alignments likely within mismatch threshold

Why this module matters:

- Keeps search near O(n + m)
- Avoids checking every substring with expensive DP

### 7.4 `dp_module.h`

Defines mutation verification structures and API:

- `struct MutationResult`
- `editDistance`
- `getMismatchPositions`
- `verifyCandidatesWithDP`

### 7.5 `dp_module.cpp`

Implements dynamic programming and candidate verification.

- `editDistance`: Levenshtein DP transitions
- `getMismatchPositions`: mismatch/operation location extraction
- `verifyCandidatesWithDP`:
- deduplicates candidate indices (`unordered_set`)
- computes DP distance only for candidate windows
- retains those with distance `<= k`
- sorts by distance, then index

### 7.6 `huffman.h`

Defines compression result object and API:

- `struct HuffmanResult`
- `compressDNAHuffman`
- `printHuffmanReport`

### 7.7 `huffman.cpp`

Implements Huffman coding pipeline:

- Frequency counting
- Tree construction using min-heap (`priority_queue` with custom comparator)
- Recursive code generation
- DNA encoding
- Compression statistics output

Internal helpers:

- `HuffmanNode`
- `CompareNode`
- `generateCodes`
- `deleteTree`

### 7.8 `codon.h`

Defines codon table type and translation API:

- `using CodonTable = unordered_map<string, string>`
- `loadCodonTable`
- `translateDNAToProtein`
- `proteinToString`

### 7.9 `codon.cpp`

Implements translation subsystem:

- Normalization helpers (`toUpperAndTrimDNA`, `toUpperWord`)
- File parser for codon dictionary (`loadCodonTable`)
- Triplet translation loop (`translateDNAToProtein`)
- STOP codon termination
- Unknown codon handling as `Unknown`

### 7.10 `analysis.h`

Declares analysis utilities:

- `normalizeDNA`
- `validateDNA`
- `calculateGCContent`
- `mismatchCount`
- `buildSimilarityMatrix`
- `printSimilarityMatrix`

### 7.11 `analysis.cpp`

Implements sequence-level analysis:

- DNA cleanup and uppercase normalization
- strict DNA alphabet validation
- GC percent calculation
- pairwise mismatch metric
- similarity matrix construction and formatted output

### 7.12 `codon.txt`

Data file containing codon to amino acid mapping used by translation module.

### 7.13 `dna.txt`

Primary default DNA input file used by load mode 1.

### 7.14 `output.txt`

Runtime-generated log file. Each menu operation appends a named section.

## 8. Algorithm Complexity Summary

- Exact Z-match: O(n + m)
- Modified Z candidate generation: O(n + m)
- DP verification per candidate: O(m^2) worst case for equal length windows
- Huffman build: O(s log s), where `s` is number of unique symbols
- Translation: O(n)
- GC content: O(n)
- Similarity matrix for `t` sequences: O(t^2 * L)

## 9. Build and Run

Compile:

```bash
g++ -std=c++17 -O2 -Wall -Wextra -pedantic main.cpp z_module.cpp dp_module.cpp huffman.cpp codon.cpp analysis.cpp -o dna_system
```

Run on Windows PowerShell:

```powershell
.\dna_system.exe
```

## 10. Sample Test Scenario

Use:

- DNA: `ATGCGTACG`
- Pattern: `ACG`
- `k = 1`

Expected behavior:

- Exact match contains index 6
- DP verified approximate matches include near locations based on threshold
- GC printed near 55.56%
- Translation starts with `Met Arg Thr`
- Huffman report shows code table + encoded sequence + savings

## 11. Notes and Extension Ideas

- Candidate filtering plus DP verification is intentionally hybrid for performance
- You can add traceback visualization for DP operations
- You can store multiple DNA samples and build larger biological comparisons
- You can export similarity matrix as CSV for plotting
