#ifndef CODON_H
#define CODON_H

#include <string>
#include <unordered_map>
#include <vector>

using namespace std;

using CodonTable = unordered_map<string, string>;

bool loadCodonTable(const string &filePath, CodonTable &table);
vector<string> translateDNAToProtein(const string &dna, const CodonTable &table);
string proteinToString(const vector<string> &proteinSequence);

#endif
