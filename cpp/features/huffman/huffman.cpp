#include "huffman.h"
#include <bits/stdc++.h>

using namespace std;

struct HuffmanNode
{
    int id;
    char ch;
    int freq;
    char minSymbol;
    HuffmanNode *left;
    HuffmanNode *right;

    HuffmanNode(int nodeId, char c, int f)
    {
        id = nodeId;
        ch = c;
        freq = f;
        minSymbol = c;
        left = right = nullptr;
    }

    HuffmanNode(int nodeId, HuffmanNode *leftChild, HuffmanNode *rightChild)
    {
        id = nodeId;
        ch = 0;
        freq = leftChild->freq + rightChild->freq;
        minSymbol = min(leftChild->minSymbol, rightChild->minSymbol);
        left = leftChild;
        right = rightChild;
    }
};

static bool isLeaf(const HuffmanNode *node)
{
    return node != nullptr && node->left == nullptr && node->right == nullptr;
}

struct MinHeapNodeOrder
{
    bool operator()(HuffmanNode *left, HuffmanNode *right) const
    {
        if (left->freq != right->freq)
        {
            return left->freq > right->freq;
        }

        if (left->minSymbol != right->minSymbol)
        {
            return left->minSymbol > right->minSymbol;
        }

        return left->id > right->id;
    }
};

// Time: O(k), Space: O(h) recursion stack, where k = unique symbols and h = tree height
static void buildCodesFromTree(HuffmanNode *root, string &path, unordered_map<char, string> &codes)
{
    if (root == nullptr)
    {
        return;
    }

    if (isLeaf(root))
    {
        codes[root->ch] = path.empty() ? "0" : path;
        return;
    }

    path.push_back('0');
    buildCodesFromTree(root->left, path, codes);
    path.pop_back();

    path.push_back('1');
    buildCodesFromTree(root->right, path, codes);
    path.pop_back();
}

// Time: O(k), Space: O(k)
static void captureTree(
    HuffmanNode *root,
    const unordered_map<char, string> &codes,
    vector<HuffmanResult::TreeNode> &nodes,
    vector<HuffmanResult::TreeEdge> &edges)
{
    if (root == nullptr)
    {
        return;
    }

    HuffmanResult::TreeNode view;
    view.id = root->id;
    view.frequency = root->freq;
    view.symbol = root->ch;

    if (root->left != nullptr)
    {
        view.leftId = root->left->id;
        edges.push_back({root->id, root->left->id, '0'});
    }

    if (root->right != nullptr)
    {
        view.rightId = root->right->id;
        edges.push_back({root->id, root->right->id, '1'});
    }

    if (isLeaf(root))
    {
        auto it = codes.find(root->ch);
        if (it != codes.end())
        {
            view.code = it->second;
        }
    }

    nodes.push_back(view);
    captureTree(root->left, codes, nodes, edges);
    captureTree(root->right, codes, nodes, edges);
}

// Time: O(k), Space: O(h)
static void destroyTree(HuffmanNode *root)
{
    if (root == nullptr)
    {
        return;
    }

    destroyTree(root->left);
    destroyTree(root->right);
    delete root;
}

// Time: O(n + k log k), Space: O(n + k), where n = dna length, k = unique symbols
HuffmanResult compressDNAHuffman(const string &dna)
{
    HuffmanResult result;
    if (dna.empty())
    {
        return result;
    }

    result.frequencies.reserve(8);
    for (char ch : dna)
    {
        result.frequencies[ch]++;
    }

    priority_queue<HuffmanNode *, vector<HuffmanNode *>, MinHeapNodeOrder> minHeap;
    vector<pair<char, int>> sortedFrequencies(result.frequencies.begin(), result.frequencies.end());
    sort(sortedFrequencies.begin(), sortedFrequencies.end());

    result.codes.reserve(result.frequencies.size());
    result.treeNodes.reserve(result.frequencies.size() * 2);
    result.treeEdges.reserve(result.frequencies.size() * 2);

    int nextNodeId = 1;

    for (const auto &entry : sortedFrequencies)
    {
        minHeap.push(new HuffmanNode(nextNodeId++, entry.first, entry.second));
    }

    while (minHeap.size() > 1)
    {
        HuffmanNode *leftChild = minHeap.top();
        minHeap.pop();
        HuffmanNode *rightChild = minHeap.top();
        minHeap.pop();
        minHeap.push(new HuffmanNode(nextNodeId++, leftChild, rightChild));
    }

    HuffmanNode *root = minHeap.top();
    string path;
    buildCodesFromTree(root, path, result.codes);
    captureTree(root, result.codes, result.treeNodes, result.treeEdges);

    size_t estimatedBits = 0;
    for (const auto &entry : result.frequencies)
    {
        auto it = result.codes.find(entry.first);
        if (it != result.codes.end())
        {
            estimatedBits += static_cast<size_t>(entry.second) * it->second.size();
        }
    }

    result.encodedDNA.reserve(estimatedBits);

    for (char symbol : dna)
    {
        result.encodedDNA += result.codes.at(symbol);
    }

    result.totalSymbols = dna.size();
    result.originalBits = result.totalSymbols * 8;
    result.compressedBits = result.encodedDNA.size();
    if (result.originalBits > 0)
    {
        result.savingsPercent = (1.0 - (double)result.compressedBits / result.originalBits) * 100.0;
    }

    destroyTree(root);
    return result;
}

// Time: O(k log k + n), Space: O(k)
void printHuffmanReport(const HuffmanResult &result, ostream &out)
{
    if (result.frequencies.empty())
    {
        out << "No DNA available for compression.\n";
        return;
    }

    vector<pair<char, string>> sortedCodes(result.codes.begin(), result.codes.end());
    sort(sortedCodes.begin(), sortedCodes.end());

    out << "Huffman Codes:\n";
    for (const auto &entry : sortedCodes)
    {
        out << entry.first << " -> " << entry.second << "\n";
    }

    out << "Encoded DNA:\n"
        << result.encodedDNA << "\n";

    out << "Huffman Tree Nodes:\n";
    vector<HuffmanResult::TreeNode> sortedNodes = result.treeNodes;
    sort(sortedNodes.begin(), sortedNodes.end(), [](const HuffmanResult::TreeNode &a, const HuffmanResult::TreeNode &b)
         { return a.id < b.id; });

    for (const auto &node : sortedNodes)
    {
        out << "Node " << node.id << ": ";
        if (node.symbol != 0)
        {
            out << node.symbol;
        }
        else
        {
            out << "internal";
        }

        out << ", freq=" << node.frequency;
        if (!node.code.empty())
        {
            out << ", code=" << node.code;
        }
        if (node.leftId != -1)
        {
            out << ", left=" << node.leftId;
        }
        if (node.rightId != -1)
        {
            out << ", right=" << node.rightId;
        }
        out << "\n";
    }

    out << "Huffman Tree Edges:\n";
    vector<HuffmanResult::TreeEdge> sortedEdges = result.treeEdges;
    sort(sortedEdges.begin(), sortedEdges.end(), [](const HuffmanResult::TreeEdge &a, const HuffmanResult::TreeEdge &b)
         {
        if (a.fromId != b.fromId) return a.fromId < b.fromId;
        if (a.bit != b.bit) return a.bit < b.bit;
        return a.toId < b.toId; });

    for (const auto &edge : sortedEdges)
    {
        out << edge.fromId << " -" << edge.bit << "-> " << edge.toId << "\n";
    }

    out << "Original size (ASCII bits): " << result.originalBits << "\n";
    out << "Compressed size (Huffman bits): " << result.compressedBits << "\n";

    if (result.originalBits > 0)
    {
        out << "Savings vs ASCII: " << fixed << setprecision(2) << result.savingsPercent << "%\n";
    }
}
