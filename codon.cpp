#include "codon.h"

#include <algorithm>
#include <cctype>
#include <fstream>
#include <sstream>

using namespace std;

namespace
{

    string toUpperAndTrimDNA(const string &s)
    {
        string out;
        out.reserve(s.size());

        for (unsigned char c : s)
        {
            if (!isspace(c))
            {
                out.push_back(static_cast<char>(toupper(c)));
            }
        }

        return out;
    }

    string toUpperWord(const string &s)
    {
        string out = s;
        for (char &ch : out)
        {
            ch = static_cast<char>(toupper(static_cast<unsigned char>(ch)));
        }
        return out;
    }

} // namespace

bool loadCodonTable(const string &filePath, CodonTable &table)
{
    ifstream in(filePath);
    if (!in.is_open())
    {
        return false;
    }

    table.clear();
    string line;

    while (getline(in, line))
    {
        if (line.empty() || line[0] == '#')
        {
            continue;
        }

        istringstream iss(line);
        string codon;
        string amino;
        if (!(iss >> codon >> amino))
        {
            continue;
        }

        codon = toUpperWord(codon);
        if (codon.size() != 3)
        {
            continue;
        }

        table[codon] = amino;
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

    const string cleanDNA = toUpperAndTrimDNA(dna);

    // Translation proceeds codon-by-codon and stops when a STOP codon is seen.
    for (int i = 0; i + 2 < static_cast<int>(cleanDNA.size()); i += 3)
    {
        const string codon = cleanDNA.substr(i, 3);
        auto it = table.find(codon);

        if (it == table.end())
        {
            protein.push_back("Unknown");
            continue;
        }

        const string amino = it->second;
        const string upperAmino = toUpperWord(amino);

        if (upperAmino == "STOP" || upperAmino == "*")
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

    string result;
    for (int i = 0; i < static_cast<int>(proteinSequence.size()); ++i)
    {
        if (i > 0)
        {
            result += " ";
        }
        result += proteinSequence[i];
    }

    return result;
}
