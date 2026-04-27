#include "codon.h"
#include <bits/stdc++.h>

using namespace std;

// Time: O(n), Space: O(n)
static string upperNoSpaces(const string &s)
{
    string res;
    res.reserve(s.size());
    for (char ch : s)
    {
        if (!isspace((unsigned char)ch))
        {
            res.push_back((char)toupper((unsigned char)ch));
        }
    }
    return res;
}

// Time: O(n), Space: O(1) extra
static string upperWord(string s)
{
    for (char &ch : s)
    {
        ch = (char)toupper((unsigned char)ch);
    }
    return s;
}

// Time: O(lines in codon file), Space: O(unique codons)
bool loadCodonTable(const string &filePath, CodonTable &table)
{
    ifstream fin(filePath);
    if (!fin)
    {
        return false;
    }

    table.clear();
    table.reserve(64);
    string codon, amino;
    string line;

    while (getline(fin, line))
    {
        if (line.empty() || line[0] == '#')
        {
            continue;
        }

        stringstream ss(line);
        if (!(ss >> codon >> amino))
        {
            continue;
        }

        codon = upperWord(codon);
        if ((int)codon.size() == 3)
        {
            table[codon] = amino;
        }
    }

    return !table.empty();
}

// Time: O(n), Space: O(n/3) for output protein sequence
vector<string> translateDNAToProtein(const string &dna, const CodonTable &table)
{
    vector<string> protein;
    if (dna.empty() || table.empty())
    {
        return protein;
    }

    string cleanDNA = upperNoSpaces(dna);
    protein.reserve(cleanDNA.size() / 3);

    for (int i = 0; i + 2 < (int)cleanDNA.size(); i += 3)
    {
        string codon = cleanDNA.substr(i, 3);

        auto it = table.find(codon);
        if (it == table.end())
        {
            protein.push_back("Unknown");
            continue;
        }

        const string &amino = it->second;
        string check = upperWord(amino);

        if (check == "STOP" || check == "*")
        {
            break;
        }

        protein.push_back(amino);
    }

    return protein;
}

// Time: O(k), Space: O(total output characters)
string proteinToString(const vector<string> &proteinSequence)
{
    if (proteinSequence.empty())
    {
        return "(empty)";
    }

    size_t totalLen = 0;
    for (const string &amino : proteinSequence)
    {
        totalLen += amino.size() + 1;
    }

    string ans;
    ans.reserve(totalLen);
    ans += proteinSequence[0];
    for (int i = 1; i < (int)proteinSequence.size(); i++)
    {
        ans += ' ';
        ans += proteinSequence[i];
    }
    return ans;
}
