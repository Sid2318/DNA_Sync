# DNA Analysis System

This repository is now organized by feature so each part of the system is easy to find, build, and maintain.

## Project Layout

```text
dna_project/
|-- cpp/
|   |-- app/
|   |   |-- main.cpp
|   |-- features/
|   |   |-- analysis/
|   |   |   |-- analysis.cpp
|   |   |   |-- analysis.h
|   |   |-- codon/
|   |   |   |-- codon.cpp
|   |   |   |-- codon.h
|   |   |-- dp/
|   |   |   |-- dp_module.cpp
|   |   |   |-- dp_module.h
|   |   |-- huffman/
|   |   |   |-- huffman.cpp
|   |   |   |-- huffman.h
|   |   |-- z/
|   |       |-- z_module.cpp
|   |       |-- z_module.h
|   |-- data/
|   |   |-- dna.txt
|   |   |-- codon.txt
|   |-- logs/
|   |   |-- output.txt
|   |-- bin/
|   |   |-- dna_system.exe (generated)
|   |-- build.ps1
|
|-- frontend/
|   |-- src/
|   |   |-- features/
|   |   |   |-- runner/
|   |   |       |-- api/
|   |   |       |   |-- runTool.js
|   |   |       |-- components/
|   |   |           |-- DNAInput.jsx
|   |   |           |-- ResultCard.jsx
|   |   |-- App.jsx
|   |   |-- App.css
|   |   |-- main.jsx
|   |-- package.json
|   |-- vite.config.js
|
|-- server/
|   |-- src/
|   |   |-- config/
|   |   |   |-- paths.js
|   |   |-- routes/
|   |   |   |-- runRoute.js
|   |   |-- services/
|   |   |   |-- runDnaProcess.js
|   |   |-- index.js
|   |-- package.json
|   |-- index.js
```

## C++ Build

From project root:

```powershell
cd cpp
./build.ps1
```

Output executable:

- `cpp/bin/dna_system.exe`

## Run Full Stack

### 1. Start server (builds C++ + frontend)

```powershell
cd server
npm install
npm run start:prod
```

### 2. Frontend dev-only mode (optional)

Run backend server first, then in another terminal:

```powershell
cd frontend
npm install
npm run dev
```

The frontend proxies `/api/*` to `http://localhost:4000`.

## Notes

- C++ app now resolves data/log file paths from the new folders automatically.
- Server resolves executable path from `cpp/bin` by default.
- You can override executable lookup with `DNA_EXECUTABLE_PATH`.
