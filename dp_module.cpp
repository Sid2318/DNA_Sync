#include "dp_module.h"

#include <algorithm>
#include <cstdlib>
#include <unordered_set>

using namespace std;

int editDistance(const string &a, const string &b)
{
    const int m = static_cast<int>(a.size());
    const int n = static_cast<int>(b.size());

    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));

    for (int i = 0; i <= m; ++i)
    {
        dp[i][0] = i;
    }
    for (int j = 0; j <= n; ++j)
    {
        dp[0][j] = j;
    }

    // Levenshtein DP transition: min(insert, delete, replace/match).
    for (int i = 1; i <= m; ++i)
    {
        for (int j = 1; j <= n; ++j)
        {
            const int cost = (a[i - 1] == b[j - 1]) ? 0 : 1;
            dp[i][j] = min({dp[i - 1][j] + 1,
                            dp[i][j - 1] + 1,
                            dp[i - 1][j - 1] + cost});
        }
    }

    return dp[m][n];
}

vector<int> getMismatchPositions(const string &a, const string &b)
{
    vector<int> positions;

    if (a.size() == b.size())
    {
        for (int i = 0; i < static_cast<int>(a.size()); ++i)
        {
            if (a[i] != b[i])
            {
                positions.push_back(i);
            }
        }
        return positions;
    }

    const int m = static_cast<int>(a.size());
    const int n = static_cast<int>(b.size());
    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));

    for (int i = 0; i <= m; ++i)
    {
        dp[i][0] = i;
    }
    for (int j = 0; j <= n; ++j)
    {
        dp[0][j] = j;
    }

    for (int i = 1; i <= m; ++i)
    {
        for (int j = 1; j <= n; ++j)
        {
            const int cost = (a[i - 1] == b[j - 1]) ? 0 : 1;
            dp[i][j] = min({dp[i - 1][j] + 1,
                            dp[i][j - 1] + 1,
                            dp[i - 1][j - 1] + cost});
        }
    }

    int i = m;
    int j = n;

    while (i > 0 || j > 0)
    {
        if (i > 0 && j > 0 && a[i - 1] == b[j - 1])
        {
            --i;
            --j;
            continue;
        }

        if (i > 0 && j > 0 && dp[i][j] == dp[i - 1][j - 1] + 1)
        {
            positions.push_back(i - 1);
            --i;
            --j;
            continue;
        }

        if (i > 0 && dp[i][j] == dp[i - 1][j] + 1)
        {
            positions.push_back(i - 1);
            --i;
            continue;
        }

        if (j > 0 && dp[i][j] == dp[i][j - 1] + 1)
        {
            positions.push_back(i);
            --j;
            continue;
        }

        if (i > 0)
        {
            --i;
        }
        else
        {
            --j;
        }
    }

    sort(positions.begin(), positions.end());
    positions.erase(unique(positions.begin(), positions.end()), positions.end());
    return positions;
}

vector<MutationResult> verifyCandidatesWithDP(
    const string &text,
    const string &pattern,
    const vector<int> &candidateIndices,
    int maxMismatches)
{
    vector<MutationResult> verified;
    if (pattern.empty() || text.empty() || pattern.size() > text.size())
    {
        return verified;
    }

    maxMismatches = max(0, maxMismatches);
    const int m = static_cast<int>(pattern.size());

    unordered_set<int> seen;

    for (int idx : candidateIndices)
    {
        if (idx < 0 || idx + m > static_cast<int>(text.size()))
        {
            continue;
        }
        if (seen.find(idx) != seen.end())
        {
            continue;
        }
        seen.insert(idx);

        const string window = text.substr(idx, m);
        const int dist = editDistance(pattern, window);
        if (dist <= maxMismatches)
        {
            MutationResult result;
            result.index = idx;
            result.distance = dist;
            result.mismatchPositions = getMismatchPositions(pattern, window);
            verified.push_back(result);
        }
    }

    sort(verified.begin(), verified.end(), [](const MutationResult &a, const MutationResult &b)
         {
        if (a.distance != b.distance) {
            return a.distance < b.distance;
        }
        return a.index < b.index; });

    return verified;
}
