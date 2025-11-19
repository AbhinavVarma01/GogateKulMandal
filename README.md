# GogateKulMandal

A collection of tools and apps for managing and visualizing the Gogate family (Kul Mandal). This repository contains a Node.js backend API, a React frontend (family tree UI), and several utility scripts used for importing/syncing member data and running maintenance tasks.

## Key Features
- Interactive family-tree visualization component (React).
- API server for members, authentication and media uploads (Node.js / Express).
- Utilities for importing and synchronizing members with MongoDB.
- Vansh-based filtering and special Gogte-lineage rules implemented in the frontend tree component.

## Tech stack
- Backend: Node.js, Express, MongoDB (`mongodb` driver), `multer` for uploads, `jsonwebtoken`, `bcryptjs`.
- Frontend: React (Create React App), `react-organizational-chart`, `d3`, Tailwind CSS, `axios`.
- Dev / tooling: `nodemon`, PostCSS / Tailwind, i18n libraries.

## Repository layout
- `backend/` — API server and related scripts (`server.js`, authentication middleware, utilities). Uses MongoDB for persistence.
- `frontend/` — React app (Create React App) containing the family tree UI, components and pages.
- `form/` — notes and client-side autocomplete docs for form features.
- `IMPLEMENTATION_SUMMARY.md` — high-level notes and details about the `FilteredVanshTree` component and integration instructions.
- Other tools and scripts for importing, syncing and verifying members are present in other directories (search for `sync`, `populate`, `verify`).

## Quick start (development)
Prerequisites: Node.js (>=16), npm, MongoDB.

1. Start the backend API

```powershell
cd backend
npm install
# create a `.env` with MONGODB_URI and JWT_SECRET (and any Google API creds if used)
npm run dev
```

The frontend is configured to proxy API requests to `http://localhost:4000` by default — ensure the backend listens on that port (check `backend/server.js`).

2. Start the frontend

```powershell
cd frontend
npm install
npm start
```

Open `http://localhost:3000` to view the app.

## Environment variables
Create a `.env` file in `backend/` with at least the following values:

```
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
PORT=4000
# Optional: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, other keys used by the project
```

## Notes and important docs
- For details about the personalized vansh filtering and Gogte lineage rules, see `IMPLEMENTATION_SUMMARY.md` and `FILTERED_VANSH_TREE_GUIDE.md`.
- The frontend contains a ready-made `README.md` (Create React App default) — replace or extend it for deployment instructions.
- Several utility scripts live under `server/` and `backend/` for verification, syncing and population of members. Search for `sync-members`, `populate-members` and `verify-members`.

## Contribution
Contributions and fixes are welcome. Please open issues or PRs describing the change. When contributing:

- Follow existing code style in each folder.
- Provide a short description of what you changed and why.
- Include steps to reproduce or verify changes when applicable.

## License
This repository currently has no license file. If you want to add one, consider adding an `LICENSE` file (for example, MIT) to make reuse and contributions clear.

## Contact / Author
Repository owner: AbhinavVarma01
