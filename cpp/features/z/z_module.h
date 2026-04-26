#ifndef Z_MODULE_H
#define Z_MODULE_H

#include <bits/stdc++.h>
using namespace std;

vector<int> computeZArray(const string &s);
vector<int> findExactMatchesZ(const string &text, const string &pattern);
vector<int> findApproxCandidateIndicesZ(
    const string &text,
    const string &pattern,
    int maxMismatches);

#endif
