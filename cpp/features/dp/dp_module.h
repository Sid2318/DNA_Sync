#ifndef DP_MODULE_H
#define DP_MODULE_H

#include <bits/stdc++.h>
using namespace std;

struct MutationResult
{
    int index = 0;
    int distance = 0;
    vector<int> mismatchPositions;
};

int editDistance(const string &a, const string &b);
vector<int> getMismatchPositions(const string &a, const string &b);
vector<MutationResult> verifyCandidatesWithDP(
    const string &text,
    const string &pattern,
    const vector<int> &candidateIndices,
    int maxMismatches);

#endif
