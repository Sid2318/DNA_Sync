$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$binDir = Join-Path $PSScriptRoot 'bin'

if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir | Out-Null
}

$sourceFiles = @(
    (Join-Path $projectRoot 'cpp/app/main.cpp'),
    (Join-Path $projectRoot 'cpp/features/z/z_module.cpp'),
    (Join-Path $projectRoot 'cpp/features/dp/dp_module.cpp'),
    (Join-Path $projectRoot 'cpp/features/huffman/huffman.cpp'),
    (Join-Path $projectRoot 'cpp/features/codon/codon.cpp'),
    (Join-Path $projectRoot 'cpp/features/analysis/analysis.cpp')
)

$outputFile = Join-Path $binDir 'dna_system.exe'

& g++ -std=c++17 -O2 -Wall -Wextra -pedantic @sourceFiles -o $outputFile

Write-Host "Built executable: $outputFile"
