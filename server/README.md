# Server (Express API + Static Host)

## Development

1. `cd server`
2. `npm install`
3. Build the C++ executable once: `npm run build-cpp`
4. Start API server: `npm run dev`

By default, the server looks for the executable in these locations (in order):

- `cpp/bin/dna_system.exe`
- `cpp/bin/dna_system`
- `cpp/bin/main.exe`
- `cpp/bin/main`
- `main.exe`
- `main`

Override with environment variable:

- `DNA_EXECUTABLE_PATH` (absolute path or path relative to project root)

## Production-like Start

Run everything from the server folder:

1. `npm install`
2. `npm run start:prod`

`start:prod` performs:

- C++ build (`../cpp/build.ps1`)
- Frontend build (`../frontend`)
- Server start on port `4000` (or `PORT` env var)

## API

- Endpoint: `POST /api/run`
- Body: `{ "input": string, "options": object | string }`
- Response: `{ "output": string }`

The server streams the input into the C++ process stdin and returns stdout. Output size and runtime are guarded to avoid runaway processes.
