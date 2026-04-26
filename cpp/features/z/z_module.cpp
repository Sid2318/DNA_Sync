#include "z_module.h"
#include <bits/stdc++.h>

using namespace std;

vector<int> computeZArray(const string &s)
{
    int n = s.size();
    vector<int> z(n, 0);
    int l = 0, r = 0;

    for (int i = 1; i < n; i++)
    {
        if (i <= r)
        {
            z[i] = min(r - i + 1, z[i - l]);
        }

        while (i + z[i] < n && s[z[i]] == s[i + z[i]])
        {
            z[i]++;
        }

        if (i + z[i] - 1 > r)
        {
            l = i;
            r = i + z[i] - 1;
        }
    }

    return z;
}

vector<int> findExactMatchesZ(const string &text, const string &pattern)
{
    vector<int> ans;
    if (pattern.empty() || text.empty() || pattern.size() > text.size())
    {
        return ans;
    }

    int m = pattern.size();
    string joined = pattern + "$" + text;
    vector<int> z = computeZArray(joined);

    for (int i = m + 1; i < (int)joined.size(); i++)
    {
        if (z[i] >= m)
        {
            ans.push_back(i - m - 1);
        }
    }

    return ans;
}

static vector<int> prefixMatches(const string &text, const string &pattern)
{
    vector<int> pref(text.size(), 0);
    if (pattern.empty() || text.empty() || pattern.size() > text.size())
    {
        return {};
    }

    int m = pattern.size();
    string joined = pattern + "$" + text;
    vector<int> z = computeZArray(joined);

    for (int i = 0; i < (int)text.size(); i++)
    {
        pref[i] = min(z[m + 1 + i], m);
    }
    return pref;
}

static vector<int> suffixMatches(const string &text, const string &pattern)
{
    vector<int> suff(text.size(), 0);
    if (pattern.empty() || text.empty() || pattern.size() > text.size())
    {
        return {};
    }

    int n = text.size();
    int m = pattern.size();
    string revPattern(pattern.rbegin(), pattern.rend());
    string revText(text.rbegin(), text.rend());
    string joined = revPattern + "$" + revText;
    vector<int> z = computeZArray(joined);

    for (int i = 0; i + m <= n; i++)
    {
        int revIndex = n - (i + m);
        suff[i] = min(z[m + 1 + revIndex], m);
    }
    return suff;
}

vector<int> findApproxCandidateIndicesZ(
    const string &text,
    const string &pattern,
    int maxMismatches)
{
    vector<int> ans;
    if (pattern.empty() || text.empty() || pattern.size() > text.size())
    {
        return ans;
    }

    int n = text.size();
    int m = pattern.size();
    maxMismatches = max(0, maxMismatches);

    vector<int> pref = prefixMatches(text, pattern);
    vector<int> suff = suffixMatches(text, pattern);

    for (int i = 0; i + m <= n; i++)
    {
        int matched = min(m, pref[i] + suff[i]);
        if (matched >= m - maxMismatches)
        {
            ans.push_back(i);
        }
    }

    return ans;
}
