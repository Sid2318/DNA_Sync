#include "huffman.h"
#include <bits/stdc++.h>

using namespace std;

struct Node
{
    int id;
    char ch;
    int freq;
    char minSymbol;
    Node *left;
    Node *right;

    Node(int nodeId, char c, int f)
    {
        id = nodeId;
        ch = c;
        freq = f;
        minSymbol = c;
        left = right = nullptr;
    }

    Node(int nodeId, Node *a, Node *b)
    {
        id = nodeId;
        ch = 0;
        freq = a->freq + b->freq;
        minSymbol = min(a->minSymbol, b->minSymbol);
        left = a;
        right = b;
    }
};

struct CompareNode
{
    bool operator()(Node *a, Node *b)
    {
        if (a->freq != b->freq)
        {
            return a->freq > b->freq;
        }

        if (a->minSymbol != b->minSymbol)
        {
            return a->minSymbol > b->minSymbol;
        }

        return a->id > b->id;
    }
};

static void makeCodes(Node *root, string code, unordered_map<char, string> &codes)
{
    if (root == nullptr)
    {
        return;
    }

    if (root->left == nullptr && root->right == nullptr)
    {
        codes[root->ch] = code.empty() ? "0" : code;
        return;
    }

    makeCodes(root->left, code + "0", codes);
    makeCodes(root->right, code + "1", codes);
}

static void captureTree(
    Node *root,
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

    if (root->left == nullptr && root->right == nullptr)
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

static void freeTree(Node *root)
{
    if (root == nullptr)
    {
        return;
    }

    freeTree(root->left);
    freeTree(root->right);
    delete root;
}

HuffmanResult compressDNAHuffman(const string &dna)
{
    HuffmanResult result;
    if (dna.empty())
    {
        return result;
    }

    for (char ch : dna)
    {
        result.frequencies[ch]++;
    }

    priority_queue<Node *, vector<Node *>, CompareNode> pq;
    map<char, int> sortedFrequencies(result.frequencies.begin(), result.frequencies.end());
    int nextNodeId = 1;

    for (auto entry : sortedFrequencies)
    {
        pq.push(new Node(nextNodeId++, entry.first, entry.second));
    }

    while (pq.size() > 1)
    {
        Node *a = pq.top();
        pq.pop();
        Node *b = pq.top();
        pq.pop();
        pq.push(new Node(nextNodeId++, a, b));
    }

    Node *root = pq.top();
    makeCodes(root, "", result.codes);
    captureTree(root, result.codes, result.treeNodes, result.treeEdges);

    for (char ch : dna)
    {
        result.encodedDNA += result.codes[ch];
    }

    result.totalSymbols = dna.size();
    result.originalBits = result.totalSymbols * 8;
    result.compressedBits = result.encodedDNA.size();
    if (result.originalBits > 0)
    {
        result.savingsPercent = (1.0 - (double)result.compressedBits / result.originalBits) * 100.0;
    }

    freeTree(root);
    return result;
}

void printHuffmanReport(const HuffmanResult &result, ostream &out)
{
    if (result.frequencies.empty())
    {
        out << "No DNA available for compression.\n";
        return;
    }

    vector<pair<char, string>> codes(result.codes.begin(), result.codes.end());
    sort(codes.begin(), codes.end());

    out << "Huffman Codes:\n";
    for (auto entry : codes)
    {
        out << entry.first << " -> " << entry.second << "\n";
    }

    out << "Encoded DNA:\n" << result.encodedDNA << "\n";

    out << "Huffman Tree Nodes:\n";
    vector<HuffmanResult::TreeNode> nodes = result.treeNodes;
    sort(nodes.begin(), nodes.end(), [](const HuffmanResult::TreeNode &a, const HuffmanResult::TreeNode &b) {
        return a.id < b.id;
    });

    for (const auto &node : nodes)
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
    vector<HuffmanResult::TreeEdge> edges = result.treeEdges;
    sort(edges.begin(), edges.end(), [](const HuffmanResult::TreeEdge &a, const HuffmanResult::TreeEdge &b) {
        if (a.fromId != b.fromId) return a.fromId < b.fromId;
        if (a.bit != b.bit) return a.bit < b.bit;
        return a.toId < b.toId;
    });

    for (const auto &edge : edges)
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
