#include "codon.h"
#include <bits/stdc++.h>

using namespace std;

static string upperNoSpaces(const string &s)
{
    string res;
    for (char ch : s)
    {
        if (!isspace((unsigned char)ch))
        {
            res.push_back((char)toupper((unsigned char)ch));
        }
    }
    return res;
}

static string upperWord(string s)
{
    for (char &ch : s)
    {
        ch = (char)toupper((unsigned char)ch);
    }
    return s;
}

bool loadCodonTable(const string &filePath, CodonTable &table)
{
    ifstream fin(filePath);
    if (!fin)
    {
        return false;
    }

    table.clear();
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

vector<string> translateDNAToProtein(const string &dna, const CodonTable &table)
{
    vector<string> protein;
    if (dna.empty() || table.empty())
    {
        return protein;
    }

    string cleanDNA = upperNoSpaces(dna);

    for (int i = 0; i + 2 < (int)cleanDNA.size(); i += 3)
    {
        string codon = cleanDNA.substr(i, 3);

        if (!table.count(codon))
        {
            protein.push_back("Unknown");
            continue;
        }

        string amino = table.at(codon);
        string check = upperWord(amino);

        if (check == "STOP" || check == "*")
        {
            break;
        }

        protein.push_back(amino);
    }

    return protein;
}

string proteinToString(const vector<string> &proteinSequence)
{
    if (proteinSequence.empty())
    {
        return "(empty)";
    }

    string ans = proteinSequence[0];
    for (int i = 1; i < (int)proteinSequence.size(); i++)
    {
        ans += " " + proteinSequence[i];
    }
    return ans;
}
