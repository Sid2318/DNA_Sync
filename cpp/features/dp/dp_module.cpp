#include "dp_module.h"
#include <bits/stdc++.h>

using namespace std;

static vector<vector<int>> makeDP(const string &a, const string &b)
{
    int m = a.size(), n = b.size();
    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));

    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;

    for (int i = 1; i <= m; i++)
    {
        for (int j = 1; j <= n; j++)
        {
            int cost = (a[i - 1] == b[j - 1]) ? 0 : 1;
            dp[i][j] = min({
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            });
        }
    }

    return dp;
}

int editDistance(const string &a, const string &b)
{
    vector<vector<int>> dp = makeDP(a, b);
    return dp[a.size()][b.size()];
}

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
            if (i > 0) i--;
            else j--;
        }
    }

    sort(pos.begin(), pos.end());
    pos.erase(unique(pos.begin(), pos.end()), pos.end());
    return pos;
}

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

    int m = pattern.size();
    maxMismatches = max(0, maxMismatches);
    set<int> used;

    for (int idx : candidateIndices)
    {
        if (used.count(idx) || idx < 0 || idx + m > (int)text.size())
        {
            continue;
        }
        used.insert(idx);

        string window = text.substr(idx, m);
        int dist = editDistance(pattern, window);

        if (dist <= maxMismatches)
        {
            MutationResult cur;
            cur.index = idx;
            cur.distance = dist;
            cur.mismatchPositions = getMismatchPositions(pattern, window);
            ans.push_back(cur);
        }
    }

    sort(ans.begin(), ans.end(), [](const MutationResult &a, const MutationResult &b) {
        if (a.distance != b.distance) return a.distance < b.distance;
        return a.index < b.index;
    });

    return ans;
}
