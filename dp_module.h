#ifndef DP_MODULE_H
#define DP_MODULE_H

#include <string>
#include <vector>

using namespace std;

struct MutationResult
{
    int index;
    int distance;
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
