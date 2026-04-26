#include "huffman.h"
#include <bits/stdc++.h>

using namespace std;

struct Node
{
    char ch;
    int freq;
    Node *left;
    Node *right;

    Node(char c, int f)
    {
        ch = c;
        freq = f;
        left = right = nullptr;
    }

    Node(Node *a, Node *b)
    {
        ch = 0;
        freq = a->freq + b->freq;
        left = a;
        right = b;
    }
};

struct CompareNode
{
    bool operator()(Node *a, Node *b)
    {
        return a->freq > b->freq;
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
    for (auto entry : result.frequencies)
    {
        pq.push(new Node(entry.first, entry.second));
    }

    while (pq.size() > 1)
    {
        Node *a = pq.top();
        pq.pop();
        Node *b = pq.top();
        pq.pop();
        pq.push(new Node(a, b));
    }

    Node *root = pq.top();
    makeCodes(root, "", result.codes);

    for (char ch : dna)
    {
        result.encodedDNA += result.codes[ch];
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

    int symbols = 0;
    for (auto entry : result.frequencies)
    {
        symbols += entry.second;
    }

    int asciiBits = symbols * 8;
    int compressedBits = result.encodedDNA.size();

    out << "Original size (ASCII bits): " << asciiBits << "\n";
    out << "Compressed size (Huffman bits): " << compressedBits << "\n";

    if (asciiBits > 0)
    {
        double saved = (1.0 - (double)compressedBits / asciiBits) * 100.0;
        out << "Savings vs ASCII: " << fixed << setprecision(2) << saved << "%\n";
    }
}
