#ifndef ANALYSIS_H
#define ANALYSIS_H

#include <ostream>
#include <string>
#include <vector>

using namespace std;

string normalizeDNA(const string &dna);
bool validateDNA(const string &dna, string &errorMessage);
double calculateGCContent(const string &dna);
int mismatchCount(const string &a, const string &b);
vector<vector<int>> buildSimilarityMatrix(const vector<string> &sequences);
void printSimilarityMatrix(const vector<vector<int>> &matrix, ostream &out);

#endif
