#include "z_module.h"

#include <algorithm>

using namespace std;

vector<int> computeZArray(const string &s)
{
    const int n = static_cast<int>(s.size());
    vector<int> z(n, 0);

    int l = 0;
    int r = 0;

    // Standard linear Z-algorithm window maintenance.
    for (int i = 1; i < n; ++i)
    {
        if (i <= r)
        {
            z[i] = min(r - i + 1, z[i - l]);
        }
        while (i + z[i] < n && s[z[i]] == s[i + z[i]])
        {
            ++z[i];
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
    vector<int> matches;
    if (pattern.empty() || text.empty() || pattern.size() > text.size())
    {
        return matches;
    }

    const int m = static_cast<int>(pattern.size());
    const string combined = pattern + "$" + text;
    const vector<int> z = computeZArray(combined);

    for (int i = m + 1; i < static_cast<int>(combined.size()); ++i)
    {
        if (z[i] >= m)
        {
            matches.push_back(i - m - 1);
        }
    }

    return matches;
}

namespace
{

    vector<int> computePrefixMatches(const string &text, const string &pattern)
    {
        vector<int> prefix;
        if (pattern.empty() || text.empty() || pattern.size() > text.size())
        {
            return prefix;
        }

        const int m = static_cast<int>(pattern.size());
        const string combined = pattern + "$" + text;
        const vector<int> z = computeZArray(combined);

        prefix.assign(text.size(), 0);
        for (int i = 0; i < static_cast<int>(text.size()); ++i)
        {
            prefix[i] = min(z[m + 1 + i], m);
        }

        return prefix;
    }

    vector<int> computeSuffixMatches(const string &text, const string &pattern)
    {
        vector<int> suffix;
        if (pattern.empty() || text.empty() || pattern.size() > text.size())
        {
            return suffix;
        }

        const int m = static_cast<int>(pattern.size());
        const int n = static_cast<int>(text.size());
        const string revPattern(pattern.rbegin(), pattern.rend());
        const string revText(text.rbegin(), text.rend());
        const string combined = revPattern + "$" + revText;
        const vector<int> z = computeZArray(combined);

        suffix.assign(text.size(), 0);

        // For alignment i in original text, map to mirrored index in reversed text.
        for (int i = 0; i + m <= n; ++i)
        {
            const int reverseIndex = n - (i + m);
            suffix[i] = min(z[m + 1 + reverseIndex], m);
        }

        return suffix;
    }

} // namespace

vector<int> findApproxCandidateIndicesZ(
    const string &text,
    const string &pattern,
    int maxMismatches)
{
    vector<int> candidates;
    if (pattern.empty() || text.empty() || pattern.size() > text.size())
    {
        return candidates;
    }

    maxMismatches = max(0, maxMismatches);

    const int m = static_cast<int>(pattern.size());
    const int n = static_cast<int>(text.size());

    // Modified Z idea: combine longest matching prefix and suffix per alignment.
    const vector<int> prefix = computePrefixMatches(text, pattern);
    const vector<int> suffix = computeSuffixMatches(text, pattern);

    for (int i = 0; i + m <= n; ++i)
    {
        int combinedMatch = prefix[i] + suffix[i];
        if (combinedMatch > m)
        {
            combinedMatch = m;
        }

        if (combinedMatch >= m - maxMismatches)
        {
            candidates.push_back(i);
        }
    }

    return candidates;
}
