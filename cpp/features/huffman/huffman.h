#ifndef HUFFMAN_H
#define HUFFMAN_H

#include <bits/stdc++.h>
using namespace std;

struct HuffmanResult
{
    unordered_map<char, string> codes;
    string encodedDNA;
    unordered_map<char, int> frequencies;
    int totalSymbols = 0;
    int originalBits = 0;
    int compressedBits = 0;
    double savingsPercent = 0.0;

    struct TreeNode
    {
        int id = 0;
        int frequency = 0;
        char symbol = 0;
        string code;
        int leftId = -1;
        int rightId = -1;
    };

    struct TreeEdge
    {
        int fromId = 0;
        int toId = 0;
        char bit = '0';
    };

    vector<TreeNode> treeNodes;
    vector<TreeEdge> treeEdges;
};

HuffmanResult compressDNAHuffman(const string &dna);
void printHuffmanReport(const HuffmanResult &result, ostream &out);

#endif
