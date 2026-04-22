#include "huffman.h"

#include <algorithm>
#include <iomanip>
#include <queue>
#include <vector>

using namespace std;

namespace
{

    struct HuffmanNode
    {
        char ch;
        int freq;
        HuffmanNode *left;
        HuffmanNode *right;

        HuffmanNode(char c, int f) : ch(c), freq(f), left(nullptr), right(nullptr) {}
        HuffmanNode(HuffmanNode *l, HuffmanNode *r)
            : ch('\0'), freq((l ? l->freq : 0) + (r ? r->freq : 0)), left(l), right(r) {}

        bool isLeaf() const
        {
            return left == nullptr && right == nullptr;
        }
    };

    struct CompareNode
    {
        bool operator()(const HuffmanNode *a, const HuffmanNode *b) const
        {
            return a->freq > b->freq;
        }
    };

    void generateCodes(const HuffmanNode *node, const string &prefix, unordered_map<char, string> &codes)
    {
        if (node == nullptr)
        {
            return;
        }

        if (node->isLeaf())
        {
            codes[node->ch] = prefix.empty() ? "0" : prefix;
            return;
        }

        generateCodes(node->left, prefix + "0", codes);
        generateCodes(node->right, prefix + "1", codes);
    }

    void deleteTree(HuffmanNode *node)
    {
        if (node == nullptr)
        {
            return;
        }

        deleteTree(node->left);
        deleteTree(node->right);
        delete node;
    }

} // namespace

HuffmanResult compressDNAHuffman(const string &dna)
{
    HuffmanResult result;
    if (dna.empty())
    {
        return result;
    }

    for (char c : dna)
    {
        result.frequencies[c]++;
    }

    priority_queue<HuffmanNode *, vector<HuffmanNode *>, CompareNode> pq;
    for (const auto &entry : result.frequencies)
    {
        pq.push(new HuffmanNode(entry.first, entry.second));
    }

    // Build Huffman tree by repeatedly merging the two lowest-frequency nodes.
    while (pq.size() > 1)
    {
        HuffmanNode *left = pq.top();
        pq.pop();
        HuffmanNode *right = pq.top();
        pq.pop();
        pq.push(new HuffmanNode(left, right));
    }

    HuffmanNode *root = pq.top();
    generateCodes(root, "", result.codes);

    for (char c : dna)
    {
        result.encodedDNA += result.codes[c];
    }

    deleteTree(root);
    return result;
}

void printHuffmanReport(const HuffmanResult &result, ostream &out)
{
    if (result.frequencies.empty())
    {
        out << "No DNA available for compression.\n";
        return;
    }

    vector<pair<char, string>> sortedCodes(result.codes.begin(), result.codes.end());
    sort(sortedCodes.begin(), sortedCodes.end(), [](const auto &a, const auto &b)
         { return a.first < b.first; });

    out << "Huffman Codes:\n";
    for (const auto &entry : sortedCodes)
    {
        out << entry.first << " -> " << entry.second << "\n";
    }

    out << "Encoded DNA:\n"
        << result.encodedDNA << "\n";

    int symbols = 0;
    for (const auto &entry : result.frequencies)
    {
        symbols += entry.second;
    }

    const int asciiBits = symbols * 8;
    const int compressedBits = static_cast<int>(result.encodedDNA.size());

    out << "Original size (ASCII bits): " << asciiBits << "\n";
    out << "Compressed size (Huffman bits): " << compressedBits << "\n";

    if (asciiBits > 0)
    {
        const double savings = (1.0 - static_cast<double>(compressedBits) / static_cast<double>(asciiBits)) * 100.0;
        out << "Savings vs ASCII: " << fixed << setprecision(2) << savings << "%\n";
    }
}
