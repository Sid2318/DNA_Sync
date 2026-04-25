#ifndef HUFFMAN_H
#define HUFFMAN_H

#include <ostream>
#include <string>
#include <unordered_map>

using namespace std;

struct HuffmanResult
{
    unordered_map<char, string> codes;
    string encodedDNA;
    unordered_map<char, int> frequencies;
};

HuffmanResult compressDNAHuffman(const string &dna);
void printHuffmanReport(const HuffmanResult &result, ostream &out);

#endif
