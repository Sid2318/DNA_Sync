#include "analysis.h"
#include "codon.h"
#include "dp_module.h"
#include "huffman.h"
#include "z_module.h"

#include <fstream>
#include <iomanip>
#include <iostream>
#include <limits>
using namespace std;

#include <sstream>
#include <string>
#include <vector>

namespace
{

    const string kDNAFile = "dna.txt";
    const string kCodonFile = "codon.txt";
    const string kOutputFile = "output.txt";

    void initializeOutputFile()
    {
        ofstream out(kOutputFile);
        out << "DNA Analysis System Output\n";
        out << "==========================\n\n";
    }

    void appendToOutput(const string &section)
    {
        ofstream out(kOutputFile, ios::app);
        if (out.is_open())
        {
            out << section << "\n";
        }
    }

    string readDNAFromFile(const string &filePath)
    {
        ifstream in(filePath);
        if (!in.is_open())
        {
            return "";
        }
        // asa
        string content;
        string line;
        while (getline(in, line))
        {
            content += line;
        }

        return content;
    }

    int readInt(const string &prompt)
    {
        int value = 0;
        while (true)
        {
            cout << prompt;
            if (cin >> value)
            {
                cin.ignore(numeric_limits<streamsize>::max(), '\n');
                return value;
            }

            cout << "Invalid number. Try again.\n";
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
        }
    }

    string readLine(const string &prompt)
    {
        cout << prompt;
        string input;
        getline(cin, input);
        return input;
    }

    bool isYes(const string &text)
    {
        return !text.empty() && (text[0] == 'y' || text[0] == 'Y');
    }

    void printIndexList(const string &title, const vector<int> &indices)
    {
        cout << title << "\n";
        if (indices.empty())
        {
            cout << "None\n";
            return;
        }

        for (int idx : indices)
        {
            cout << "Index " << idx << "\n";
        }
    }

    void printMutationResults(const vector<MutationResult> &results)
    {
        cout << "Approx Matches (DP Verified):\n";

        if (results.empty())
        {
            cout << "None\n";
            return;
        }

        for (const MutationResult &r : results)
        {
            cout << "Index " << r.index << " (" << r.distance << " "
                 << (r.distance == 1 ? "mismatch" : "mismatches") << ")";

            if (!r.mismatchPositions.empty())
            {
                cout << " at positions: ";
                for (int i = 0; i < static_cast<int>(r.mismatchPositions.size()); ++i)
                {
                    if (i > 0)
                    {
                        cout << ", ";
                    }
                    cout << r.mismatchPositions[i];
                }
            }

            cout << "\n";
        }
    }

    void printMenu()
    {
        cout << "\n===== DNA Analysis System =====\n";
        cout << "1. Load DNA\n";
        cout << "2. Pattern Matching (Z-Algorithm)\n";
        cout << "3. Mutation Detection (DP Verification)\n";
        cout << "4. DNA -> Protein\n";
        cout << "5. Huffman Compression\n";
        cout << "6. GC Content + Similarity Matrix\n";
        cout << "7. Exit\n";
    }

} // namespace

int main()
{
    initializeOutputFile();

    string dna;
    string lastPattern;

    CodonTable codonTable;
    if (!loadCodonTable(kCodonFile, codonTable))
    {
        cout << "Warning: Could not load codon table from " << kCodonFile << ".\n";
    }

    while (true)
    {
        printMenu();
        const int choice = readInt("Choose an option: ");

        if (choice == 1)
        {
            cout << "\n1. Load from file (dna.txt)\n";
            cout << "2. Enter DNA manually\n";
            const int mode = readInt("Select input mode: ");

            string rawDNA;
            if (mode == 1)
            {
                rawDNA = readDNAFromFile(kDNAFile);
                if (rawDNA.empty())
                {
                    cout << "Failed to read DNA from file: " << kDNAFile << "\n";
                    continue;
                }
            }
            else if (mode == 2)
            {
                rawDNA = readLine("Enter DNA sequence: ");
            }
            else
            {
                cout << "Invalid input mode.\n";
                continue;
            }

            const string normalized = normalizeDNA(rawDNA);
            string error;
            if (!validateDNA(normalized, error))
            {
                cout << "Invalid DNA: " << error << "\n";
                continue;
            }

            dna = normalized;
            cout << "DNA loaded successfully (length = " << dna.size() << ").\n";

            ostringstream log;
            log << "[Load DNA]\n";
            log << "DNA: " << dna << "\n";
            appendToOutput(log.str());
        }
        else if (choice == 2)
        {
            if (dna.empty())
            {
                cout << "Load DNA first (option 1).\n";
                continue;
            }

            const string patternInput = readLine("Enter pattern: ");
            const string pattern = normalizeDNA(patternInput);

            string error;
            if (!validateDNA(pattern, error))
            {
                cout << "Invalid pattern: " << error << "\n";
                continue;
            }

            const int k = readInt("Allowed mismatches for modified Z candidate filtering: ");
            const vector<int> exactMatches = findExactMatchesZ(dna, pattern);
            const vector<int> candidateMatches = findApproxCandidateIndicesZ(dna, pattern, k);

            printIndexList("Exact Matches:", exactMatches);
            printIndexList("Approximate Candidate Matches (Modified Z):", candidateMatches);

            lastPattern = pattern;

            ostringstream log;
            log << "[Pattern Matching]\n";
            log << "Pattern: " << pattern << ", k=" << k << "\n";
            log << "Exact Matches: ";
            if (exactMatches.empty())
            {
                log << "None";
            }
            else
            {
                for (int idx : exactMatches)
                {
                    log << idx << " ";
                }
            }
            log << "\nApprox Candidate Matches: ";
            if (candidateMatches.empty())
            {
                log << "None";
            }
            else
            {
                for (int idx : candidateMatches)
                {
                    log << idx << " ";
                }
            }
            log << "\n";
            appendToOutput(log.str());
        }
        else if (choice == 3)
        {
            if (dna.empty())
            {
                cout << "Load DNA first (option 1).\n";
                continue;
            }

            string pattern;
            if (!lastPattern.empty())
            {
                const string reuse = readLine(
                    "Reuse last pattern (" + lastPattern + ")? (y/n): ");
                if (isYes(reuse))
                {
                    pattern = lastPattern;
                }
            }

            if (pattern.empty())
            {
                pattern = normalizeDNA(readLine("Enter pattern for mutation detection: "));
            }

            string error;
            if (!validateDNA(pattern, error))
            {
                cout << "Invalid pattern: " << error << "\n";
                continue;
            }

            const int k = readInt("Enter mismatch threshold k for DP verification: ");
            const vector<int> candidates = findApproxCandidateIndicesZ(dna, pattern, k);
            const vector<MutationResult> verified = verifyCandidatesWithDP(dna, pattern, candidates, k);

            printMutationResults(verified);

            ostringstream log;
            log << "[Mutation Detection]\n";
            log << "Pattern: " << pattern << ", k=" << k << "\n";
            if (verified.empty())
            {
                log << "No verified matches\n";
            }
            else
            {
                for (const MutationResult &m : verified)
                {
                    log << "Index " << m.index << " Distance " << m.distance << "\n";
                }
            }
            appendToOutput(log.str());
        }
        else if (choice == 4)
        {
            if (dna.empty())
            {
                cout << "Load DNA first (option 1).\n";
                continue;
            }

            if (codonTable.empty() && !loadCodonTable(kCodonFile, codonTable))
            {
                cout << "Failed to load codon table from " << kCodonFile << "\n";
                continue;
            }

            const vector<string> protein = translateDNAToProtein(dna, codonTable);
            const string proteinStr = proteinToString(protein);

            cout << "Protein:\n"
                 << proteinStr << "\n";

            ostringstream log;
            log << "[Translation]\n";
            log << "Protein: " << proteinStr << "\n";
            appendToOutput(log.str());
        }
        else if (choice == 5)
        {
            if (dna.empty())
            {
                cout << "Load DNA first (option 1).\n";
                continue;
            }

            const HuffmanResult compressed = compressDNAHuffman(dna);
            printHuffmanReport(compressed, cout);

            ostringstream log;
            log << "[Huffman Compression]\n";
            printHuffmanReport(compressed, log);
            appendToOutput(log.str());
        }
        else if (choice == 6)
        {
            if (dna.empty())
            {
                cout << "Load DNA first (option 1).\n";
                continue;
            }

            const double gc = calculateGCContent(dna);
            cout << fixed << setprecision(2);
            cout << "GC Content: " << gc << "%\n";

            int count = readInt("How many additional sequences for similarity matrix? ");
            if (count < 0)
            {
                count = 0;
            }

            vector<string> sequences;
            sequences.push_back(dna);

            for (int i = 0; i < count; ++i)
            {
                const string seqInput = readLine("Enter sequence " + to_string(i + 1) + ": ");
                const string normalized = normalizeDNA(seqInput);

                string error;
                if (!validateDNA(normalized, error))
                {
                    cout << "Skipped invalid sequence: " << error << "\n";
                    continue;
                }

                sequences.push_back(normalized);
            }

            const vector<vector<int>> matrix = buildSimilarityMatrix(sequences);
            printSimilarityMatrix(matrix, cout);

            ostringstream log;
            log << "[Analysis]\n";
            log << fixed << setprecision(2) << "GC Content: " << gc << "%\n";
            printSimilarityMatrix(matrix, log);
            appendToOutput(log.str());
        }
        else if (choice == 7)
        {
            cout << "Exiting. Output log saved to " << kOutputFile << "\n";
            break;
        }
        else
        {
            cout << "Invalid choice. Please select 1-7.\n";
        }
    }

    return 0;
}
