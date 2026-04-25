# Frontend (React + Vite)

Development:

1. cd frontend
2. npm install
3. npm run dev

The Vite dev server proxies `/api` requests to `http://localhost:4000`.

## Source Structure

- `src/features/runner/components`: UI components for DNA input and output display
- `src/features/runner/api`: API calls for running the backend executable
- `src/App.jsx`: page-level composition

Build for production:

1. npm run build
2. The build artifacts will be created in `dist`.

Serving the build from the server:

- From the project root you can run the server's production command which builds the frontend and starts the server:
  1.  cd server
  2.  npm run start:prod

  The Express server serves the built files from `frontend/dist`.
