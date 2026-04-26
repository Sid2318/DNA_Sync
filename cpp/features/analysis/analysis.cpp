#include "analysis.h"
#include <bits/stdc++.h>

using namespace std;

string normalizeDNA(const string &dna)
{
    string res;
    for (char ch : dna)
    {
        if (!isspace((unsigned char)ch))
        {
            res.push_back((char)toupper((unsigned char)ch));
        }
    }
    return res;
}

bool validateDNA(const string &dna, string &errorMessage)
{
    if (dna.empty())
    {
        errorMessage = "DNA sequence is empty.";
        return false;
    }

    for (int i = 0; i < (int)dna.size(); i++)
    {
        char ch = dna[i];
        if (ch != 'A' && ch != 'C' && ch != 'G' && ch != 'T')
        {
            errorMessage = "Invalid DNA character found at index " + to_string(i) + ": " + ch;
            return false;
        }
    }

    errorMessage = "";
    return true;
}

double calculateGCContent(const string &dna)
{
    if (dna.empty())
    {
        return 0.0;
    }

    int gc = 0;
    for (char ch : dna)
    {
        if (ch == 'G' || ch == 'C')
        {
            gc++;
        }
    }

    return (gc * 100.0) / dna.size();
}

int mismatchCount(const string &a, const string &b)
{
    int common = min(a.size(), b.size());
    int ans = 0;

    for (int i = 0; i < common; i++)
    {
        if (a[i] != b[i])
        {
            ans++;
        }
    }

    ans += abs((int)a.size() - (int)b.size());
    return ans;
}

vector<vector<int>> buildSimilarityMatrix(const vector<string> &sequences)
{
    int n = sequences.size();
    vector<vector<int>> matrix(n, vector<int>(n, 0));

    for (int i = 0; i < n; i++)
    {
        for (int j = i; j < n; j++)
        {
            int d = mismatchCount(sequences[i], sequences[j]);
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

    int n = matrix.size();
    out << "Similarity Matrix (mismatch count):\n";
    out << setw(8) << " ";

    for (int i = 0; i < n; i++)
    {
        out << setw(8) << ("S" + to_string(i));
    }
    out << "\n";

    for (int i = 0; i < n; i++)
    {
        out << setw(8) << ("S" + to_string(i));
        for (int j = 0; j < n; j++)
        {
            out << setw(8) << matrix[i][j];
        }
        out << "\n";
    }
}
