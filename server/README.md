1. cd server
2. npm install
3. Set `exePath` in `index.js` to point to your compiled C++ executable (e.g. `../dna_project/main.exe`)
4. npm run dev

Production build & serve:

- Build frontend and start server in one step:

	1. cd server
	2. npm install
	3. npm run start:prod

	This runs `npm ci` in the `frontend` folder, builds the static site into `frontend/dist`, and starts the Express server which serves the built assets and the API on port 4000.

POST /api/run expects JSON: `{ input: string, options: object }` and will spawn the executable, send `input` to stdin, and return stdout.
