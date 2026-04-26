#include <bits/stdc++.h>
#include <filesystem>

#include "../features/analysis/analysis.h"
#include "../features/codon/codon.h"
#include "../features/dp/dp_module.h"
#include "../features/huffman/huffman.h"
#include "../features/z/z_module.h"

using namespace std;
namespace fs = std::filesystem;

string pickReadable(vector<string> paths)
{
    for (string path : paths)
    {
        ifstream fin(path);
        if (fin.good()) return path;
    }
    return paths.empty() ? "" : paths[0];
}

string pickWritable(vector<string> paths)
{
    for (string path : paths)
    {
        fs::path p(path);
        if (p.has_parent_path())
        {
            error_code ec;
            fs::create_directories(p.parent_path(), ec);
        }

        ofstream fout(path, ios::app);
        if (fout.good()) return path;
    }
    return "output.txt";
}

const string DNA_FILE = pickReadable({
    "cpp/data/dna.txt", "../cpp/data/dna.txt", "../../cpp/data/dna.txt",
    "../data/dna.txt", "data/dna.txt", "dna.txt"
});

const string CODON_FILE = pickReadable({
    "cpp/data/codon.txt", "../cpp/data/codon.txt", "../../cpp/data/codon.txt",
    "../data/codon.txt", "data/codon.txt", "codon.txt"
});

const string OUTPUT_FILE = pickWritable({
    "cpp/logs/output.txt", "../cpp/logs/output.txt", "../../cpp/logs/output.txt",
    "../logs/output.txt", "logs/output.txt", "output.txt"
});

void resetOutputFile()
{
    ofstream fout(OUTPUT_FILE);
    fout << "DNA Analysis System Output\n";
    fout << "==========================\n\n";
}

void saveLog(const string &text)
{
    ofstream fout(OUTPUT_FILE, ios::app);
    if (fout) fout << text << "\n";
}

string readFileDNA(const string &path)
{
    ifstream fin(path);
    string dna, line;
    while (getline(fin, line)) dna += line;
    return dna;
}

int readInt(const string &prompt)
{
    int x;
    while (true)
    {
        cout << prompt;
        if (cin >> x)
        {
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            return x;
        }

        if (cin.eof()) throw runtime_error("eof");

        cout << "Invalid number. Try again.\n";
        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
    }
}

string readLine(const string &prompt)
{
    cout << prompt;
    string s;
    if (!getline(cin, s)) throw runtime_error("eof");
    return s;
}

bool yes(const string &s)
{
    return !s.empty() && (s[0] == 'y' || s[0] == 'Y');
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

void printIndexList(const string &title, const vector<int> &indices)
{
    cout << title << "\n";
    if (indices.empty())
    {
        cout << "None\n";
        return;
    }

    for (int idx : indices) cout << "Index " << idx << "\n";
}

void printMutationResults(const vector<MutationResult> &results)
{
    cout << "Approx Matches (DP Verified):\n";
    if (results.empty())
    {
        cout << "None\n";
        return;
    }

    for (auto r : results)
    {
        cout << "Index " << r.index << " (" << r.distance << " "
             << (r.distance == 1 ? "mismatch" : "mismatches") << ")";

        if (!r.mismatchPositions.empty())
        {
            cout << " at positions: ";
            for (int i = 0; i < (int)r.mismatchPositions.size(); i++)
            {
                if (i) cout << ", ";
                cout << r.mismatchPositions[i];
            }
        }
        cout << "\n";
    }
}

bool needDNA(const string &dna)
{
    if (!dna.empty()) return false;
    cout << "Load DNA first (option 1).\n";
    return true;
}

void loadDNAMenu(string &dna)
{
    cout << "\n1. Load from file (" << DNA_FILE << ")\n";
    cout << "2. Enter DNA manually\n";
    int mode = readInt("Select input mode: ");

    string raw;
    if (mode == 1)
    {
        raw = readFileDNA(DNA_FILE);
        if (raw.empty())
        {
            cout << "Failed to read DNA from file: " << DNA_FILE << "\n";
            return;
        }
    }
    else if (mode == 2)
    {
        raw = readLine("Enter DNA sequence: ");
    }
    else
    {
        cout << "Invalid input mode.\n";
        return;
    }

    string cleaned = normalizeDNA(raw);
    string error;
    if (!validateDNA(cleaned, error))
    {
        cout << "Invalid DNA: " << error << "\n";
        return;
    }

    dna = cleaned;
    cout << "DNA loaded successfully (length = " << dna.size() << ").\n";

    stringstream log;
    log << "[Load DNA]\n";
    log << "DNA: " << dna << "\n";
    saveLog(log.str());
}

void zMenu(const string &dna, string &lastPattern)
{
    string pattern = normalizeDNA(readLine("Enter pattern: "));
    string error;
    if (!validateDNA(pattern, error))
    {
        cout << "Invalid pattern: " << error << "\n";
        return;
    }

    int k = readInt("Allowed mismatches for modified Z candidate filtering: ");
    vector<int> exact = findExactMatchesZ(dna, pattern);
    vector<int> candidates = findApproxCandidateIndicesZ(dna, pattern, k);

    printIndexList("Exact Matches:", exact);
    printIndexList("Approximate Candidate Matches (Modified Z):", candidates);

    lastPattern = pattern;

    stringstream log;
    log << "[Pattern Matching]\n";
    log << "Pattern: " << pattern << ", k=" << k << "\n";
    log << "Exact Matches: ";
    if (exact.empty()) log << "None";
    else for (int idx : exact) log << idx << " ";
    log << "\nApprox Candidate Matches: ";
    if (candidates.empty()) log << "None";
    else for (int idx : candidates) log << idx << " ";
    log << "\n";
    saveLog(log.str());
}

void dpMenu(const string &dna, string &lastPattern)
{
    string pattern;
    if (!lastPattern.empty())
    {
        string reuse = readLine("Reuse last pattern (" + lastPattern + ")? (y/n): ");
        if (yes(reuse)) pattern = lastPattern;
    }

    if (pattern.empty())
    {
        pattern = normalizeDNA(readLine("Enter pattern for mutation detection: "));
    }

    string error;
    if (!validateDNA(pattern, error))
    {
        cout << "Invalid pattern: " << error << "\n";
        return;
    }

    int k = readInt("Enter mismatch threshold k for DP verification: ");
    vector<int> candidates = findApproxCandidateIndicesZ(dna, pattern, k);
    vector<MutationResult> verified = verifyCandidatesWithDP(dna, pattern, candidates, k);

    printMutationResults(verified);

    stringstream log;
    log << "[Mutation Detection]\n";
    log << "Pattern: " << pattern << ", k=" << k << "\n";
    if (verified.empty()) log << "No verified matches\n";
    else for (auto m : verified) log << "Index " << m.index << " Distance " << m.distance << "\n";
    saveLog(log.str());
}

void codonMenu(const string &dna, CodonTable &codonTable)
{
    if (codonTable.empty() && !loadCodonTable(CODON_FILE, codonTable))
    {
        cout << "Failed to load codon table from " << CODON_FILE << "\n";
        return;
    }

    vector<string> protein = translateDNAToProtein(dna, codonTable);
    string proteinText = proteinToString(protein);

    cout << "Protein:\n" << proteinText << "\n";

    stringstream log;
    log << "[Translation]\n";
    log << "Protein: " << proteinText << "\n";
    saveLog(log.str());
}

void huffmanMenu(const string &dna)
{
    HuffmanResult compressed = compressDNAHuffman(dna);
    printHuffmanReport(compressed, cout);

    stringstream log;
    log << "[Huffman Compression]\n";
    printHuffmanReport(compressed, log);
    saveLog(log.str());
}

void analysisMenu(const string &dna)
{
    double gc = calculateGCContent(dna);
    cout << fixed << setprecision(2);
    cout << "GC Content: " << gc << "%\n";

    int cnt = readInt("How many additional sequences for similarity matrix? ");
    cnt = max(0, cnt);

    vector<string> sequences;
    sequences.push_back(dna);

    for (int i = 0; i < cnt; i++)
    {
        string seq = normalizeDNA(readLine("Enter sequence " + to_string(i + 1) + ": "));
        string error;
        if (!validateDNA(seq, error))
        {
            cout << "Skipped invalid sequence: " << error << "\n";
            continue;
        }
        sequences.push_back(seq);
    }

    vector<vector<int>> matrix = buildSimilarityMatrix(sequences);
    printSimilarityMatrix(matrix, cout);

    stringstream log;
    log << "[Analysis]\n";
    log << fixed << setprecision(2) << "GC Content: " << gc << "%\n";
    printSimilarityMatrix(matrix, log);
    saveLog(log.str());
}

int main()
{
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    resetOutputFile();

    string dna, lastPattern;
    CodonTable codonTable;

    if (!loadCodonTable(CODON_FILE, codonTable))
    {
        cout << "Warning: Could not load codon table from " << CODON_FILE << ".\n";
    }

    try
    {
        while (true)
        {
            printMenu();
            int choice = readInt("Choose an option: ");

            switch (choice)
            {
            case 1:
                loadDNAMenu(dna);
                break;
            case 2:
                if (!needDNA(dna)) zMenu(dna, lastPattern);
                break;
            case 3:
                if (!needDNA(dna)) dpMenu(dna, lastPattern);
                break;
            case 4:
                if (!needDNA(dna)) codonMenu(dna, codonTable);
                break;
            case 5:
                if (!needDNA(dna)) huffmanMenu(dna);
                break;
            case 6:
                if (!needDNA(dna)) analysisMenu(dna);
                break;
            case 7:
                cout << "Exiting. Output log saved to " << OUTPUT_FILE << "\n";
                return 0;
            default:
                cout << "Invalid choice. Please select 1-7.\n";
            }
        }
    }
    catch (...)
    {
        cout << "Input stream closed. Exiting. Output log saved to " << OUTPUT_FILE << "\n";
    }

    return 0;
}
