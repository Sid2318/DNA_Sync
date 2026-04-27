#include "dp_module.h"
#include <bits/stdc++.h>

using namespace std;

// Time: O(m*n), Space: O(m*n)
static vector<vector<int>> makeDP(const string &a, const string &b)
{
    int m = a.size(), n = b.size();
    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));

    for (int i = 0; i <= m; i++)
        dp[i][0] = i;
    for (int j = 0; j <= n; j++)
        dp[0][j] = j;

    for (int i = 1; i <= m; i++)
    {
        for (int j = 1; j <= n; j++)
        {
            int cost = (a[i - 1] == b[j - 1]) ? 0 : 1;
            dp[i][j] = min({dp[i - 1][j] + 1,
                            dp[i][j - 1] + 1,
                            dp[i - 1][j - 1] + cost});
        }
    }

    return dp;
}

// Time: O(m*n), Space: O(min(m, n))
static int editDistanceLinearSpace(const string &a, const string &b)
{
    const string *s1 = &a;
    const string *s2 = &b;
    if (s1->size() < s2->size())
    {
        swap(s1, s2);
    }

    const int m = static_cast<int>(s1->size());
    const int n = static_cast<int>(s2->size());
    vector<int> prev(n + 1), cur(n + 1);

    for (int j = 0; j <= n; ++j)
    {
        prev[j] = j;
    }

    for (int i = 1; i <= m; ++i)
    {
        cur[0] = i;
        for (int j = 1; j <= n; ++j)
        {
            const int cost = ((*s1)[i - 1] == (*s2)[j - 1]) ? 0 : 1;
            cur[j] = min({
                prev[j] + 1,
                cur[j - 1] + 1,
                prev[j - 1] + cost,
            });
        }
        prev.swap(cur);
    }

    return prev[n];
}

// Time: O(m), Space: O(1)
static int hammingDistanceWithCutoff(
    const string &pattern,
    const string &text,
    int start,
    int cutoff,
    vector<int> *mismatchPositions = nullptr)
{
    int mismatches = 0;
    const int m = static_cast<int>(pattern.size());

    if (mismatchPositions != nullptr)
    {
        mismatchPositions->clear();
        mismatchPositions->reserve(m);
    }

    for (int i = 0; i < m; ++i)
    {
        if (pattern[i] != text[start + i])
        {
            ++mismatches;
            if (mismatchPositions != nullptr)
            {
                mismatchPositions->push_back(i);
            }

            if (cutoff >= 0 && mismatches > cutoff)
            {
                return mismatches;
            }
        }
    }

    return mismatches;
}

// Time: O(m*n) general case, O(min(m, n)) space
int editDistance(const string &a, const string &b)
{
    if (a.size() == b.size())
    {
        return hammingDistanceWithCutoff(a, b, 0, -1);
    }

    return editDistanceLinearSpace(a, b);
}

// Time: O(m*n) worst-case, O(m*n) space for unequal-length alignment tracing
vector<int> getMismatchPositions(const string &a, const string &b)
{
    vector<int> pos;

    if (a.size() == b.size())
    {
        for (int i = 0; i < (int)a.size(); i++)
        {
            if (a[i] != b[i])
            {
                pos.push_back(i);
            }
        }
        return pos;
    }

    vector<vector<int>> dp = makeDP(a, b);
    int i = a.size();
    int j = b.size();

    while (i > 0 || j > 0)
    {
        if (i > 0 && j > 0 && a[i - 1] == b[j - 1])
        {
            i--;
            j--;
        }
        else if (i > 0 && j > 0 && dp[i][j] == dp[i - 1][j - 1] + 1)
        {
            pos.push_back(i - 1);
            i--;
            j--;
        }
        else if (i > 0 && dp[i][j] == dp[i - 1][j] + 1)
        {
            pos.push_back(i - 1);
            i--;
        }
        else if (j > 0 && dp[i][j] == dp[i][j - 1] + 1)
        {
            pos.push_back(i);
            j--;
        }
        else
        {
            if (i > 0)
                i--;
            else
                j--;
        }
    }

    sort(pos.begin(), pos.end());
    pos.erase(unique(pos.begin(), pos.end()), pos.end());
    return pos;
}

// Time: O(c*m + r*log r), Space: O(r + n)
// c = candidate count, m = pattern length, r = verified matches, n = text length
vector<MutationResult> verifyCandidatesWithDP(
    const string &text,
    const string &pattern,
    const vector<int> &candidateIndices,
    int maxMismatches)
{
    vector<MutationResult> ans;
    if (pattern.empty() || text.empty() || pattern.size() > text.size())
    {
        return ans;
    }

    const int n = static_cast<int>(text.size());
    const int m = static_cast<int>(pattern.size());
    maxMismatches = max(0, maxMismatches);

    vector<unsigned char> seen(n + 1, 0);
    vector<int> mismatchPositions;

    for (int idx : candidateIndices)
    {
        if (idx < 0 || idx + m > n || seen[idx])
        {
            continue;
        }
        seen[idx] = 1;

        const int dist = hammingDistanceWithCutoff(pattern, text, idx, maxMismatches, &mismatchPositions);

        if (dist <= maxMismatches)
        {
            MutationResult cur;
            cur.index = idx;
            cur.distance = dist;
            cur.mismatchPositions = mismatchPositions;
            ans.push_back(cur);
        }
    }

    sort(ans.begin(), ans.end(), [](const MutationResult &a, const MutationResult &b)
         {
        if (a.distance != b.distance) return a.distance < b.distance;
        return a.index < b.index; });

    return ans;
}
