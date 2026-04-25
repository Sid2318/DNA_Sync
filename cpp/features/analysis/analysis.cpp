#include "analysis.h"

#include <cmath>
#include <cctype>
#include <iomanip>

using namespace std;

string normalizeDNA(const string &dna)
{
    string normalized;
    normalized.reserve(dna.size());

    for (unsigned char c : dna)
    {
        if (!isspace(c))
        {
            normalized.push_back(static_cast<char>(toupper(c)));
        }
    }

    return normalized;
}

bool validateDNA(const string &dna, string &errorMessage)
{
    if (dna.empty())
    {
        errorMessage = "DNA sequence is empty.";
        return false;
    }

    for (int i = 0; i < static_cast<int>(dna.size()); ++i)
    {
        const char c = dna[i];
        if (c != 'A' && c != 'C' && c != 'G' && c != 'T')
        {
            errorMessage = "Invalid DNA character found at index " + to_string(i) + ": " + c;
            return false;
        }
    }

    errorMessage.clear();
    return true;
}

double calculateGCContent(const string &dna)
{
    if (dna.empty())
    {
        return 0.0;
    }

    int gcCount = 0;
    for (char c : dna)
    {
        if (c == 'G' || c == 'C')
        {
            ++gcCount;
        }
    }

    return (static_cast<double>(gcCount) * 100.0) / static_cast<double>(dna.size());
}

int mismatchCount(const string &a, const string &b)
{
    const int common = static_cast<int>(min(a.size(), b.size()));
    int mismatches = 0;

    for (int i = 0; i < common; ++i)
    {
        if (a[i] != b[i])
        {
            ++mismatches;
        }
    }

    mismatches += abs(static_cast<int>(a.size()) - static_cast<int>(b.size()));
    return mismatches;
}

vector<vector<int>> buildSimilarityMatrix(const vector<string> &sequences)
{
    const int n = static_cast<int>(sequences.size());
    vector<vector<int>> matrix(n, vector<int>(n, 0));

    for (int i = 0; i < n; ++i)
    {
        for (int j = i; j < n; ++j)
        {
            const int d = mismatchCount(sequences[i], sequences[j]);
            matrix[i][j] = d;
            matrix[j][i] = d;
        }
    }

    return matrix;
}

void printSimilarityMatrix(const vector<vector<int>> &matrix, ostream &out)
{
    if (matrix.empty())
    {
        out << "Similarity matrix is empty.\n";
        return;
    }

    out << "Similarity Matrix (mismatch count):\n";
    out << setw(8) << " ";

    const int n = static_cast<int>(matrix.size());
    for (int i = 0; i < n; ++i)
    {
        out << setw(8) << ("S" + to_string(i));
    }
    out << "\n";

    for (int i = 0; i < n; ++i)
    {
        out << setw(8) << ("S" + to_string(i));
        for (int j = 0; j < n; ++j)
        {
            out << setw(8) << matrix[i][j];
        }
        out << "\n";
    }
}
